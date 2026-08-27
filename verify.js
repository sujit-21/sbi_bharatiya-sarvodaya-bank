const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./backend/server');
const db = require('./backend/db/database');

const PORT = process.env.TEST_PORT || 5098; // Run test server on separate port to avoid conflicts
let server;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });
}

function stopServer() {
  if (server) {
    server.close();
    console.log(`[TEST SERVER] Stopped.`);
  }
}

// HTTP request wrapper for testing
function makeRequest(path, method = 'GET', body = null, token = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payloadString = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      'x-device-id': 'test-runner-id',
      'x-device-fingerprint': 'test-runner-fingerprint',
      'x-csrf-token': 'bank-csrf-secret-token-key',
      ...headers
    };

    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payloadString);
    }

    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => { resData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(payloadString);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=================================================');
  console.log('RUNNING AUTOMATED CBS ECOSYSTEM VALIDATION');
  console.log('=================================================');

  // Clear previous DB file to start fresh
  const dbPath = path.join(__dirname, 'backend/db/db.json');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('[DATABASE] Cleaned active db.json for fresh seeding.');
    // Force database to reload/reseed
    db.init();
  }
  
  await startServer();
  let passed = true;

  try {
    // Test 1: Public Health API check
    console.log('\n[TEST 1] Verifying Public Health check...');
    const health = await makeRequest('/api/health');
    if (health.status === 200 && health.data.status === 'healthy') {
      console.log('✅ Health check passed.');
    } else {
      console.log('❌ Health check failed.', health);
      passed = false;
    }

    // Test 2: Admin Authentication (Direct Login, No 2FA)
    console.log('\n[TEST 2] Verifying Admin login...');
    const auth1 = await makeRequest('/admin/login', 'POST', {
      email: 'admin@bank.com',
      password: 'Admin123!',
      role: 'Super Admin',
      deviceId: 'test-runner-id'
    });

    let adminToken = '';
    if (auth1.status === 200 && auth1.data.token) {
      adminToken = auth1.data.token;
      console.log('✅ Admin authentication verified successfully.');
    } else {
      console.log('❌ Admin login failed.', auth1);
      passed = false;
    }

    // Test 3: Customer Login
    console.log('\n[TEST 3] Verifying Customer login...');
    const custAuth = await makeRequest('/customer/login', 'POST', {
      email: 'customer@bank.com',
      password: 'Customer123!',
      role: 'Customer',
      deviceId: 'test-runner-id'
    });

    let custToken = '';
    if (custAuth.status === 200 && custAuth.data.token) {
      custToken = custAuth.data.token;
      console.log('✅ Customer authentication successful.');
    } else {
      console.log('❌ Customer login failed.', custAuth);
      passed = false;
    }

    // Test 3B: Verify Strict Portal Separation Enforcement
    console.log('\n[TEST 3B] Verifying Strict Portal Separation (Admin cannot login to Customer page & vice-versa)...');
    
    // Attempt 1: Admin attempts to log into Customer portal endpoint
    const adminOnCustPortal = await makeRequest('/customer/login', 'POST', {
      email: 'admin@bank.com',
      password: 'Admin123!',
      portal: 'customer',
      deviceId: 'test-runner-id'
    });
    if (adminOnCustPortal.status === 403) {
      console.log('✅ Admin blocked from Customer portal login (403 Forbidden).');
    } else {
      console.log('❌ Admin was incorrectly allowed on Customer portal!', adminOnCustPortal);
      passed = false;
    }

    // Attempt 2: Customer attempts to log into Headquarter portal endpoint
    const custOnHqPortal = await makeRequest('/admin/login', 'POST', {
      email: 'customer@bank.com',
      password: 'Customer123!',
      portal: 'headquarter',
      deviceId: 'test-runner-id'
    });
    if (custOnHqPortal.status === 403) {
      console.log('✅ Customer blocked from Headquarter portal login (403 Forbidden).');
    } else {
      console.log('❌ Customer was incorrectly allowed on Headquarter portal!', custOnHqPortal);
      passed = false;
    }

    // Attempt 3: Customer attempts to log into Branch / Employee portal endpoint
    const custOnBranchPortal = await makeRequest('/employee/login', 'POST', {
      email: 'customer@bank.com',
      password: 'Customer123!',
      portal: 'branch',
      deviceId: 'test-runner-id'
    });
    if (custOnBranchPortal.status === 403) {
      console.log('✅ Customer blocked from Branch / Employee portal login (403 Forbidden).');
    } else {
      console.log('❌ Customer was incorrectly allowed on Branch portal!', custOnBranchPortal);
      passed = false;
    }

    // Test 4: Role-Based Route Protection (RBAC)
    console.log('\n[TEST 4] Verifying RBAC protection...');
    // Customer attempts to read Admin users list
    const rbacCheck = await makeRequest('/api/dashboard/users', 'GET', null, custToken);
    if (rbacCheck.status === 403) {
      console.log('✅ RBAC check blocked unauthorized access (403 Forbidden).');
    } else {
      console.log('❌ RBAC check failed. Customer accessed Admin route.', rbacCheck);
      passed = false;
    }

    // Test 5: Core banking (CBS) Transaction & Ledger Double Entry
    console.log('\n[TEST 5] Verifying Counter Deposit & General Ledger updates...');
    
    // Check initial General Ledger cash balance for Teller drawer (1020)
    const beforeLedger = db.findOne('generalLedger', g => g.code === '1020');
    const beforeBal = beforeLedger.balance;

    // Teller logs in to perform transaction
    const tellerAuth = await makeRequest('/employee/login', 'POST', {
      email: 'teller@bank.com',
      password: 'Teller123!',
      role: 'Employee',
      deviceId: 'test-runner-id'
    });
    const tellerToken = tellerAuth.data.token;

    // Deposit $5000 to customer account 1000987654
    const depositTx = await makeRequest('/api/dashboard/transactions', 'POST', {
      toAccountNumber: '1000987654',
      amount: 5000,
      type: 'deposit',
      description: 'Test Verification Deposit'
    }, tellerToken);

    if (depositTx.status === 201) {
      const afterLedger = db.findOne('generalLedger', g => g.code === '1020');
      const custAcc = db.findOne('accounts', a => a.accountNumber === '1000987654');

      if (afterLedger.balance === beforeBal + 5000 && custAcc.balance === 155000) {
        console.log('✅ Deposit completed. Vault asset and customer liability reconciled.');
      } else {
        console.log('❌ Reconcile values mismatch.', { ledger: afterLedger.balance, customer: custAcc.balance });
        passed = false;
      }
    } else {
      console.log('❌ Deposit transaction failed.', depositTx);
      passed = false;
    }

    // Test 6: Interest calculations engine manual trigger
    console.log('\n[TEST 6] Verifying Interest Calculation scheduler trigger...');
    const interestTrigger = await makeRequest('/api/interest/post', 'POST', null, adminToken);
    if (interestTrigger.status === 200 && interestTrigger.data.postingsGenerated) {
      console.log(`✅ Interest batch completed. Postings: ${interestTrigger.data.postingsGenerated.length}`);
    } else {
      console.log('❌ Interest calculation failed.', interestTrigger);
      passed = false;
    }

    // Test 7: Fraud Detection velocity block
    console.log('\n[TEST 7] Verifying Fraud Platform transaction evaluation...');
    // Request a large transaction size trigger
    const fraudTx = await makeRequest('/api/dashboard/transactions', 'POST', {
      fromAccountNumber: '1000987654',
      toAccountNumber: '2000123456',
      amount: 60000, // Large amount threshold (>50000) triggers risk
      type: 'transfer',
      description: 'Fraud Test transfer',
      pin: '987654'
    }, custToken);

    if (fraudTx.status === 400 && fraudTx.data.message.includes('Fraud')) {
      console.log('✅ Transaction successfully blocked by Fraud Engine.');
      console.log(`   Analysis details: Risk score ${fraudTx.data.riskAnalysis.score} (${fraudTx.data.riskAnalysis.severity} severity).`);
    } else {
      console.log('❌ Fraud evaluator did not block high-risk transaction.', fraudTx);
      passed = false;
    }

    // Test 8: Disaster Recovery Backups
    console.log('\n[TEST 8] Verifying Disaster Recovery snapshots...');
    const backup = await makeRequest('/api/system/backups', 'POST', { type: 'manual' }, adminToken);
    if (backup.status === 201 && backup.data.backup) {
      console.log(`✅ Database backup created: ${backup.data.backup.filename}`);
    } else {
      console.log('❌ Backup system failed.', backup);
      passed = false;
    }

    // Test 9: Centralized Dynamic User Provisioning & Dynamic RBAC Scope Verification
    console.log('\n[TEST 9] Verifying Centralized User Provisioning, Activation & Scope Enforcement...');
    
    // 9.1 Super Admin provisions Auditor
    const provResponse = await makeRequest('/api/auth/provision', 'POST', {
      email: 'auditor_test@bank.com',
      fullName: 'Test Auditor Agent',
      role: 'Auditor',
      branchId: 'b-main'
    }, adminToken);

    let tempPw = '';
    if (provResponse.status === 201 && provResponse.data.tempPassword) {
      tempPw = provResponse.data.tempPassword;
      console.log(`✅ Super Admin provisioned Auditor successfully. Temp Password: ${tempPw}`);
    } else {
      console.log('❌ Failed to provision Auditor.', provResponse);
      passed = false;
    }

    // 9.2 Attempt login with temporary password (verify forcePasswordChange flag)
    const loginTemp = await makeRequest('/employee/login', 'POST', {
      email: 'auditor_test@bank.com',
      password: tempPw,
      role: 'Employee',
      deviceId: 'test-runner-id'
    });

    if (loginTemp.status === 200 && loginTemp.data.user && loginTemp.data.user.forcePasswordChange === true) {
      console.log('✅ Temporary login successful, forcePasswordChange flag detected.');
    } else {
      console.log('❌ Temporary login failed or did not return forcePasswordChange flag.', loginTemp);
      passed = false;
    }

    // 9.3 Try to access users list endpoint using temporary token (verify blocked before activation)
    const tempToken = loginTemp.data.token;
    const testTempBlocked = await makeRequest('/api/dashboard/users', 'GET', null, tempToken);
    if (testTempBlocked.status === 403 && testTempBlocked.data.code === 'FORCE_PASSWORD_CHANGE') {
      console.log('✅ Access blocked for temporary session before password change activation.');
    } else {
      console.log('❌ Temp session not blocked or returned incorrect status.', testTempBlocked);
      passed = false;
    }

    // 9.4 Activate the account with new master password
    const activateResponse = await makeRequest('/api/auth/activate-provisioned', 'POST', {
      email: 'auditor_test@bank.com',
      tempPassword: tempPw,
      newPassword: 'AuditorNewMaster123!'
    });

    if (activateResponse.status === 200) {
      console.log('✅ Account activated successfully with new master password.');
    } else {
      console.log('❌ Failed to activate account.', activateResponse);
      passed = false;
    }

    // 9.5 Log in using new master password
    const loginFinal = await makeRequest('/employee/login', 'POST', {
      email: 'auditor_test@bank.com',
      password: 'AuditorNewMaster123!',
      role: 'Employee',
      deviceId: 'test-runner-id'
    });

    let finalAuditorToken = '';
    if (loginFinal.status === 200 && loginFinal.data.token) {
      finalAuditorToken = loginFinal.data.token;
      console.log('✅ Logged in successfully with new master password.');
    } else {
      console.log('❌ Final login failed with new credentials.', loginFinal);
      passed = false;
    }

    // 9.6 Check Dynamic RBAC permissions and module-based access validation
    // Auditor has access to ledger (Read Ledger)
    const ledgerCheck = await makeRequest('/api/accounting/ledger', 'GET', null, finalAuditorToken);
    if (ledgerCheck.status === 200) {
      console.log('✅ Auditor successfully read General Ledger (Authorized module/permission).');
    } else {
      console.log('❌ Auditor ledger read blocked.', ledgerCheck);
      passed = false;
    }

    // Auditor does NOT have access to users (Read Users registry)
    const usersCheck = await makeRequest('/api/dashboard/users', 'GET', null, finalAuditorToken);
    if (usersCheck.status === 403) {
      console.log('✅ Auditor read Users registry successfully blocked (Unauthorized module/permission).');
    } else {
      console.log('❌ Auditor accessed unauthorized users registry.', usersCheck);
      passed = false;
    }

    // Test 10: Admin Branch CRUD Operations
    console.log('\n[TEST 10] Verifying Admin Branch CRUD Operations...');
    // 10.1 Create Branch
    const testBranchCode = 'TEST999';
    const createBranchRes = await makeRequest('/api/branches', 'POST', {
      name: 'Automated Test Branch',
      code: testBranchCode,
      address: '999 Sandbox Ave, Test City, TS',
      vaultBalance: 2500000,
      minVaultLimit: 500000,
      maxVaultLimit: 10000000,
      cashInHand: 100000
    }, adminToken);

    let createdBranchId = '';
    if (createBranchRes.status === 201 && createBranchRes.data && createBranchRes.data.id) {
      createdBranchId = createBranchRes.data.id;
      console.log(`   ✅ Branch created successfully with ID: ${createdBranchId}`);
    } else {
      console.log('   ❌ Failed to create branch.', createBranchRes);
      passed = false;
    }

    if (createdBranchId) {
      // 10.2 Get Branches List
      const getBranchesRes = await makeRequest('/api/branches', 'GET', null, adminToken);
      if (getBranchesRes.status === 200 && Array.isArray(getBranchesRes.data)) {
        const found = getBranchesRes.data.find(b => b.id === createdBranchId);
        if (found && found.address === '999 Sandbox Ave, Test City, TS') {
          console.log('   ✅ Branch successfully listed in branch registry with correct address.');
        } else {
          console.log('   ❌ Branch not found in list or address mismatched.', found);
          passed = false;
        }
      } else {
        console.log('   ❌ Failed to get branches list.', getBranchesRes);
        passed = false;
      }

      // 10.3 Update Branch Address
      const updatedAddress = '888 Updated St, Test City, TS';
      const updateBranchRes = await makeRequest(`/api/branches/${createdBranchId}`, 'PUT', {
        name: 'Automated Test Branch Updated',
        code: testBranchCode,
        address: updatedAddress,
        vaultBalance: 3000000,
        minVaultLimit: 500000,
        maxVaultLimit: 10000000,
        cashInHand: 150000
      }, adminToken);

      if (updateBranchRes.status === 200 && updateBranchRes.data && updateBranchRes.data.address === updatedAddress) {
        console.log('   ✅ Branch address successfully updated.');
      } else {
        console.log('   ❌ Failed to update branch details.', updateBranchRes);
        passed = false;
      }

      // 10.4 Delete Branch
      const deleteBranchRes = await makeRequest(`/api/branches/${createdBranchId}`, 'DELETE', null, adminToken);
      if (deleteBranchRes.status === 200) {
        // Double check deletion
        const checkDeleteRes = await makeRequest('/api/branches', 'GET', null, adminToken);
        const stillExists = checkDeleteRes.data.some(b => b.id === createdBranchId);
        if (!stillExists) {
          console.log('   ✅ Branch successfully deleted from branch registry.');
        } else {
          console.log('   ❌ Deleted branch still exists in branch registry.');
          passed = false;
        }
      } else {
        console.log('   ❌ Failed to delete branch.', deleteBranchRes);
        passed = false;
      }
    }

  } catch (err) {
    console.error('❌ Integration tests faulted with exception:', err);
    passed = false;
  }

  stopServer();

  console.log('\n=================================================');
  if (passed) {
    console.log('🎉 ALL AUTOMATED TESTS COMPLETED SUCCESSFULLY!');
    console.log('=================================================');
    process.exit(0);
  } else {
    console.log('⚠️ SOME VALIDATION CHECKS ENCOUNTERED ERRORS!');
    console.log('=================================================');
    process.exit(1);
  }
}

runTests();
