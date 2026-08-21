// Application State
const state = {
  token: localStorage.getItem('token') || null,
  csrfToken: localStorage.getItem('csrfToken') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  currentRole: 'Super Admin',
  activeTab: 'summary',
  charts: {}
};

const getApiUrl = (endpoint) => {
  if (!endpoint) return '';
  if (endpoint.startsWith('http')) return endpoint;
  if (endpoint.startsWith('/')) return endpoint;
  return `/${endpoint}`;
};

// Device fingerprinting configurations
const getDeviceHeaders = () => {
  const devId = document.getElementById('sim-device-id');
  const fp = document.getElementById('sim-fingerprint');
  return {
    'x-device-id': devId ? devId.value : 'dev-desktop-win',
    'x-device-fingerprint': fp ? fp.value : 'fingerprint_hash_123',
    'x-csrf-token': state.csrfToken || 'bank-csrf-secret-token-key'
  };
};

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkRememberedUser();
  checkAuthSession();
  initDevLinks();

  // Safety guarantee: ensure UI container is visible
  setTimeout(() => {
    const authC = document.getElementById('auth-container');
    const dashC = document.getElementById('dashboard-container');
    if (authC && dashC && authC.classList.contains('hidden') && dashC.classList.contains('hidden')) {
      showAuth();
    }
  }, 100);
});

function checkRememberedUser() {
  try {
    const isRemembered = localStorage.getItem('branch_remember_me') === 'true';
    const rememberedEmail = localStorage.getItem('branch_remember_email');
    const emailEl = document.getElementById('login-email');
    const rememberEl = document.getElementById('remember-me');
    if (isRemembered && rememberedEmail && emailEl) {
      emailEl.value = rememberedEmail;
      if (rememberEl) rememberEl.checked = true;
    }
  } catch (e) {}
}

function initDevLinks() {
  const engineLink = document.getElementById('engine-url-link');
  const swaggerLink = document.getElementById('swagger-url-link');
  if (engineLink) {
    const apiBase = (window.location.port === '5000') ? window.location.origin : 'http://localhost:5000';
    engineLink.href = apiBase;
    engineLink.innerText = apiBase;
  }
  if (swaggerLink) {
    swaggerLink.href = getApiUrl('/api/developer/swagger');
  }
}

// Toast Notifications System
function showToast(message, type = 'primary') {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// Toggle Device simulator setting
function toggleDeviceSim() {
  const fields = document.getElementById('device-sim-fields');
  fields.classList.toggle('hidden');
}

// Handle role tabs on auth page
function initEventListeners() {
  const tabs = document.querySelectorAll('.role-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      state.currentRole = e.target.getAttribute('data-role');
      
      // Toggle visibility of register links based on role
      const signupText = document.getElementById('auth-signup-text');
      const merchantText = document.getElementById('auth-merchant-text');
      const signinText = document.getElementById('auth-signin-text');
      
      signupText.classList.add('hidden');
      merchantText.classList.add('hidden');
      signinText.classList.add('hidden');

      showLoginForm();

      if (state.currentRole === 'Customer') {
        signupText.classList.remove('hidden');
      } else if (state.currentRole === 'Merchant') {
        merchantText.classList.remove('hidden');
      }
    });
  });

  // Auth toggle links
  const toggleSignup = document.getElementById('auth-toggle-signup');
  if (toggleSignup) toggleSignup.addEventListener('click', (e) => { e.preventDefault(); showCustomerSignupForm(); });
  
  const toggleMerchant = document.getElementById('auth-toggle-merchant');
  if (toggleMerchant) toggleMerchant.addEventListener('click', (e) => { e.preventDefault(); showMerchantSignupForm(); });

  const toggleLogin = document.getElementById('auth-toggle-login');
  if (toggleLogin) toggleLogin.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });

  // Form Submissions
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const custForm = document.getElementById('customer-register-form');
  if (custForm) custForm.addEventListener('submit', handleCustomerRegister);

  const merchForm = document.getElementById('merchant-register-form');
  if (merchForm) merchForm.addEventListener('submit', handleMerchantRegister);

  const otpForm = document.getElementById('otp-submit-form');
  if (otpForm) otpForm.addEventListener('submit', handleOtpVerify);

  const kycForm = document.getElementById('kyc-submit-form');
  if (kycForm) kycForm.addEventListener('submit', handleKycSubmit);

  const forcePwdForm = document.getElementById('force-password-form');
  if (forcePwdForm) forcePwdForm.addEventListener('submit', handleForcePasswordChange);
  
  const editUserForm = document.getElementById('edit-user-form');
  if (editUserForm) editUserForm.addEventListener('submit', handleEditUserSubmit);
  const transferBranchForm = document.getElementById('transfer-branch-form');
  if (transferBranchForm) transferBranchForm.addEventListener('submit', handleTransferBranchSubmit);
}

// Check if user is logged in
function checkAuthSession() {
  if (state.token && state.user) {
    showDashboard();
  } else {
    showAuth();
  }
}

// Switch auth views
// Switch auth views
function showLoginForm() {
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('customer-signup-flow').classList.add('hidden');
  document.getElementById('merchant-signup-flow').classList.add('hidden');
  document.getElementById('otp-verify-pane').classList.add('hidden');
  document.getElementById('kyc-submit-pane').classList.add('hidden');
  document.getElementById('force-password-pane').classList.add('hidden');
  document.getElementById('auth-signin-text').classList.add('hidden');

  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const group2FA = document.getElementById('2fa-input-group');
  const code2FAInput = document.getElementById('login-2fa');

  const normRole = normalizeRole(state.currentRole);
  if (normRole === 'Super Admin') {
    if (emailInput) emailInput.value = 'admin@bank.com';
    if (passInput) passInput.value = 'Admin123!';
    if (group2FA) group2FA.classList.remove('hidden');
    if (code2FAInput) code2FAInput.value = '123456';
  } else if (normRole === 'Branch Manager') {
    if (emailInput) emailInput.value = 'manager@bank.com';
    if (passInput) passInput.value = 'Manager123!';
    if (group2FA) group2FA.classList.add('hidden');
  } else if (normRole === 'Employee') {
    if (emailInput) emailInput.value = 'teller@bank.com';
    if (passInput) passInput.value = 'Teller123!';
    if (group2FA) group2FA.classList.add('hidden');
  } else if (normRole === 'Customer') {
    if (emailInput) emailInput.value = 'customer@bank.com';
    if (passInput) passInput.value = 'Customer123!';
    if (group2FA) group2FA.classList.add('hidden');
  } else if (normRole === 'Merchant') {
    if (emailInput) emailInput.value = 'merchant@bank.com';
    if (passInput) passInput.value = 'Merchant123!';
    if (group2FA) group2FA.classList.add('hidden');
  }
  
  if (state.currentRole === 'Customer') {
    document.getElementById('auth-signup-text').classList.remove('hidden');
  } else if (state.currentRole === 'Merchant') {
    document.getElementById('auth-merchant-text').classList.remove('hidden');
  }
}

function showCustomerSignupForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('customer-signup-flow').classList.remove('hidden');
  document.getElementById('merchant-signup-flow').classList.add('hidden');
  document.getElementById('otp-verify-pane').classList.add('hidden');
  document.getElementById('kyc-submit-pane').classList.add('hidden');
  document.getElementById('force-password-pane').classList.add('hidden');
  
  document.getElementById('auth-signup-text').classList.add('hidden');
  document.getElementById('auth-merchant-text').classList.add('hidden');
  document.getElementById('auth-signin-text').classList.remove('hidden');
}

function showMerchantSignupForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('customer-signup-flow').classList.add('hidden');
  document.getElementById('merchant-signup-flow').classList.remove('hidden');
  document.getElementById('otp-verify-pane').classList.add('hidden');
  document.getElementById('kyc-submit-pane').classList.add('hidden');
  document.getElementById('force-password-pane').classList.add('hidden');
  
  document.getElementById('auth-signup-text').classList.add('hidden');
  document.getElementById('auth-merchant-text').classList.add('hidden');
  document.getElementById('auth-signin-text').classList.remove('hidden');
}

// API Fetch Helper
async function apiCall(endpoint, method = 'GET', body = null) {
  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) loadingEl.classList.remove('hidden');

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': 'bank-csrf-secret-token-key',
      ...getDeviceHeaders()
    };

    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(getApiUrl(endpoint), options);
    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON format (${response.status}): ${text.substring(0, 80)}`);
    }

    if (response.status === 401) {
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
          return apiCall(endpoint, method, body);
        }
      }
      triggerLogout();
      showToast(data.message || 'Session expired or invalidated. Please sign in again.', 'warning');
      const err = new Error('Session invalid or expired. Please sign in again.');
      err.isAuthError = true;
      throw err;
    }

    if (response.status === 403) {
      showToast(data.message || 'Access Denied: Insufficient permissions for this action.', 'danger');
      const err = new Error(data.message || 'Access Denied: Insufficient permissions.');
      err.isAuthError = true;
      throw err;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Server error occurred.');
    }

    return data;
  } catch (err) {
    if (!err.isAuthError) {
      showToast(err.message, 'danger');
    }
    throw err;
  } finally {
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

// Token Refresh API
async function attemptTokenRefresh() {
  try {
    const headers = getDeviceHeaders();
    const response = await fetch(getApiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    if (response.ok) {
      const data = await response.json();
      state.token = data.token;
      localStorage.setItem('token', data.token);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

// Handle Login Form Submit
async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  const devIdEl = document.getElementById('sim-device-id');
  const devNameEl = document.getElementById('sim-device-name');
  const fpEl = document.getElementById('sim-fingerprint');

  const email = emailEl ? emailEl.value : 'admin@bank.com';
  const password = passEl ? passEl.value : 'Admin123!';
  const devId = devIdEl ? devIdEl.value : 'dev-desktop-win';
  const devName = devNameEl ? devNameEl.value : 'Windows Workstation';
  const fingerprint = fpEl ? fpEl.value : 'win_x64_chrome';

  const errorDiv = document.getElementById('auth-error');
  if (errorDiv) errorDiv.classList.add('hidden');

  try {
    const data = await apiCall('/api/auth/login', 'POST', {
      email,
      password,
      deviceId: devId,
      deviceName: devName,
      fingerprint
    });

    if (data.user && data.user.forcePasswordChange) {
      showToast('Temporary password login successful. Password change required.', 'warning');
      
      // Save temporary tokens in state for activation
      state.token = data.token;
      state.csrfToken = data.csrfToken;
      state.user = data.user;

      // Hide all panels, show force-password-pane
      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('customer-signup-flow').classList.add('hidden');
      document.getElementById('merchant-signup-flow').classList.add('hidden');
      document.getElementById('otp-verify-pane').classList.add('hidden');
      document.getElementById('kyc-submit-pane').classList.add('hidden');

      document.getElementById('force-password-pane').classList.remove('hidden');
      document.getElementById('force-password-email').value = email;
      document.getElementById('force-temp-password').value = password;
      return;
    }

    state.token = data.token;
    state.csrfToken = data.csrfToken;
    state.user = data.user;

    localStorage.setItem('token', data.token);
    localStorage.setItem('csrfToken', data.csrfToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Handle Remember Me
    try {
      const rememberEl = document.getElementById('remember-me');
      if (rememberEl && rememberEl.checked) {
        localStorage.setItem('branch_remember_email', email);
        localStorage.setItem('branch_remember_me', 'true');
      } else {
        localStorage.removeItem('branch_remember_email');
        localStorage.removeItem('branch_remember_me');
      }
    } catch(e) {}

    showToast('Authenticated successfully.', 'success');
    showDashboard();
  } catch (err) {
    errorDiv.innerText = err.message;
    errorDiv.classList.remove('hidden');
  }
}

// Password Visibility Toggle
window.togglePasswordVisibility = function() {
  const passInput = document.getElementById('login-password');
  const eyeIcon = document.getElementById('password-eye-icon');
  if (!passInput) return;
  if (passInput.type === 'password') {
    passInput.type = 'text';
    if (eyeIcon) eyeIcon.innerText = '🙈';
  } else {
    passInput.type = 'password';
    if (eyeIcon) eyeIcon.innerText = '👁️';
  }
};

// Quick Demo Account Selection
window.selectDemoAccount = function(email, password) {
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  if (emailEl) emailEl.value = email;
  if (passEl) passEl.value = password;

  document.querySelectorAll('.quick-pill').forEach(btn => {
    if (btn.innerText.includes('Manager') && email.includes('manager')) {
      btn.style.borderColor = '#a7f3d0';
      btn.style.background = '#ecfdf5';
      btn.style.color = '#047857';
      btn.style.fontWeight = '700';
    } else if (btn.innerText.includes('Teller') && email.includes('teller')) {
      btn.style.borderColor = '#a7f3d0';
      btn.style.background = '#ecfdf5';
      btn.style.color = '#047857';
      btn.style.fontWeight = '700';
    } else {
      btn.style.borderColor = '#e2e8f0';
      btn.style.background = '#f8fafc';
      btn.style.color = '#475569';
      btn.style.fontWeight = '600';
    }
  });
};

// Recovery Modal Management
window.openRecoveryModal = function(tab = 'userid') {
  const modal = document.getElementById('recovery-modal');
  if (modal) modal.classList.remove('hidden');
  switchRecoveryTab(tab);
};

window.closeRecoveryModal = function() {
  const modal = document.getElementById('recovery-modal');
  if (modal) modal.classList.add('hidden');
  const res1 = document.getElementById('forgot-id-result');
  const res2 = document.getElementById('forgot-pass-result');
  if (res1) res1.classList.add('hidden');
  if (res2) res2.classList.add('hidden');
};

window.switchRecoveryTab = function(tab) {
  const tabId = document.getElementById('tab-recovery-userid');
  const tabPass = document.getElementById('tab-recovery-password');
  const paneId = document.getElementById('pane-forgot-userid');
  const panePass = document.getElementById('pane-forgot-password');
  const title = document.getElementById('recovery-modal-title');
  const icon = document.getElementById('recovery-modal-icon');

  if (tab === 'userid') {
    if (tabId) {
      tabId.style.background = '#ffffff';
      tabId.style.color = '#047857';
      tabId.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
      tabId.style.fontWeight = '700';
    }
    if (tabPass) {
      tabPass.style.background = 'transparent';
      tabPass.style.color = '#64748b';
      tabPass.style.boxShadow = 'none';
      tabPass.style.fontWeight = '600';
    }
    if (paneId) paneId.classList.remove('hidden');
    if (panePass) panePass.classList.add('hidden');
    if (title) title.innerText = 'Retrieve Staff ID';
    if (icon) icon.innerText = '👤';
  } else {
    if (tabPass) {
      tabPass.style.background = '#ffffff';
      tabPass.style.color = '#15803d';
      tabPass.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
      tabPass.style.fontWeight = '700';
    }
    if (tabId) {
      tabId.style.background = 'transparent';
      tabId.style.color = '#64748b';
      tabId.style.boxShadow = 'none';
      tabId.style.fontWeight = '600';
    }
    if (panePass) panePass.classList.remove('hidden');
    if (paneId) paneId.classList.add('hidden');
    if (title) title.innerText = 'Reset Domain Password';
    if (icon) icon.innerText = '🔒';
  }
};

window.handleForgotUserId = function(e) {
  e.preventDefault();
  const emailInput = document.getElementById('forgot-id-email');
  const resultDiv = document.getElementById('forgot-id-result');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  
  if (!resultDiv) return;
  
  let recoveredId = 'manager@bank.com';
  let roleName = 'Branch Manager';
  if (email.includes('teller')) {
    recoveredId = 'teller@bank.com';
    roleName = 'Cash Teller';
  } else if (email.includes('loan')) {
    recoveredId = 'loan.officer@bank.com';
    roleName = 'Branch Loan Officer';
  }

  resultDiv.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 4px;">✅ Verified Staff Account Found</div>
    <div style="margin-bottom: 6px;">Role: <strong>${roleName}</strong></div>
    <div style="margin-bottom: 8px;">Staff ID / Login: <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #a7f3d0; font-weight: 800;">${recoveredId}</code></div>
    <button type="button" onclick="applyRecoveredId('${recoveredId}')" style="padding: 6px 12px; border-radius: 6px; background: #059669; color: #ffffff; border: none; font-size: 0.76rem; font-weight: 700; cursor: pointer;">Use This Staff ID to Sign In →</button>
  `;
  resultDiv.classList.remove('hidden');
};

window.applyRecoveredId = function(id) {
  const loginInput = document.getElementById('login-email');
  if (loginInput) loginInput.value = id;
  closeRecoveryModal();
  showToast('Staff ID applied to login field.', 'success');
};

window.handleForgotPassword = function(e) {
  e.preventDefault();
  const userInput = document.getElementById('forgot-pass-user');
  const resultDiv = document.getElementById('forgot-pass-result');
  const user = userInput ? userInput.value.trim() : '';

  if (!resultDiv) return;
  
  resultDiv.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 4px;">✅ Supervisor Reset Authorized</div>
    <p style="margin-bottom: 6px; font-size: 0.8rem; line-height: 1.4;">A temporary authorization reset token has been issued for <strong>${user}</strong>.</p>
    <div style="padding: 6px 10px; background: #ffffff; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 0.78rem; margin-bottom: 8px;">
      Default Domain Password: <code style="font-weight: 800; color: #15803d;">Manager123!</code>
    </div>
    <button type="button" onclick="closeRecoveryModal()" style="padding: 6px 12px; border-radius: 6px; background: #16a34a; color: #ffffff; border: none; font-size: 0.76rem; font-weight: 700; cursor: pointer;">Return to Sign In →</button>
  `;
  resultDiv.classList.remove('hidden');
};

// Handle Force Password Change Submission
async function handleForcePasswordChange(e) {
  e.preventDefault();
  const email = document.getElementById('force-password-email').value;
  const tempPassword = document.getElementById('force-temp-password').value;
  const newPassword = document.getElementById('force-new-password').value;
  const confirmPassword = document.getElementById('force-confirm-password').value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match.', 'danger');
    return;
  }

  try {
    const data = await apiCall('/api/auth/activate-provisioned', 'POST', {
      email,
      tempPassword,
      newPassword
    });

    showToast(data.message, 'success');

    // Clear temp session
    state.token = null;
    state.csrfToken = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('user');

    // Switch back to login form
    document.getElementById('force-password-pane').classList.add('hidden');
    document.getElementById('login-password').value = '';
    showLoginForm();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Handle Customer Signup
async function handleCustomerRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('cust-name').value;
  const dob = document.getElementById('cust-dob').value;
  const gender = document.getElementById('cust-gender').value;
  const email = document.getElementById('cust-email').value;
  const mobileNumber = document.getElementById('cust-mobile').value;
  const address = document.getElementById('cust-address').value;
  const password = document.getElementById('cust-password').value;
  const confirmPassword = document.getElementById('cust-confirm').value;

  try {
    const data = await apiCall('/customer/signup', 'POST', {
      fullName, dob, gender, email, mobileNumber, address, password, confirmPassword
    });

    showToast(data.message, 'success');
    
    // Switch to OTP pane
    document.getElementById('customer-signup-flow').classList.add('hidden');
    document.getElementById('otp-verify-pane').classList.remove('hidden');
    document.getElementById('otp-user-id').value = data.userId;
    
    // Show mock codes to speed up onboarding testing
    document.getElementById('otp-email-hint').innerText = `Simulated Email code sent: ${data.emailOtpMock}`;
    document.getElementById('otp-mobile-hint').innerText = `Simulated Mobile SMS code sent: ${data.mobileOtpMock}`;
  } catch (err) {}
}

// Handle Merchant Signup
async function handleMerchantRegister(e) {
  e.preventDefault();
  const businessName = document.getElementById('merch-biz-name').value;
  const ownerName = document.getElementById('merch-owner').value;
  const email = document.getElementById('merch-email').value;
  const mobileNumber = document.getElementById('merch-mobile').value;
  const gstNumber = document.getElementById('merch-gst').value;
  const panNumber = document.getElementById('merch-pan').value;
  const address = document.getElementById('merch-address').value;
  const password = document.getElementById('merch-password').value;

  try {
    const data = await apiCall('/merchant/signup', 'POST', {
      businessName, ownerName, email, mobileNumber, gstNumber, panNumber, address, password
    });

    showToast(data.message, 'success');
    
    // Switch to OTP pane for Merchant email verification
    document.getElementById('merchant-signup-flow').classList.add('hidden');
    document.getElementById('otp-verify-pane').classList.remove('hidden');
    document.getElementById('otp-user-id').value = data.userId;
    
    // Merchant only needs email verification
    document.getElementById('mobile-otp-group').classList.add('hidden');
    document.getElementById('otp-email-hint').innerText = `Simulated Email code: ${data.emailOtpMock}`;
  } catch (err) {}
}

// Handle OTP Verification submission
async function handleOtpVerify(e) {
  e.preventDefault();
  const userId = document.getElementById('otp-user-id').value;
  const emailOtp = document.getElementById('otp-email-val').value;
  const mobileOtp = document.getElementById('otp-mobile-val').value;

  try {
    if (state.currentRole === 'Merchant') {
      const data = await apiCall('/api/auth/merchant/verify-email', 'POST', { userId, emailOtp });
      showToast(data.message, 'success');
      showLoginForm();
    } else {
      const data = await apiCall('/api/auth/customer/verify-otp', 'POST', { userId, emailOtp, mobileOtp });
      showToast(data.message, 'success');
      
      // Move to KYC Submit step
      document.getElementById('otp-verify-pane').classList.add('hidden');
      document.getElementById('kyc-submit-pane').classList.remove('hidden');
      document.getElementById('kyc-user-id').value = userId;
    }
  } catch (err) {}
}

// Handle KYC Document Submit
async function handleKycSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('kyc-user-id').value;
  const docType = document.getElementById('kyc-doc-type').value;
  const docNum = document.getElementById('kyc-doc-number').value;

  try {
    const data = await apiCall('/api/auth/customer/submit-kyc', 'POST', {
      userId,
      documentType: docType,
      docNumber: docNum
    });

    showToast(data.message, 'success');
    showLoginForm();
  } catch (err) {}
}

// Logout session
async function triggerLogout() {
  try {
    if (state.token) {
      await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          ...getDeviceHeaders()
        }
      });
    }
  } catch(e){}

  state.token = null;
  state.csrfToken = null;
  state.user = null;

  localStorage.clear();
  showAuth();
}

// Switch UI screen
function showAuth() {
  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) loadingEl.classList.add('hidden');

  const authC = document.getElementById('auth-container');
  const dashC = document.getElementById('dashboard-container');
  if (authC) authC.classList.remove('hidden');
  if (dashC) dashC.classList.add('hidden');
  
  showLoginForm();

  // GSAP Entrance Animations
  if (window.gsap) {
    try {
      gsap.killTweensOf(['.auth-card', '.auth-header > *', '.role-tab', '.auth-form .form-group', '.auth-form button']);
      gsap.fromTo('.auth-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' }
      );
    } catch(e){}
  }
}

function normalizeRole(role) {
  if (!role) return 'Super Admin';
  const r = role.toString().trim().toLowerCase().replace(/_/g, ' ');
  if (r.includes('super') || r.includes('admin') || r === 'sa') return 'Super Admin';
  if (r.includes('manager')) return 'Branch Manager';
  if (r.includes('employee') || r.includes('teller') || r.includes('staff')) return 'Employee';
  if (r.includes('merchant')) return 'Merchant';
  if (r.includes('customer') || r.includes('client')) return 'Customer';
  return role;
}

function showDashboard() {
  if (!state.token || !state.user) {
    showAuth();
    return;
  }

  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) loadingEl.classList.add('hidden');

  const authC = document.getElementById('auth-container');
  const dashC = document.getElementById('dashboard-container');
  if (authC) authC.classList.add('hidden');
  if (dashC) dashC.classList.remove('hidden');

  // Set Profile info in sidebar safely
  const userName = state.user?.fullName || state.user?.name || state.user?.email || 'Root Administrator';
  const displayRole = state.user?.role || 'Super Admin';
  const normalizedRole = normalizeRole(displayRole);

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'SA';

  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.innerText = userName;
  if (roleEl) roleEl.innerText = displayRole;
  if (avatarEl) avatarEl.innerText = initials;

  // Set Branch Indicator dynamically
  const branchIndicator = document.getElementById('manager-branch-indicator');
  if (branchIndicator) {
    const branchName = state.user?.branchName || (state.user?.branchId === 'b-main' ? 'Global Headquarters' : (state.user?.branchId || 'Global Headquarters'));
    branchIndicator.innerText = `Branch: ${branchName}`;
  }

  // Load appropriate navigation menu based on user role
  renderSidebarMenu();

  // Load default tab
  switchTab('summary');

  // Register real-time notifications checking
  loadNotificationsCount();

  // GSAP Dashboard Entrance Animations
  if (window.gsap) {
    try {
      gsap.killTweensOf(['.sidebar', '.top-bar', '#sidebar-menu-list .menu-item']);
      gsap.fromTo('.sidebar',
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' }
      );
      gsap.fromTo('.top-bar',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' }
      );
      gsap.fromTo('#sidebar-menu-list .menu-item',
        { opacity: 0, x: -15 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out', clearProps: 'all' }
      );
    } catch(e){}
  }
}

// Build Sidebar links depending on Role
function renderSidebarMenu() {
  const menu = document.getElementById('sidebar-menu-list');
  menu.innerHTML = '';

  const links = getRoleLinks();
  
  links.forEach(link => {
    const btn = document.createElement('button');
    btn.className = `menu-item ${state.activeTab === link.id ? 'active' : ''}`;
    btn.innerHTML = `<span class="icon">${link.icon}</span> ${link.name}`;
    btn.addEventListener('click', () => switchTab(link.id));
    menu.appendChild(btn);
  });
}

// Router tab switcher
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Highlight active menu item
  const menuItems = document.querySelectorAll('.menu-item');
  const menuLinks = getRoleLinks();
  menuItems.forEach((btn, index) => {
    if (menuLinks[index] && menuLinks[index].id === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Set Workspace Title
  document.getElementById('page-title').innerText = tabId.toUpperCase() + ' Workspace';

  // Render workspace layout depending on role
  renderWorkspace(tabId);
}

function getRoleLinks() {
  const allAvailableLinks = [
    { id: 'summary', name: 'Core Summary', icon: '🏦' },
    { id: 'customer-onboarding', name: 'Onboard Customer', icon: '👤' },
    { id: 'branch-customers', name: 'Branch Customers', icon: '👥' },
    { id: 'users', name: 'User Registry', icon: '👥' },
    { id: 'role-manager', name: 'Role Manager', icon: '🛡️' },
    { id: 'branches', name: 'Branch Registry', icon: '🏢' },
    { id: 'ledger', name: 'General Ledger', icon: '📈' },
    { id: 'developers', name: 'API Developer Portal', icon: '💻' },
    { id: 'interest', name: 'Interest Engine', icon: '⚙️' },
    { id: 'disaster', name: 'Backup & Recovery', icon: '💾' },
    { id: 'approvals', name: 'Pending Approvals', icon: '🗳️' },
    { id: 'employees', name: 'Branch Tellers', icon: '👥' },
    { id: 'treasury', name: 'Vault & Cash', icon: '💰' },
    { id: 'customers', name: 'Accounts Assistance', icon: '👥' },
    { id: 'transactions', name: 'Assist Transaction', icon: '💵' },
    { id: 'crm', name: 'Leads & Sales', icon: '🎯' },
    { id: 'tickets', name: 'Customer Tickets', icon: '🎫' },
    { id: 'dms', name: 'Document Vault', icon: '📁' },
    { id: 'transfers', name: 'Send Money', icon: '💸' },
    { id: 'beneficiaries', name: 'Contacts / Nominees', icon: '👥' },
    { id: 'products', name: 'Apply Loans/FD', icon: '🌱' },
    { id: 'assistant', name: 'AI Financial Agent', icon: '🤖' },
    { id: 'settings', name: 'Security Controls', icon: '⚙️' },
    { id: 'qr', name: 'Merchant QR Payments', icon: '📱' },
    { id: 'settlements', name: 'Settlements', icon: '🏦' }
  ];

  if (!state.user) return [];

  const normRole = normalizeRole(state.user.role);

  // If user object returned by login contains custom modules array
  if (state.user.modules && Array.isArray(state.user.modules) && state.user.modules.length > 0) {
    const userModules = state.user.modules.map(m => m.toLowerCase());
    
    // Always include summary for authenticated users
    if (!userModules.includes('summary')) {
      userModules.unshift('summary');
    }

    if (normRole === 'Super Admin') {
      if (!userModules.includes('branch-customers')) userModules.push('branch-customers');
      if (!userModules.includes('customer-registry')) userModules.push('customer-registry');
    }
    if (normRole === 'Branch Manager') {
      if (!userModules.includes('branch-customers')) userModules.push('branch-customers');
      const idx = userModules.indexOf('customer-registry');
      if (idx !== -1) userModules.splice(idx, 1);
    }
    if (normRole === 'Employee') {
      if (!userModules.includes('customer-onboarding')) userModules.push('customer-onboarding');
      const idx = userModules.indexOf('customer-registry');
      if (idx !== -1) userModules.splice(idx, 1);
      const branchCustIdx = userModules.indexOf('branch-customers');
      if (branchCustIdx !== -1) userModules.splice(branchCustIdx, 1);
      const accAssistIdx = userModules.indexOf('customers');
      if (accAssistIdx !== -1) userModules.splice(accAssistIdx, 1);
    }

    const matchedLinks = allAvailableLinks.filter(link => userModules.includes(link.id.toLowerCase()));
    if (matchedLinks.length > 0) return matchedLinks;
  }

  // Fallback to static rules based on normalized role
  if (normRole === 'Super Admin') {
    return allAvailableLinks.filter(link => 
      ['summary', 'branch-customers', 'users', 'customer-registry', 'role-manager', 'branches', 'ledger', 'developers', 'interest', 'disaster'].includes(link.id)
    );
  } else if (normRole === 'Branch Manager') {
    return allAvailableLinks.filter(link => 
      ['summary', 'branch-customers', 'users', 'kyc', 'approvals', 'employees', 'treasury', 'ledger'].includes(link.id)
    );
  } else if (normRole === 'Employee') {
    return allAvailableLinks.filter(link => 
      ['summary', 'customer-onboarding', 'transactions', 'crm', 'tickets', 'dms'].includes(link.id)
    );
  } else if (normRole === 'Customer') {
    return allAvailableLinks.filter(link => 
      ['summary', 'transfers', 'beneficiaries', 'products', 'dms', 'assistant', 'settings'].includes(link.id)
    );
  } else if (normRole === 'Merchant') {
    return allAvailableLinks.filter(link => 
      ['summary', 'qr', 'settlements', 'developers'].includes(link.id)
    );
  }

  return allAvailableLinks.filter(link => ['summary'].includes(link.id));
}

// Centralized workspace GSAP transitions
function animateWorkspaceEntrance(container) {
  if (window.gsap) {
    const statsCards = container.querySelectorAll('.stats-grid > *');
    const cards = container.querySelectorAll('.card');
    const rows = Array.from(container.querySelectorAll('tbody tr')).slice(0, 15);
    const strips = container.querySelectorAll('.accounts-list > *, .atm-card, .chat-container, .terminal-block');

    // Kill any active transitions on the elements to prevent overlapping animations
    gsap.killTweensOf([statsCards, cards, rows, strips]);

    const tl = gsap.timeline();

    if (statsCards.length > 0) {
      tl.from(statsCards, {
        duration: 0.5,
        y: 20,
        opacity: 0,
        stagger: 0.08,
        ease: 'power2.out'
      }, 0);
    }

    if (cards.length > 0) {
      tl.from(cards, {
        duration: 0.5,
        y: 20,
        opacity: 0,
        stagger: 0.1,
        ease: 'power2.out'
      }, statsCards.length > 0 ? 0.15 : 0);
    }

    if (rows.length > 0) {
      tl.from(rows, {
        duration: 0.4,
        y: 10,
        opacity: 0,
        stagger: 0.03,
        ease: 'power1.out'
      }, 0.2);
    }

    if (strips.length > 0) {
      tl.from(strips, {
        duration: 0.5,
        y: 15,
        opacity: 0,
        stagger: 0.08,
        ease: 'power2.out'
      }, 0.2);
    }
  }
}

// Workspace Renderer Router
async function renderWorkspace(tabId) {
  const target = document.getElementById('workspace-target');
  target.innerHTML = `<div class="loading-overlay" style="position:relative; background:none; height:200px;"><div class="spinner"></div></div>`;

  try {
    const role = normalizeRole(state.user?.role);
    if (role === 'Super Admin') {
      await renderAdmin(tabId, target);
    } else if (role === 'Branch Manager') {
      await renderManager(tabId, target);
    } else if (role === 'Employee') {
      await renderEmployee(tabId, target);
    } else if (role === 'Customer') {
      await renderCustomer(tabId, target);
    } else if (role === 'Merchant') {
      await renderMerchant(tabId, target);
    } else {
      await renderAdmin(tabId, target);
    }
    
    // Animate workspace elements once loaded
    animateWorkspaceEntrance(target);
  } catch (err) {
    console.error('Workspace rendering failed:', err);
    target.innerHTML = `<div class="card" style="padding: 20px;"><h3 style="color: var(--danger-color);">Error Loading Workspace</h3><p>${err.message || 'An error occurred while loading this view.'}</p></div>`;
  }
}

// ==========================================
// RENDER SUPER ADMIN VIEWS
// ==========================================
async function renderAdmin(tab, container) {
  try {
    if (tab === 'branch-customers') {
      await renderBranchCustomersView(container);
      return;
    }
    if (tab === 'summary') {
      const data = await apiCall('/api/dashboard/summary');
      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Registered Users</h3>
            <div class="stat-val">${data.stats.totalUsers}</div>
            <div class="stat-desc">Administrators, tellers, & clients</div>
          </div>
          <div class="stat-card">
            <h3>Active Accounts</h3>
            <div class="stat-val">${data.stats.totalAccounts}</div>
            <div class="stat-desc">Savings and commercial accounts</div>
          </div>
          <div class="stat-card">
            <h3>Transactions Logged</h3>
            <div class="stat-val">${data.stats.totalTransactions}</div>
            <div class="stat-desc">Completed double-entry records</div>
          </div>
          <div class="stat-card">
            <h3>Fraud Alerts</h3>
            <div class="stat-val text-danger">${data.stats.activeAlerts}</div>
            <div class="stat-desc">Unresolved security notifications</div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <div class="card-header">
              <h2>System Security & Fraud Platform</h2>
            </div>
            <div id="admin-alerts-feed">Loading security events...</div>
          </div>
          <div class="card">
            <div class="card-header">
              <h2>Recent Audit Logs</h2>
            </div>
            <div id="admin-audit-logs" style="font-size:0.8rem; line-height:1.6;">Loading audit logs...</div>
          </div>
        </div>
      `;
      loadAdminAlertsFeed();
      loadAdminAuditLogs();
    } else if (tab === 'users') {
      const users = await apiCall('/api/dashboard/users');
      const rolesData = await apiCall('/api/roles');
      const rolesList = rolesData.roles || [];
      const branchesList = await apiCall('/api/branches') || [];

      window.cachedUsers = users;
      window.cachedBranches = branchesList;

      // Filter roles to internal banking roles only (excluding Customer and Merchant)
      const internalRoles = rolesList.filter(r => r.name !== 'Customer' && r.name !== 'Merchant');

      container.innerHTML = `
        <div class="card" style="width: 100%; padding: 24px; display: flex; flex-direction: column; gap: 20px;">
          <!-- Section 1: Provision Staff Account Form -->
          <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 18px;">
            <h2 style="margin: 0 0 14px 0; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
              👤 Provision Staff Account
            </h2>
            <form id="provision-user-form">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; display: block;">Full Name</label>
                  <input type="text" id="prov-fullname" required placeholder="e.g. John Doe" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; display: block;">Email Address</label>
                  <input type="email" id="prov-email" required placeholder="e.g. john.doe@bank.com" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; display: block;">Assign Banking Role</label>
                  <select id="prov-role" required style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--bg-main); color: var(--text-primary);">
                    ${internalRoles.map(r => `<option value="${r.name}">${r.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; display: block;">Assign Branch</label>
                  <select id="prov-branch" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--bg-main); color: var(--text-primary);">
                    ${branchesList.length > 0 
                      ? branchesList.map(b => `<option value="${b.id}">${b.name} (${b.code})</option>`).join('') 
                      : '<option value="">No Branches Configured</option>'
                    }
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <button type="submit" class="btn btn-success btn-block" style="height: 38px; font-weight: 700; border-radius: 6px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); border: none; color: #fff; cursor: pointer;">Provision User & Generate Key</button>
                </div>
              </div>
            </form>
            
            <!-- Invitation credentials box -->
            <div id="provision-result-box" class="alert alert-success hidden" style="margin-top: 14px; font-size: 0.85rem; border: 1px dashed var(--color-success);">
              <h4>Account Provisioned Successfully!</h4>
              <p>Please share the temporary credentials below with the user:</p>
              <div style="background: rgba(0,0,0,0.05); padding: 8px; border-radius: 4px; margin-top: 6px; font-family: monospace;">
                <strong>User ID / ID:</strong> <span id="prov-res-userid" style="color: var(--accent-primary); font-weight: bold;"></span><br>
                <strong>Email:</strong> <span id="prov-res-email"></span><br>
                <strong>Temporary Password:</strong> <span id="prov-res-password" style="color: var(--success); font-weight: bold;"></span>
              </div>
            </div>
          </div>

          <!-- Section 2: User Registry Table Container -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800;">User Registry</h3>
              <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">${
                users.filter(u => {
                  const filter = state.userRoleStatusFilter || 'ALL';
                  if (filter === 'ALL') return true;
                  if (filter.startsWith('ROLE_')) return u.role === filter.replace('ROLE_', '');
                  if (filter.startsWith('STATUS_')) return u.status === filter.replace('STATUS_', '');
                  return true;
                }).length
              } Total Users</span>
            </div>
            <div class="table-wrapper" style="max-height: 520px; overflow-x: auto; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>EMAIL & USER ID</th>
                    <th style="min-width: 180px;">
                      <select id="user-role-status-filter" onchange="filterUserRoleStatus(this.value)" style="background: transparent; border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 4px; font-weight: bold; cursor: pointer; color: var(--text-primary); font-size: 0.8rem;">
                        <option value="ALL" ${(!state.userRoleStatusFilter || state.userRoleStatusFilter === 'ALL') ? 'selected' : ''}>ROLE & STATUS (ALL)</option>
                        <optgroup label="Filter by Role">
                          ${internalRoles.map(r => `<option value="ROLE_${r.name}" ${state.userRoleStatusFilter === 'ROLE_' + r.name ? 'selected' : ''}>${r.name}</option>`).join('')}
                          <option value="ROLE_Customer" ${state.userRoleStatusFilter === 'ROLE_Customer' ? 'selected' : ''}>Customer</option>
                          <option value="ROLE_Merchant" ${state.userRoleStatusFilter === 'ROLE_Merchant' ? 'selected' : ''}>Merchant</option>
                        </optgroup>
                        <optgroup label="Filter by Status">
                          <option value="STATUS_active" ${state.userRoleStatusFilter === 'STATUS_active' ? 'selected' : ''}>Active</option>
                          <option value="STATUS_suspended" ${state.userRoleStatusFilter === 'STATUS_suspended' ? 'selected' : ''}>Suspended</option>
                        </optgroup>
                      </select>
                    </th>
                    <th>Branch</th>
                    <th style="white-space: nowrap;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.filter(u => {
                    const filter = state.userRoleStatusFilter || 'ALL';
                    if (filter === 'ALL') return true;
                    if (filter.startsWith('ROLE_')) return u.role === filter.replace('ROLE_', '');
                    if (filter.startsWith('STATUS_')) return u.status === filter.replace('STATUS_', '');
                    return true;
                  }).map(u => `
                    <tr>
                      <td><b>${u.fullName}</b></td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <span style="font-size: 0.8rem; color: var(--text-primary); font-weight: 600;">
                            ${u.email}
                          </span>
                          <span style="font-size: 0.75rem; color: #0284c7; font-family: monospace; font-weight: 700;">
                            ID: ${u.userId || u.id}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <span style="font-weight: 700; font-size: 0.85rem; color: ${u.role === 'Super Admin' ? '#6366f1' : u.role === 'Branch Manager' ? '#0284c7' : u.role === 'Auditor' ? '#d97706' : u.role === 'Compliance Officer' ? '#059669' : u.role === 'Loan Officer' ? '#8b5cf6' : '#2563eb'};">
                            ${u.role}
                          </span>
                          <div style="display: flex; gap: 6px; align-items: center; font-size: 0.75rem;">
                            <span style="font-weight: 600; color: ${u.status === 'active' ? '#16a34a' : '#dc2626'};">
                              ● ${(u.status || 'active').toUpperCase()}
                            </span>
                            ${u.forcePasswordChange ? '<span style="color: #d97706; font-weight: 600; font-size: 0.7rem;">(Temp PW)</span>' : ''}
                          </div>
                        </div>
                      </td>
                      <td><span style="font-size: 0.8rem; font-weight: 600; color: var(--accent-primary);">${u.branchName || u.branchId || 'Global HQ'}</span></td>
                      <td style="white-space: nowrap;">
                        <div style="display: flex; gap: 4px; align-items: center; justify-content: flex-start; flex-wrap: nowrap; white-space: nowrap;">
                          <button class="btn btn-outline-primary btn-xs" onclick="openEditUserModal('${u.id}')">✏️ Edit</button>
                          <button class="btn btn-outline-info btn-xs" onclick="openTransferBranchModal('${u.id}')">🔁 Transfer</button>
                          ${u.status === 'active' 
                            ? `<button class="btn btn-outline-warning btn-xs" onclick="toggleUserSuspension('${u.id}', 'suspend')">Suspend</button>` 
                            : `<button class="btn btn-outline-success btn-xs" onclick="toggleUserSuspension('${u.id}', 'activate')">Activate</button>`
                          }
                          <button class="btn btn-outline-danger btn-xs" onclick="resetPasswordByAdmin('${u.id}')">Reset PW</button>
                          <button class="btn btn-outline-danger btn-xs" onclick="deleteUserByAdmin('${u.id}')">🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      document.getElementById('provision-user-form').addEventListener('submit', handleUserProvisionSubmit);

    } else if (tab === 'customer-registry') {
      return renderBranchCustomersView(container);
    } else if (tab === 'role-manager') {

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
          <!-- Register Customer Form -->
          <div class="card" style="width: 100%;">
            <div class="card-header">
              <h2>👤 Register & Onboard New Customer</h2>
            </div>
            <form id="cust-register-form" style="margin-top: 15px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Full Name</label>
                  <input type="text" id="cust-reg-fullname" required placeholder="e.g. Sarah Connor">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Email Address</label>
                  <input type="email" id="cust-reg-email" required placeholder="e.g. sarah.connor@gmail.com">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Mobile Number</label>
                  <input type="text" id="cust-reg-mobile" placeholder="e.g. +1555987654">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Account Number (Custom / Auto)</label>
                  <input type="text" id="cust-reg-accno" placeholder="Auto-generated if left empty">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Customer PAN Number</label>
                  <input type="text" id="cust-reg-pan" placeholder="e.g. ABCDE1234F" style="text-transform: uppercase;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Date of Birth (DOB)</label>
                  <input type="date" id="cust-reg-dob" value="1995-01-01">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>S/D/H/W/o (Father/Spouse Name)</label>
                  <input type="text" id="cust-reg-sdhwo" placeholder="e.g. S/o John Connor">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Mode of Operation (MOP)</label>
                  <select id="cust-reg-mop" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px;">
                    <option value="Self">Self (Single Account)</option>
                    <option value="Either or Survivor">Either or Survivor (Joint)</option>
                    <option value="Former or Survivor">Former or Survivor (Joint)</option>
                    <option value="Jointly Operated">Jointly Operated</option>
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Assign Branch</label>
                  <select id="cust-reg-branch" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px;">
                    ${bList.map(b => `<option value="${b.id}">${b.name} (${b.code})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Primary Account Type</label>
                  <select id="cust-reg-acctype" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px;">
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Checking Account</option>
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Initial Deposit (₹)</label>
                  <input type="number" id="cust-reg-deposit" value="1000" min="0">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <button type="submit" class="btn btn-success btn-block" style="height: 38px; font-weight: 700;">Register Customer & Open Account</button>
                </div>
              </div>
            </form>

            <div id="cust-reg-result-box" class="alert alert-success hidden" style="margin-top: 20px; font-size: 0.85rem; border: 1px dashed var(--color-success);">
              <h4>Customer Account Generated Successfully!</h4>
              <div style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; margin-top: 8px; font-family: monospace;">
                <strong>Customer ID (ID):</strong> <span id="cust-res-userid" style="color: var(--accent-primary); font-weight: bold;"></span><br>
                <strong>Account Number:</strong> <span id="cust-res-accno" style="color: var(--success); font-weight: bold;"></span><br>
                <strong>Email:</strong> <span id="cust-res-email"></span><br>
                <strong>Temporary Password:</strong> <span id="cust-res-password" style="font-weight: bold;"></span>
              </div>
            </div>
          </div>

          <!-- Customer Registry Table -->
          <div class="card" style="width: 100%;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h2>Customer Registry</h2>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">${cList.length} Total Customers</span>
            </div>
            <div class="table-wrapper" style="max-height: 550px; overflow-x: auto; overflow-y: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>EMAIL & CUSTOMER ID</th>
                    <th>Mobile / Phone</th>
                    <th>Linked Accounts & Balance</th>
                    <th>Branch</th>
                    <th>Status & KYC</th>
                    <th style="white-space: nowrap;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${cList.map(c => `
                    <tr>
                      <td><b>${c.fullName}</b></td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <span style="font-size: 0.8rem; color: var(--text-primary); font-weight: 600;">
                            ${c.email}
                          </span>
                          <span style="font-size: 0.75rem; color: #0284c7; font-family: monospace; font-weight: 700;">
                            ID: ${c.userId || c.id}
                          </span>
                        </div>
                      </td>
                      <td><span style="font-size: 0.8rem;">${c.mobileNumber || 'N/A'}</span></td>
                      <td>
                        ${c.accounts && c.accounts.length > 0 ? `
                          <div style="font-size: 0.8rem;">
                            <strong>${c.accounts[0].accountNumber}</strong> (${c.accounts[0].type.toUpperCase()})<br>
                            <span style="color: var(--success); font-weight: 700;">₹${parseFloat(c.totalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ` : '<span style="font-size: 0.75rem; color: var(--text-secondary);">No Accounts</span>'}
                      </td>
                      <td><span style="font-size: 0.8rem; font-weight: 600;">${c.branchName}</span></td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <span style="font-weight: 700; font-size: 0.8rem; color: ${c.status === 'active' ? '#16a34a' : '#dc2626'};">
                            ● ${(c.status || 'active').toUpperCase()}
                          </span>
                          <span style="font-weight: 600; font-size: 0.75rem; color: ${c.kycStatus === 'verified' ? '#0284c7' : '#d97706'};">
                            ${c.kycStatus === 'verified' ? 'KYC ✓' : 'KYC Pending'}
                          </span>
                        </div>
                      </td>
                      <td style="white-space: nowrap;">
                        <div style="display: flex; gap: 4px; align-items: center; flex-wrap: nowrap;">
                          ${c.status === 'frozen'
                            ? `<button class="btn btn-outline-success btn-xs" onclick="toggleCustFreeze('${c.id}', 'frozen')">🔓 Unfreeze</button>`
                            : `<button class="btn btn-outline-warning btn-xs" onclick="toggleCustFreeze('${c.id}', 'active')">🔒 Freeze</button>`
                          }
                          <button class="btn btn-outline-danger btn-xs" onclick="deleteCustomerRecord('${c.id}', '${c.fullName}')">🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      document.getElementById('cust-register-form').addEventListener('submit', handleCustomerRegisterFormSubmit);

    } else if (tab === 'kyc') {
      const res = await apiCall('/api/kyc/queue').catch(() => ({ queue: [] }));
      const queue = res.queue || [];
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
          <div class="card" style="width: 100%;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h2>🪪 KYC Compliance & Verification Queue</h2>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">${queue.length} Total Verification Entries</span>
            </div>
            <div class="table-wrapper" style="max-height: 550px; overflow-x: auto; overflow-y: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Customer / User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Doc Type</th>
                    <th>Doc Number</th>
                    <th>Status</th>
                    <th style="white-space: nowrap;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${queue.map(item => `
                    <tr>
                      <td><b>${item.fullName}</b></td>
                      <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${item.email}</span></td>
                      <td><span class="status-badge active">${item.role}</span></td>
                      <td><b>${item.docType}</b></td>
                      <td><code>${item.docNumber}</code></td>
                      <td>
                        <span class="status-badge ${item.kycStatus === 'verified' ? 'active' : item.kycStatus === 'rejected' ? 'frozen' : 'pending'}">
                          ${item.kycStatus.toUpperCase()}
                        </span>
                      </td>
                      <td style="white-space: nowrap;">
                        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: nowrap;">
                          <button class="btn btn-outline-success btn-xs" onclick="verifyKycAction('${item.userId}', 'approve')">✅ Approve</button>
                          <button class="btn btn-outline-danger btn-xs" onclick="verifyKycAction('${item.userId}', 'reject')">❌ Reject</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (tab === 'role-manager') {
      const data = await apiCall('/api/roles');
      const { roles, permissions, rolePermissions } = data;

      const getPermissionsString = (rId) => {
        const rpList = rolePermissions.filter(rp => rp.roleId === rId);
        if (rpList.length === 0) return '<span class="text-secondary">None</span>';
        return rpList.map(rp => {
          const perm = permissions.find(p => p.id === rp.permissionId);
          const act = perm ? perm.action : rp.permissionId;
          return `<span class="status-badge active" style="margin: 2px; display: inline-block; font-size: 0.7rem; padding: 2px 6px;">${act} (${rp.scope})</span>`;
        }).join(' ');
      };

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
          <!-- Configure Custom Role Panel (Horizontal Layout) -->
          <div class="card" style="width: 100%;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h2 id="role-editor-title">🛡️ Configure Custom Role</h2>
              <button class="btn btn-outline-secondary btn-sm" id="btn-reset-role-form" onclick="resetRoleForm()">Clear Form</button>
            </div>
            <form id="role-config-form" style="margin-top: 15px;">
              <input type="hidden" id="edit-role-id" value="">
              
              <!-- Role Name Input -->
              <div class="form-group" style="margin-bottom: 15px;">
                <label>Role Name</label>
                <input type="text" id="role-name-input" required placeholder="e.g. Risk Manager" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; margin-top: 4px;">
              </div>

              <!-- Authorized Workspace Modules Grid -->
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-weight: 700; display: block; margin-bottom: 8px;">Authorized Workspace Modules</label>
                <div class="modules-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; background: var(--bg-main); padding: 12px; border: 1px solid var(--border-color); border-radius: 6px;">
                  ${['summary', 'users', 'customer-registry', 'role-manager', 'branches', 'ledger', 'developers', 'interest', 'disaster', 'approvals', 'employees', 'treasury', 'customers', 'transactions', 'crm', 'tickets', 'dms', 'transfers', 'beneficiaries', 'products', 'assistant', 'settings', 'qr', 'settlements'].map(m => `
                    <label class="checkbox-container" style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; color: var(--text-primary);">
                      <input type="checkbox" name="role-modules" value="${m}">
                      ${m.toUpperCase()}
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Granular Permission & Scopes Matrix Grid -->
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-weight: 700; display: block; margin-bottom: 8px;">Granular Permission & Scopes Matrix</label>
                <div class="permission-matrix" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; max-height: 300px; overflow-y: auto; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px;">
                  ${permissions.map(p => `
                    <div class="perm-row" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px;">
                      <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; color: var(--text-primary);">
                        <input type="checkbox" class="perm-chk" data-permission-id="${p.id}" value="${p.action}">
                        <b>${p.action}</b>
                      </label>
                      <select class="perm-scope" data-permission-id="${p.id}" style="padding: 3px 8px; font-size: 0.75rem; border: 1px solid var(--border-color); border-radius: 4px;">
                        <option value="Global">Global</option>
                        <option value="Branch">Branch</option>
                        <option value="Department">Department</option>
                        <option value="Own Records">Own Records</option>
                      </select>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end;">
                <button type="submit" class="btn btn-primary" style="height: 38px; font-weight: 700; min-width: 220px;" id="btn-save-role">Commit Role Configuration</button>
              </div>
            </form>
          </div>

          <!-- Active Role Registry (Full Width Below Form) -->
          <div class="card" style="width: 100%;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h2>Active Role Registry</h2>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">${roles.length} Active System Roles</span>
            </div>
            <div class="table-wrapper" style="max-height: 550px; overflow-x: auto; overflow-y: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Authorized Modules</th>
                    <th>Permissions & Scopes</th>
                    <th style="white-space: nowrap;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${roles.map(r => `
                    <tr id="role-row-${r.id}">
                      <td style="white-space: nowrap;">
                        <b>${r.name}</b><br>
                        ${r.custom ? '<span class="status-badge active" style="margin-top: 4px; display: inline-block;">Custom</span>' : '<span class="status-badge pending" style="margin-top: 4px; display: inline-block;">System</span>'}
                      </td>
                      <td>
                        <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">
                          ${(r.modules || []).join(', ')}
                        </div>
                      </td>
                      <td>
                        <div style="max-height: 120px; overflow-y: auto;">
                          ${getPermissionsString(r.id)}
                        </div>
                      </td>
                      <td style="white-space: nowrap;">
                        <div style="display: flex; gap: 6px; align-items: center; justify-content: flex-start; flex-wrap: nowrap; white-space: nowrap;">
                          <button class="btn btn-outline-primary btn-xs" onclick='editRoleDetails(${JSON.stringify(r)})'>✏️ Edit</button>
                          <button class="btn btn-outline-success btn-xs" onclick="cloneExistingRole('${r.id}')">📋 Clone</button>
                          ${r.custom ? `<button class="btn btn-outline-danger btn-xs" onclick="deleteCustomRole('${r.id}')">🗑️ Delete</button>` : ''}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      document.getElementById('role-config-form').addEventListener('submit', handleRoleSave);
    } else if (tab === 'ledger') {
      container.innerHTML = `
        <div class="dashboard-subtabs">
          <button class="subtab-btn active" onclick="switchSubTab(event, 'gl-balance')">GL Accounts</button>
          <button class="subtab-btn" onclick="switchSubTab(event, 'journal-entry')">Create Journal</button>
          <button class="subtab-btn" onclick="switchSubTab(event, 'trial-bal')">Trial Balance</button>
          <button class="subtab-btn" onclick="switchSubTab(event, 'statements')">Statements (P&L / BS)</button>
        </div>
        <div id="ledger-sub-workspace">Loading general ledger...</div>
      `;
      loadGlBalanceTab();
    } else if (tab === 'developers') {
      container.innerHTML = `
        <div class="dashboard-subtabs">
          <button class="subtab-btn active" onclick="switchSubTab(event, 'api-keys')">Developer Credentials</button>
          <button class="subtab-btn" onclick="switchSubTab(event, 'api-logs')">Access Metrics</button>
          <button class="subtab-btn" onclick="switchSubTab(event, 'swagger')">Swagger Docs</button>
        </div>
        <div id="dev-portal-sub">Loading Dev Portal...</div>
      `;
      loadApiKeysTab();
    } else if (tab === 'interest') {
      const data = await apiCall('/api/interest/status');
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2>Centralized Interest Calculation Engine</h2>
            <button class="btn btn-primary" onclick="triggerInterestPosting()">Execute Monthly posting Batch</button>
          </div>
          <p class="text-secondary" style="margin-bottom:20px;">Interest Scheduler evaluates Savings Daily, Fixed Deposit Compounds quarterly, and generates Loan penal additions automatically.</p>
          
          <div class="dashboard-grid">
            <div>
              <h3>Active Interest Schedules</h3>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Schedule ID</th>
                      <th>Entity</th>
                      <th>Rate</th>
                      <th>Frequency</th>
                      <th>Next Posting</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.schedules.map(s => `
                      <tr>
                        <td><code>${s.id}</code></td>
                        <td>${s.entityType.toUpperCase()} (ID: ${s.entityId})</td>
                        <td>${s.rate}%</td>
                        <td>${s.frequency.toUpperCase()}</td>
                        <td>${new Date(s.nextPostDate).toLocaleDateString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3>Recent Postings Log</h3>
              <div class="table-wrapper" style="max-height: 300px; overflow-y:auto;">
                <table>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.postings.map(p => `
                      <tr>
                        <td><code>${p.accountId}</code></td>
                        <td>₹${p.amount}</td>
                        <td>${p.type}</td>
                        <td>${new Date(p.postedAt).toLocaleDateString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;

    } else if (tab === 'disaster') {
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2>Disaster Recovery & Backups</h2>
            <button class="btn btn-primary btn-sm" onclick="createSystemBackup()">Generate DB Snapshot</button>
          </div>
          <p class="text-secondary" style="margin-bottom:20px;">Perform snapshots of database JSON. Restoring a snapshot will reload database configurations without restarting the server.</p>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Backup File</th>
                  <th>Size</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="backups-list-target">
                <tr><td colspan="4" class="text-center">Loading recovery files...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      loadBackupsList();
    } else if (tab === 'branches') {
      const branches = await apiCall('/api/branches');
      container.innerHTML = `
        <div class="card" style="width: 100%; padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <!-- Configure Branch Inline Panel -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
              <h3 id="branch-editor-title" style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                🏢 Configure Branch
              </h3>
              <button type="button" class="btn btn-outline-secondary btn-sm" id="btn-reset-branch-form" onclick="resetBranchForm()" style="padding: 3px 10px; font-size: 0.75rem; font-weight: 600;">Clear Form</button>
            </div>
            <form id="branch-config-form">
              <input type="hidden" id="edit-branch-id" value="">
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Branch Name *</label>
                  <input type="text" id="branch-name-input" required placeholder="e.g. Downtown Branch" style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Branch Code *</label>
                  <input type="text" id="branch-code-input" required placeholder="e.g. DT001" style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">IFSC Code *</label>
                  <input type="text" id="branch-ifsc-input" required value="NXSB0000001" placeholder="e.g. NXSB0000001" style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; text-transform: uppercase;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">MICR Code *</label>
                  <input type="text" id="branch-micr-input" required value="110240001" placeholder="e.g. 110240001" style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Address</label>
                  <input type="text" id="branch-address-input" placeholder="e.g. 123 Main St, New York, NY" style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Vault Balance (₹)</label>
                  <input type="number" step="0.01" id="branch-vault-balance-input" value="0.00" style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Cash In Hand (₹)</label>
                  <input type="number" step="0.01" id="branch-cash-in-hand-input" value="0.00" style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Min Vault Limit (₹)</label>
                  <input type="number" step="0.01" id="branch-min-vault-input" value="100000.00" style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 3px;">Max Vault Limit (₹)</label>
                  <input type="number" step="0.01" id="branch-max-vault-input" value="10000000.00" style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </div>
              </div>
              <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                <button type="submit" class="btn btn-primary" style="padding: 7px 20px; font-size: 0.82rem; font-weight: 700; border-radius: 6px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #fff; border: none; cursor: pointer;" id="btn-save-branch">Save Branch</button>
              </div>
            </form>
          </div>

          <!-- Active Branch Registry Table Section -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                🏢 Active Branch Registry
              </h3>
              <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 600;">${branches.length} Configured Locations</span>
            </div>
            <div class="table-wrapper" style="max-height: 550px; overflow-x: auto; overflow-y: auto; border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px;">
              <table style="width: 100%; border-collapse: collapse; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Branch</th>
                    <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Code & Routing</th>
                    <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Address</th>
                    <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Vault / Cash</th>
                    <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Limits</th>
                    <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; white-space: nowrap;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${branches.map(b => `
                    <tr id="branch-row-${b.id}" style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 12px;"><b style="font-size: 0.85rem; color: #0f172a;">${b.name}</b></td>
                      <td style="padding: 10px 12px;">
                        <code style="font-size: 0.78rem; color: #0284c7; font-weight: bold;">${b.code}</code><br>
                        <span style="font-size: 0.72rem; color: #0369a1; font-weight: 600;">IFSC: ${b.ifscCode || 'NXSB0000001'}</span><br>
                        <span style="font-size: 0.72rem; color: #64748b;">MICR: ${b.micrCode || '110240001'}</span>
                      </td>
                      <td style="padding: 10px 12px;"><span style="font-size: 0.8rem; color: #475569;">${b.address || '-'}</span></td>
                      <td style="padding: 10px 12px;">
                        <span style="font-size: 0.78rem; color: #334155; font-weight: 500;">Vault: ₹${(b.vaultBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span><br>
                        <span style="font-size: 0.78rem; color: #334155; font-weight: 500;">Cash: ₹${(b.cashInHand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td style="padding: 10px 12px;">
                        <span style="font-size: 0.72rem; color: #64748b;">Min: ₹${(b.minVaultLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span><br>
                        <span style="font-size: 0.72rem; color: #64748b;">Max: ₹${(b.maxVaultLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td style="padding: 10px 12px; white-space: nowrap;">
                        <div style="display: flex; gap: 6px; align-items: center;">
                          <button class="btn btn-outline-primary btn-xs" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; cursor: pointer;" onclick="editBranchDetails('${b.id}')">✏️ Edit</button>
                          <button class="btn btn-outline-danger btn-xs" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; cursor: pointer;" onclick="deleteExistingBranch('${b.id}')">🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      document.getElementById('branch-config-form').addEventListener('submit', handleBranchSave);
    }
  } catch (err) {
    console.error('Admin render error:', err);
    if (err.message && (err.message.includes('suspended') || err.message.includes('deleted') || err.message.includes('expired') || err.isAuthError)) {
      triggerLogout();
      return;
    }
    container.innerHTML = `
      <div class="card text-center" style="padding: 40px; margin: 20px auto; max-width: 600px;">
        <h2 style="color: var(--danger); margin-bottom: 12px;">⚠️ Workspace View Error</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${err.message || 'Unable to load workspace data.'}</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 15px;">
          <button class="btn btn-outline-primary" onclick="switchTab('${tab}')">🔄 Retry</button>
          <button class="btn btn-primary" onclick="triggerLogout()">🔑 Sign In Again</button>
        </div>
      </div>
    `;
  }
}



// Backups Loader
async function loadBackupsList() {
  try {
    const list = await apiCall('/api/system/backups/list');
    const target = document.getElementById('backups-list-target');
    if (list.length === 0) {
      target.innerHTML = `<tr><td colspan="4" class="text-center">No backups found.</td></tr>`;
      return;
    }
    target.innerHTML = list.map(b => `
      <tr>
        <td><code>${b.filename}</code></td>
        <td>${(b.size / 1024).toFixed(2)} KB</td>
        <td>${new Date(b.createdAt).toLocaleString()}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm" onclick="restoreSystemBackup('${b.filename}')">Restore File</button>
        </td>
      </tr>
    `).join('');
  } catch(e){}
}

async function createSystemBackup() {
  try {
    await apiCall('/api/system/backups', 'POST');
    showToast('Database backup created.', 'success');
    loadBackupsList();
  } catch(e){}
}

async function restoreSystemBackup(file) {
  if (confirm(`Are you sure you want to restore ${file}? This will overwrite active DB configurations.`)) {
    try {
      await apiCall('/api/system/restore', 'POST', { filename: file });
      showToast('Database state successfully recovered.', 'success');
      loadBackupsList();
    } catch(e){}
  }
}

// User CRUD triggers
// User CRUD triggers
function openCreateUserModal() {
  const name = prompt("Enter User Full Name:");
  const email = prompt("Enter User Email:");
  const password = prompt("Enter User Password:");
  const role = prompt("Enter User Role (Employee / Branch Manager / Customer):");
  
  if (name && email && password && role) {
    apiCall('/api/dashboard/users', 'POST', { email, password, role, fullName: name })
      .then(() => {
        showToast('User created successfully.', 'success');
        switchTab('users');
      });
  }
}

async function verifyKycAction(userId, action) {
  const remarks = prompt(`Enter verification remarks for ${action.toUpperCase()}:`, `Manual verification ${action}d by staff.`);
  try {
    await apiCall('/api/kyc/verify', 'POST', { userId, action, remarks });
    showToast(`User KYC status updated to ${action === 'approve' ? 'Verified' : 'Rejected'}.`, 'success');
    switchTab('kyc');
  } catch (e) {
    showToast(e.message || 'Verification update failed', 'danger');
  }
}

function editUser(id, currentName, currentStatus) {
  const name = prompt("Modify Full Name:", currentName);
  const status = prompt("Modify Status (active / suspended):", currentStatus);
  if (name && status) {
    apiCall('/api/dashboard/users', 'PUT', { userId: id, fullName: name, status })
      .then(() => {
        showToast('User modified successfully.', 'success');
        switchTab('users');
      });
  }
}

function deleteUser(id) {
  if (confirm('Delete user from database permanently?')) {
    apiCall(`/api/dashboard/users/${id}`, 'DELETE')
      .then(() => {
        showToast('User deleted.', 'success');
        switchTab('users');
      });
  }
}

// Submit Provision Staff Form
async function handleUserProvisionSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('prov-email').value;
  const fullName = document.getElementById('prov-fullname').value;
  const role = document.getElementById('prov-role').value;
  const branchId = document.getElementById('prov-branch').value;

  try {
    const data = await apiCall('/api/auth/provision', 'POST', {
      email,
      fullName,
      role,
      branchId
    });

    showToast('Staff member provisioned successfully.', 'success');
    
    // Display result credentials
    if (document.getElementById('prov-res-userid')) {
      document.getElementById('prov-res-userid').innerText = data.userId || data.id;
    }
    document.getElementById('prov-res-email').innerText = data.email;
    document.getElementById('prov-res-password').innerText = data.tempPassword;
    document.getElementById('provision-result-box').classList.remove('hidden');

    // Reset fields
    document.getElementById('prov-email').value = '';
    document.getElementById('prov-fullname').value = '';
    
    // Refresh registry list
    setTimeout(() => { switchTab('users'); }, 1500);
  } catch(err){}
}

function toggleUserEmailCol(val) {
  state.userEmailColMode = val;
  switchTab('users');
}

function filterUserRoleStatus(val) {
  state.userRoleStatusFilter = val;
  switchTab('users');
}

async function handleCustomerRegisterFormSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('cust-reg-fullname').value;
  const email = document.getElementById('cust-reg-email').value;
  const mobileNumber = document.getElementById('cust-reg-mobile').value;
  const accountNumber = document.getElementById('cust-reg-accno') ? document.getElementById('cust-reg-accno').value : '';
  const panNumber = document.getElementById('cust-reg-pan') ? document.getElementById('cust-reg-pan').value : '';
  const dob = document.getElementById('cust-reg-dob') ? document.getElementById('cust-reg-dob').value : '1995-01-01';
  const sdhwo = document.getElementById('cust-reg-sdhwo') ? document.getElementById('cust-reg-sdhwo').value : '';
  const mopType = document.getElementById('cust-reg-mop') ? document.getElementById('cust-reg-mop').value : 'Self';
  const branchId = document.getElementById('cust-reg-branch').value;
  const accountType = document.getElementById('cust-reg-acctype').value;
  const initialDeposit = document.getElementById('cust-reg-deposit').value;

  try {
    const data = await apiCall('/api/customers/register', 'POST', {
      fullName,
      email,
      mobileNumber,
      accountNumber,
      panNumber,
      dob,
      sdhwo,
      mopType,
      branchId,
      accountType,
      initialDeposit
    });

    showToast('Customer registered & account generated successfully.', 'success');
    document.getElementById('cust-res-userid').innerText = data.userId || data.customer?.id;
    document.getElementById('cust-res-accno').innerText = data.account?.accountNumber;
    document.getElementById('cust-res-email').innerText = data.customer?.email;
    document.getElementById('cust-res-password').innerText = data.tempPassword;
    document.getElementById('cust-reg-result-box').classList.remove('hidden');

    document.getElementById('cust-reg-fullname').value = '';
    document.getElementById('cust-reg-email').value = '';
    document.getElementById('cust-reg-mobile').value = '';
    if (document.getElementById('cust-reg-accno')) document.getElementById('cust-reg-accno').value = '';
    if (document.getElementById('cust-reg-pan')) document.getElementById('cust-reg-pan').value = '';
    if (document.getElementById('cust-reg-sdhwo')) document.getElementById('cust-reg-sdhwo').value = '';
    setTimeout(() => { switchTab('customer-registry'); }, 1500);
  } catch(err) {
    showToast(err.message || 'Customer registration failed', 'danger');
  }
}

function toggleCustEmailCol(val) {
  state.custEmailColMode = val;
  switchTab('customer-registry');
}

async function toggleCustFreeze(customerId, currentStatus) {
  const action = currentStatus === 'frozen' ? 'unfreeze' : 'freeze';
  try {
    await apiCall('/api/customers/freeze', 'POST', { customerId, action });
    showToast(`Customer account ${action === 'freeze' ? 'frozen' : 'unfrozen'} successfully.`, 'success');
    switchTab('customer-registry');
  } catch(e){}
}

async function deleteCustomerRecord(customerId, name) {
  if (confirm(`Are you sure you want to delete customer "${name}" and all linked accounts permanently?`)) {
    try {
      await apiCall(`/api/customers/${customerId}`, 'DELETE');
      showToast('Customer record removed from registry.', 'success');
      switchTab('customer-registry');
    } catch(e){}
  }
}

// Suspend/Activate Toggle
async function toggleUserSuspension(userId, action) {
  const endpoint = action === 'suspend' ? '/api/users/suspend' : '/api/users/activate';
  try {
    await apiCall(endpoint, 'POST', { userId });
    showToast(`User status updated to ${action === 'suspend' ? 'suspended' : 'active'}.`, 'success');
    switchTab('users');
  } catch(e){}
}

// Open Edit User Modal (Full CRUD Edit)
function openEditUserModal(userId) {
  const users = window.cachedUsers || [];
  const branches = window.cachedBranches || [];
  const user = users.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('edit-user-fullname').value = user.fullName || '';
  document.getElementById('edit-user-email').value = user.email || '';
  document.getElementById('edit-user-role').value = user.role || 'Employee';
  document.getElementById('edit-user-status').value = user.status || 'active';

  const branchSelect = document.getElementById('edit-user-branch');
  branchSelect.innerHTML = branches.map(b => 
    `<option value="${b.id}" ${b.id === user.branchId ? 'selected' : ''}>${b.name} (${b.code})</option>`
  ).join('');

  document.getElementById('edit-user-modal').classList.remove('hidden');
}

function closeEditUserModal() {
  document.getElementById('edit-user-modal').classList.add('hidden');
}

async function handleEditUserSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('edit-user-id').value;
  const fullName = document.getElementById('edit-user-fullname').value;
  const email = document.getElementById('edit-user-email').value;
  const role = document.getElementById('edit-user-role').value;
  const branchId = document.getElementById('edit-user-branch').value;
  const status = document.getElementById('edit-user-status').value;

  try {
    await apiCall('/api/dashboard/users', 'PUT', {
      userId,
      fullName,
      email,
      role,
      branchId,
      status
    });
    showToast('User details updated successfully.', 'success');
    closeEditUserModal();
    switchTab('users');
  } catch(e){}
}

// Open Transfer Branch Modal (Transfer Button)
function openTransferBranchModal(userId) {
  const users = window.cachedUsers || [];
  const branches = window.cachedBranches || [];
  const user = users.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('transfer-user-id').value = user.id;
  document.getElementById('transfer-user-name').innerText = `${user.fullName} (${user.email})`;
  document.getElementById('transfer-user-role-badge').innerText = `Role: ${user.role} | Current Branch: ${user.branchName || user.branchId || 'Global HQ'}`;

  const branchSelect = document.getElementById('transfer-target-branch');
  branchSelect.innerHTML = branches.map(b => 
    `<option value="${b.id}" ${b.id === user.branchId ? 'selected' : ''}>🏢 ${b.name} - ${b.code} (${b.address || 'Central Scope'})</option>`
  ).join('');

  document.getElementById('transfer-branch-modal').classList.remove('hidden');
}

function closeTransferBranchModal() {
  document.getElementById('transfer-branch-modal').classList.add('hidden');
}

async function handleTransferBranchSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('transfer-user-id').value;
  const branchId = document.getElementById('transfer-target-branch').value;

  try {
    await apiCall('/api/users/reassign-branch', 'POST', { userId, branchId });
    showToast('User transferred to destination branch successfully.', 'success');
    closeTransferBranchModal();
    switchTab('users');
  } catch(e){}
}

// Delete user by Admin (Full CRUD Delete)
async function deleteUserByAdmin(userId) {
  const user = (window.cachedUsers || []).find(u => u.id === userId);
  const name = user ? user.fullName : userId;
  if (confirm(`Are you sure you want to delete user "${name}" permanently?`)) {
    try {
      await apiCall(`/api/dashboard/users/${userId}`, 'DELETE');
      showToast('User removed from bank registry.', 'success');
      switchTab('users');
    } catch(e){}
  }
}

// Reset password by Admin (generate temp password)
async function resetPasswordByAdmin(userId) {
  const newPassword = prompt('Enter a new temporary password (or leave empty to generate automatically):');
  try {
    const data = await apiCall('/api/users/reset-password', 'POST', { userId, newPassword });
    alert(`Temporary password generated for user: ${data.tempPassword}\nThey will be forced to change it on next login.`);
    switchTab('users');
  } catch(e){}
}

// Branch Management CRUD helpers
async function editBranchDetails(branchId) {
  try {
    const branches = await apiCall('/api/branches');
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;

    document.getElementById('edit-branch-id').value = branch.id;
    document.getElementById('branch-name-input').value = branch.name;
    document.getElementById('branch-code-input').value = branch.code;
    if (document.getElementById('branch-ifsc-input')) document.getElementById('branch-ifsc-input').value = branch.ifscCode || 'NXSB0000001';
    if (document.getElementById('branch-micr-input')) document.getElementById('branch-micr-input').value = branch.micrCode || '110240001';
    document.getElementById('branch-address-input').value = branch.address || '';
    document.getElementById('branch-vault-balance-input').value = branch.vaultBalance || 0;
    document.getElementById('branch-cash-in-hand-input').value = branch.cashInHand || 0;
    document.getElementById('branch-min-vault-input').value = branch.minVaultLimit || 0;
    document.getElementById('branch-max-vault-input').value = branch.maxVaultLimit || 0;
    
    document.getElementById('branch-editor-title').innerText = `🏢 Edit Branch: ${branch.name}`;
    document.getElementById('btn-save-branch').innerText = 'Update Branch';
  } catch(e) {}
}

function resetBranchForm() {
  document.getElementById('edit-branch-id').value = '';
  document.getElementById('branch-name-input').value = '';
  document.getElementById('branch-code-input').value = '';
  if (document.getElementById('branch-ifsc-input')) document.getElementById('branch-ifsc-input').value = 'NXSB0000001';
  if (document.getElementById('branch-micr-input')) document.getElementById('branch-micr-input').value = '110240001';
  document.getElementById('branch-address-input').value = '';
  document.getElementById('branch-vault-balance-input').value = '0.00';
  document.getElementById('branch-cash-in-hand-input').value = '0.00';
  document.getElementById('branch-min-vault-input').value = '100000.00';
  document.getElementById('branch-max-vault-input').value = '10000000.00';
  
  document.getElementById('branch-editor-title').innerText = '🏢 Configure Branch';
  document.getElementById('btn-save-branch').innerText = 'Save Branch';
}

async function handleBranchSave(e) {
  e.preventDefault();
  const id = document.getElementById('edit-branch-id').value;
  const name = document.getElementById('branch-name-input').value;
  const code = document.getElementById('branch-code-input').value;
  const ifscCode = document.getElementById('branch-ifsc-input') ? document.getElementById('branch-ifsc-input').value : 'NXSB0000001';
  const micrCode = document.getElementById('branch-micr-input') ? document.getElementById('branch-micr-input').value : '110240001';
  const address = document.getElementById('branch-address-input').value;
  const vaultBalance = parseFloat(document.getElementById('branch-vault-balance-input').value) || 0;
  const cashInHand = parseFloat(document.getElementById('branch-cash-in-hand-input').value) || 0;
  const minVaultLimit = parseFloat(document.getElementById('branch-min-vault-input').value) || 0;
  const maxVaultLimit = parseFloat(document.getElementById('branch-max-vault-input').value) || 0;

  const payload = { name, code, ifscCode, micrCode, address, vaultBalance, cashInHand, minVaultLimit, maxVaultLimit };

  try {
    if (id) {
      await apiCall(`/api/branches/${id}`, 'PUT', payload);
      showToast('Branch updated successfully.', 'success');
    } else {
      await apiCall('/api/branches', 'POST', payload);
      showToast('Branch created successfully.', 'success');
    }
    resetBranchForm();
    switchTab('branches');
  } catch (err) {}
}

async function deleteExistingBranch(branchId) {
  if (confirm('Delete this branch permanently?')) {
    try {
      await apiCall(`/api/branches/${branchId}`, 'DELETE');
      showToast('Branch deleted successfully.', 'success');
      switchTab('branches');
    } catch(e){}
  }
}

// Custom Role Config form submissions & actions
async function handleRoleSave(e) {
  e.preventDefault();
  const roleId = document.getElementById('edit-role-id').value;
  const name = document.getElementById('role-name-input').value;

  const moduleChks = document.querySelectorAll('input[name="role-modules"]:checked');
  const modules = Array.from(moduleChks).map(c => c.value);

  const permChks = document.querySelectorAll('.perm-chk:checked');
  const permissions = Array.from(permChks).map(chk => {
    const permId = chk.getAttribute('data-permission-id');
    const select = document.querySelector(`.perm-scope[data-permission-id="${permId}"]`);
    return {
      permissionId: permId,
      scope: select ? select.value : 'Global'
    };
  });

  if (modules.length === 0) {
    showToast('Select at least one authorized module.', 'warning');
    return;
  }

  try {
    if (roleId) {
      await apiCall('/api/roles', 'PUT', { roleId, name, modules, permissions });
      showToast('Role updated successfully.', 'success');
    } else {
      await apiCall('/api/roles', 'POST', { name, modules, permissions });
      showToast('Role created successfully.', 'success');
    }
    resetRoleForm();
    switchTab('role-manager');
  } catch (err) {}
}

function resetRoleForm() {
  document.getElementById('edit-role-id').value = '';
  document.getElementById('role-name-input').value = '';
  document.getElementById('role-name-input').readOnly = false;
  document.getElementById('role-editor-title').innerText = '🛡️ Configure Custom Role';
  
  const moduleChks = document.querySelectorAll('input[name="role-modules"]');
  moduleChks.forEach(chk => chk.checked = false);

  const permChks = document.querySelectorAll('.perm-chk');
  permChks.forEach(chk => chk.checked = false);

  const permScopes = document.querySelectorAll('.perm-scope');
  permScopes.forEach(select => select.value = 'Global');
}

async function editRoleDetails(role) {
  resetRoleForm();
  document.getElementById('edit-role-id').value = role.id;
  document.getElementById('role-name-input').value = role.name;
  if (!role.custom) {
    document.getElementById('role-name-input').readOnly = true;
  }
  document.getElementById('role-editor-title').innerText = `🛡️ Edit Role: ${role.name}`;

  const moduleChks = document.querySelectorAll('input[name="role-modules"]');
  moduleChks.forEach(chk => {
    if (role.modules && role.modules.includes(chk.value)) {
      chk.checked = true;
    }
  });

  try {
    const data = await apiCall('/api/roles');
    const rolePerms = data.rolePermissions.filter(rp => rp.roleId === role.id);
    
    rolePerms.forEach(rp => {
      const chk = document.querySelector(`.perm-chk[data-permission-id="${rp.permissionId}"]`);
      if (chk) {
        chk.checked = true;
      }
      const select = document.querySelector(`.perm-scope[data-permission-id="${rp.permissionId}"]`);
      if (select) {
        select.value = rp.scope;
      }
    });
  } catch(e) {}
}

async function cloneExistingRole(roleId) {
  const newName = prompt('Enter a name for the cloned role:');
  if (newName) {
    try {
      await apiCall('/api/roles/clone', 'POST', { roleId, newName });
      showToast('Role cloned successfully.', 'success');
      switchTab('role-manager');
    } catch(e){}
  }
}

async function deleteCustomRole(roleId) {
  if (confirm('Delete this custom role permanently?')) {
    try {
      await apiCall(`/api/roles/${roleId}`, 'DELETE');
      showToast('Role deleted successfully.', 'success');
      switchTab('role-manager');
    } catch(e){}
  }
}

// General Ledger Tab loaders
async function loadGlBalanceTab() {
  const target = document.getElementById('ledger-sub-workspace');
  try {
    const list = await apiCall('/api/accounting/ledger');
    target.innerHTML = `
      <div class="card">
        <h3>General Ledger Account List</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>GL Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th>Current Balance</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(gl => `
                <tr>
                  <td><code>${gl.code}</code></td>
                  <td><b>${gl.name}</b></td>
                  <td><span class="status-badge ${gl.type === 'asset' || gl.type === 'expense' ? 'active' : 'frozen'}">${gl.type}</span></td>
                  <td><b class="text-info">₹${gl.balance.toFixed(2)}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(e){}
}

function switchSubTab(e, subTabId) {
  const subtabs = e.target.parentElement.querySelectorAll('.subtab-btn');
  subtabs.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');

  if (subTabId === 'gl-balance') {
    loadGlBalanceTab();
  } else if (subTabId === 'journal-entry') {
    renderJournalEntryTab();
  } else if (subTabId === 'trial-bal') {
    loadTrialBalanceTab();
  } else if (subTabId === 'statements') {
    loadStatementsTab();
  } else if (subTabId === 'api-keys') {
    loadApiKeysTab();
  } else if (subTabId === 'api-logs') {
    loadApiLogsTab();
  } else if (subTabId === 'swagger') {
    loadSwaggerDocsTab();
  }
}

function renderJournalEntryTab() {
  const target = document.getElementById('ledger-sub-workspace');
  target.innerHTML = `
    <div class="card">
      <h3>Post Balanced Journal Entry</h3>
      <form id="journal-post-form" style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
        <div class="form-group">
          <label>Journal Entry Description</label>
          <input type="text" id="j-desc" required placeholder="e.g. Audit adjusting balance entry">
        </div>
        
        <div id="journal-lines-container">
          <div class="form-row mt-1">
            <input type="text" placeholder="GL Code (e.g. 1010)" class="j-code" required>
            <select class="j-type"><option value="debit">DEBIT</option><option value="credit">CREDIT</option></select>
            <input type="number" step="0.01" placeholder="Amount" class="j-amount" required>
          </div>
          <div class="form-row mt-1">
            <input type="text" placeholder="GL Code (e.g. 2010)" class="j-code" required>
            <select class="j-type"><option value="credit">CREDIT</option><option value="debit">DEBIT</option></select>
            <input type="number" step="0.01" placeholder="Amount" class="j-amount" required>
          </div>
        </div>
        
        <div>
          <button type="button" class="btn btn-outline-primary btn-sm" onclick="addJournalInputLine()">+ Add Entry Line</button>
          <button type="submit" class="btn btn-success">Post Double Entry</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('journal-post-form').addEventListener('submit', handleJournalPost);
}

function addJournalInputLine() {
  const row = document.createElement('div');
  row.className = 'form-row mt-1';
  row.innerHTML = `
    <input type="text" placeholder="GL Code" class="j-code" required>
    <select class="j-type"><option value="debit">DEBIT</option><option value="credit">CREDIT</option></select>
    <input type="number" step="0.01" placeholder="Amount" class="j-amount" required>
  `;
  document.getElementById('journal-lines-container').appendChild(row);
}

async function handleJournalPost(e) {
  e.preventDefault();
  const desc = document.getElementById('j-desc').value;
  const codes = document.querySelectorAll('.j-code');
  const types = document.querySelectorAll('.j-type');
  const amounts = document.querySelectorAll('.j-amount');

  const lines = [];
  for (let i = 0; i < codes.length; i++) {
    lines.push({
      glCode: codes[i].value,
      type: types[i].value,
      amount: parseFloat(amounts[i].value)
    });
  }

  try {
    await apiCall('/api/accounting/journal', 'POST', { description: desc, lines });
    showToast('Double entry journal posted successfully.', 'success');
    renderJournalEntryTab();
  } catch(e){}
}

async function loadTrialBalanceTab() {
  const target = document.getElementById('ledger-sub-workspace');
  try {
    const data = await apiCall('/api/accounting/trial-balance');
    target.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>Trial Balance Sheet</h3>
          <span class="status-badge ${data.totals.matched ? 'active' : 'rejected'}">
            ${data.totals.matched ? 'BALANCED' : 'IMBALANCED'}
          </span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>GL Code</th>
                <th>Account Name</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              ${data.rows.map(r => `
                <tr>
                  <td><code>${r.code}</code></td>
                  <td>${r.name}</td>
                  <td>${r.debit > 0 ? `$${r.debit.toFixed(2)}` : '-'}</td>
                  <td>${r.credit > 0 ? `$${r.credit.toFixed(2)}` : '-'}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid var(--border-color); font-weight:700;">
                <td colspan="2">TOTAL</td>
                <td class="text-info">₹${data.totals.debit.toFixed(2)}</td>
                <td class="text-info">₹${data.totals.credit.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(e){}
}

async function loadStatementsTab() {
  const target = document.getElementById('ledger-sub-workspace');
  try {
    const bs = await apiCall('/api/accounting/balance-sheet');
    const pl = await apiCall('/api/accounting/pl');

    target.innerHTML = `
      <div class="dashboard-grid">
        <div class="card">
          <h3>Balance Sheet Report</h3>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th colspan="2">Assets</th></tr>
              </thead>
              <tbody>
                ${bs.assets.map(a => `<tr><td>${a.name}</td><td class="text-right">₹${a.balance}</td></tr>`).join('')}
                <tr style="font-weight:700; border-top:1px solid var(--border-color);">
                  <td>TOTAL ASSETS</td><td class="text-right">₹${bs.totals.assets}</td>
                </tr>
                <thead>
                  <tr><th colspan="2">Liabilities</th></tr>
                </thead>
                ${bs.liabilities.map(l => `<tr><td>${l.name}</td><td class="text-right">₹${l.balance}</td></tr>`).join('')}
                <tr style="font-weight:700; border-top:1px solid var(--border-color);">
                  <td>TOTAL LIABILITIES</td><td class="text-right">₹${bs.totals.liabilities}</td>
                </tr>
                <thead>
                  <tr><th colspan="2">Equity Capital</th></tr>
                </thead>
                ${bs.equity.map(e => `<tr><td>${e.name}</td><td class="text-right">₹${e.balance}</td></tr>`).join('')}
                <tr style="font-weight:700; border-top:1px solid var(--border-color);">
                  <td>TOTAL EQUITY</td><td class="text-right">₹${bs.totals.equity}</td>
                </tr>
                <tr style="font-weight:800; border-top:2px solid var(--accent-primary); font-size:1rem;">
                  <td>TOTAL LIABILITIES & EQUITY</td><td class="text-right">₹${bs.totals.liabilitiesAndEquity}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h3>Income Statement (Profit & Loss)</h3>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th colspan="2">Operating Revenue</th></tr>
              </thead>
              <tbody>
                ${pl.revenue.map(r => `<tr><td>${r.name}</td><td class="text-right">₹${r.balance}</td></tr>`).join('')}
                <tr style="font-weight:700; border-top:1px solid var(--border-color);">
                  <td>TOTAL REVENUE</td><td class="text-right">₹${pl.totals.revenue}</td>
                </tr>
                <thead>
                  <tr><th colspan="2">Operating Expense</th></tr>
                </thead>
                ${pl.expenses.map(e => `<tr><td>${e.name}</td><td class="text-right">₹${e.balance}</td></tr>`).join('')}
                <tr style="font-weight:700; border-top:1px solid var(--border-color);">
                  <td>TOTAL EXPENSES</td><td class="text-right">₹${pl.totals.expense}</td>
                </tr>
                <tr style="font-weight:800; border-top:2px solid var(--accent-secondary); font-size:1.1rem; background:rgba(6,182,212,0.1)">
                  <td>NET BANKING INCOME</td><td class="text-right text-success">₹${pl.totals.netIncome}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch(e){}
}

// Developer Keys portal rendering
async function loadApiKeysTab() {
  const target = document.getElementById('dev-portal-sub');
  try {
    const list = await apiCall('/api/developer/keys');
    target.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>Active developer API Keys</h3>
          <button class="btn btn-outline-primary btn-sm" onclick="generateDevApiKey()">Generate New Key</button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Key Name</th>
                <th>Hash preview</th>
                <th>Rate Limit</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `<tr><td colspan="6" class="text-center">No keys configured.</td></tr>` : ''}
              ${list.map(k => `
                <tr>
                  <td><b>${k.name}</b></td>
                  <td><code>${k.keyHash.substring(0, 16)}...</code></td>
                  <td>${k.rateLimit} req/min</td>
                  <td>${k.usageCount} calls</td>
                  <td><span class="status-badge ${k.status}">${k.status}</span></td>
                  <td>
                    ${k.status === 'active' ? `<button class="btn btn-outline-danger btn-sm" onclick="revokeDevKey('${k.id}')">Revoke</button>` : '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(e){}
}

async function generateDevApiKey() {
  const keyName = prompt('Enter a identifier name for this Key:');
  const rateLimit = prompt('Enter Rate limit (requests per minute):', '60');
  
  if (keyName) {
    try {
      const data = await apiCall('/api/developer/keys', 'POST', { keyName, rateLimit });
      alert(`API Key Generated: ${data.apiKey}\nCopy it now. We do not store this plain text key.`);
      loadApiKeysTab();
    } catch(e){}
  }
}

async function revokeDevKey(id) {
  if (confirm('Revoke this key? Apps using this key will immediately return 401.')) {
    try {
      await apiCall('/api/developer/keys/revoke', 'POST', { keyId: id });
      loadApiKeysTab();
    } catch(e){}
  }
}

async function loadApiLogsTab() {
  const target = document.getElementById('dev-portal-sub');
  try {
    const data = await apiCall('/api/developer/logs');
    target.innerHTML = `
      <div class="card">
        <h3>Live API Logs</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Key Name</th>
                <th>HTTP Method</th>
                <th>Path</th>
                <th>Latency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.logs.length === 0 ? `<tr><td colspan="6" class="text-center">No external API logs recorded yet.</td></tr>` : ''}
              ${data.logs.map(l => {
                const key = data.keys.find(k => k.id === l.apiKeyId) || { name: 'Unknown Key' };
                return `
                  <tr>
                    <td>${new Date(l.timestamp).toLocaleTimeString()}</td>
                    <td>${key.name}</td>
                    <td><b class="text-info">${l.method}</b></td>
                    <td><code>${l.path}</code></td>
                    <td>${l.responseTime}ms</td>
                    <td><span class="status-badge ${l.statusCode < 300 ? 'active' : 'rejected'}">${l.statusCode}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(e){}
}

async function loadSwaggerDocsTab() {
  const target = document.getElementById('dev-portal-sub');
  try {
    const swagger = await apiCall('/api/developer/swagger');
    const fullUrl = `${window.location.origin}/api/developer/swagger`;
    target.innerHTML = `
      <div class="card">
        <h3>OpenAPI Spec Documentation</h3>
        <p class="text-secondary" style="margin-bottom:12px;">
          Active Swagger Endpoint: 
          <a href="${fullUrl}" target="_blank" style="color: var(--accent-secondary); text-decoration: underline; font-family: var(--font-mono);">${fullUrl}</a>
        </p>
        <p class="text-secondary" style="margin-bottom:12px;">Copy this Swagger file to import into Postman or Swagger UI. Headers must contain <code>x-api-key: sk_bank_...</code></p>
        <div class="terminal-block">${JSON.stringify(swagger, null, 2)}</div>
      </div>
    `;
  } catch(e){}
}

// Security Alerts
async function loadAdminAlertsFeed() {
  const container = document.getElementById('admin-alerts-feed');
  if (!container) return;
  try {
    const raw = await apiCall('/api/fraud/alerts');
    const alerts = Array.isArray(raw) ? raw : (raw?.alerts || []);
    if (alerts.length === 0) {
      container.innerHTML = `<p class="empty-notif">No fraudulent actions detected.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Alert Date</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${alerts.map(a => `
              <tr>
                <td>${new Date(a.timestamp || Date.now()).toLocaleTimeString()}</td>
                <td><b>${a.type || 'Alert'}</b></td>
                <td><span class="status-badge ${a.severity === 'critical' || a.severity === 'high' ? 'rejected' : 'pending'}">${a.severity || 'info'}</span></td>
                <td><span style="font-size:0.85rem">${a.description || '-'}</span></td>
                <td>
                  ${a.status === 'pending' ? `
                    <button class="btn btn-outline-danger btn-sm" onclick="handleFraudAlert('${a.id}', 'freeze_account')">Freeze Acc</button>
                    <button class="btn btn-outline-primary btn-sm" onclick="handleFraudAlert('${a.id}', 'dismiss')">Dismiss</button>
                  ` : `<span class="status-badge active">${a.status || 'resolved'}</span>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="empty-notif text-muted">Security alert feed temporarily unavailable.</p>`;
  }
}

async function handleFraudAlert(id, action) {
  try {
    await apiCall('/api/fraud/resolve', 'POST', { alertId: id, action });
    showToast('Fraud alert processed.', 'success');
    loadAdminAlertsFeed();
  } catch(e){}
}

async function loadAdminAuditLogs() {
  const container = document.getElementById('admin-audit-logs');
  if (!container) return;
  try {
    const raw = await apiCall('/api/accounting/journal-history');
    const logs = Array.isArray(raw) ? raw : (raw?.history || raw?.logs || []);
    if (logs.length === 0) {
      container.innerHTML = `<p class="empty-notif text-muted">No recent audit log records.</p>`;
      return;
    }
    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Date</th><th>Actor</th><th>Change Description</th></tr>
          </thead>
          <tbody>
            ${logs.slice(-10).map(l => `
              <tr>
                <td>${l.date || '-'}</td>
                <td><code>${l.createdBy || l.userId || 'system'}</code></td>
                <td>${l.description || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="empty-notif text-muted">Audit logs feed temporarily unavailable.</p>`;
  }
}

async function triggerInterestPosting() {
  try {
    const res = await apiCall('/api/interest/post', 'POST');
    showToast(res.message, 'success');
    switchTab('interest');
  } catch(e){}
}


// ==========================================
// RENDER BRANCH MANAGER VIEWS
// ==========================================
async function renderManager(tab, container) {
  try {
    if (tab === 'branch-customers') {
      await renderBranchCustomersView(container);
      return;
    }
    if (tab === 'summary') {
      const data = await apiCall('/api/dashboard/summary');
      container.innerHTML = `
        <div class="card">
          <h2>Branch Metrics: ${data.branch.name}</h2>
          <div class="stats-grid mt-2">
            <div class="stat-card">
              <h3>Vault Balance</h3>
              <div class="stat-val text-info">₹${data.branch.vaultBalance.toFixed(2)}</div>
              <div class="stat-desc">Safety thresholds: Min ₹${data.branch.minVaultLimit} / Max ₹${data.branch.maxVaultLimit}</div>
            </div>
            <div class="stat-card">
              <h3>Cash in Hand</h3>
              <div class="stat-val">₹${data.branch.cashInHand.toFixed(2)}</div>
              <div class="stat-desc">Distributed cash inside teller drawers</div>
            </div>
            <div class="stat-card">
              <h3>Active Tellers</h3>
              <div class="stat-val">${data.employees.length}</div>
              <div class="stat-desc">Seeded branch employee agents</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <h3>Approval Worklist Queue</h3>
            <div id="manager-approvals-list">Loading workflows...</div>
          </div>
          <div class="card">
            <h3>Teller Drawer Allocations</h3>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Teller</th><th>Drawer Cash</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${data.tellerPositions.map(cp => `
                    <tr>
                      <td><code>${cp.tellerId}</code></td>
                      <td><b>₹${cp.cashInHand}</b></td>
                      <td><span class="status-badge ${cp.status === 'active' ? 'active' : 'rejected'}">${cp.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      loadManagerWorkflows(data.pendingApprovals);
    } else if (tab === 'approvals') {
      const data = await apiCall('/api/dashboard/summary');
      container.innerHTML = `
        <div class="card">
          <h3>Pending Workflow Approvals</h3>
          <div id="approvals-page-list">Loading approvals...</div>
        </div>
      `;
      loadManagerWorkflows(data.pendingApprovals, 'approvals-page-list');
    } else if (tab === 'employees') {
      const data = await apiCall('/api/dashboard/summary');
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3>Branch Tellers</h3>
            <button class="btn btn-primary btn-sm" onclick="openCreateTellerModal('${data.branch.id}')">Add Branch Teller</button>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${data.employees.map(emp => `
                  <tr>
                    <td><b>${emp.fullName}</b></td>
                    <td>${emp.email}</td>
                    <td>Employee</td>
                    <td><span class="status-badge ${emp.status}">${emp.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (tab === 'treasury') {
      container.innerHTML = `
        <div class="dashboard-subtabs">
          <button class="subtab-btn active" onclick="switchSubTab(event, 'vault-management')">Vault Limits</button>
          <button class="subtab-btn" onclick="switchSubTab(event, 'cash-transfer')">Branch Cash Transfers</button>
          <button class="subtab-btn" onclick="switchSubTab(event, 'drawer-reconcile')">BOD / EOD Reconciles</button>
        </div>
        <div id="treasury-sub-workspace">Loading treasury...</div>
      `;
      loadVaultManagementTab();
    } else if (tab === 'ledger') {
      loadGlBalanceTab();
    }
  } catch (err) {
    console.error('Manager render error:', err);
    if (err.message && (err.message.includes('suspended') || err.message.includes('deleted') || err.message.includes('expired') || err.isAuthError)) {
      triggerLogout();
      return;
    }
    container.innerHTML = `
      <div class="card text-center" style="padding: 40px; margin: 20px auto; max-width: 600px;">
        <h2 style="color: var(--danger); margin-bottom: 12px;">⚠️ Workspace View Error</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${err.message || 'Unable to load manager workspace data.'}</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 15px;">
          <button class="btn btn-outline-primary" onclick="switchTab('${tab}')">🔄 Retry</button>
          <button class="btn btn-primary" onclick="triggerLogout()">🔑 Sign In Again</button>
        </div>
      </div>
    `;
  }
}

function loadManagerWorkflows(items, containerId = 'manager-approvals-list') {
  const container = document.getElementById(containerId);
  if (items.length === 0) {
    container.innerHTML = `<p class="empty-notif">No approval workflows pending.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Workflow Entity</th>
            <th>Trigger Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td><b>${item.subject}</b> (ID: <code>${item.entityId}</code>)</td>
              <td><span class="status-badge frozen">${item.entityType}</span></td>
              <td><span class="status-badge pending">Awaiting manager</span></td>
              <td>
                <button class="btn btn-success btn-sm" onclick="processWorkflow('${item.id}', 'approve')">Approve</button>
                <button class="btn btn-outline-danger btn-sm" onclick="processWorkflow('${item.id}', 'reject')">Reject</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function processWorkflow(executionId, action) {
  const comment = prompt(`Enter optional comment for ${action}:`);
  try {
    await apiCall('/api/workflows/step', 'POST', { executionId, action, comment });
    showToast(`Workflow step ${action}d.`, 'success');
    switchTab('summary');
  } catch(e){}
}

function openCreateTellerModal(branchId) {
  const fullName = prompt('Enter Teller Name:');
  const email = prompt('Enter Teller Email:');
  const password = prompt('Enter Teller Password:');
  if (fullName && email && password) {
    apiCall('/api/dashboard/users', 'POST', { email, password, role: 'Employee', fullName, branchId })
      .then(() => {
        showToast('Teller added.', 'success');
        switchTab('employees');
      });
  }
}

// Manager Treasury sub tabs
async function loadVaultManagementTab() {
  const target = document.getElementById('treasury-sub-workspace');
  try {
    const data = await apiCall('/api/treasury/summary');
    target.innerHTML = `
      <div class="card">
        <h3>Vault Cash position levels</h3>
        <div class="stats-grid mt-2">
          <div class="stat-card">
            <h3>Vault Cash</h3>
            <div class="stat-val">₹${data.vault.balance.toFixed(2)}</div>
            <div class="stat-desc">Minimum target: ₹${data.branch.minVaultLimit}</div>
          </div>
          <div class="stat-card">
            <h3>Limit status</h3>
            <div class="stat-val ${data.vault.balance < data.branch.minVaultLimit ? 'text-danger' : 'text-success'}">
              ${data.vault.balance < data.branch.minVaultLimit ? 'CRITICAL LIMIT' : 'HEALTHY'}
            </div>
            <div class="stat-desc">Liquidity warnings trigger auto-alerts</div>
          </div>
        </div>
      </div>
    `;
  } catch(e){}
}

// SwitchSubTab for manager
function switchSubTab(e, id) {
  const subtabs = e.target.parentElement.querySelectorAll('.subtab-btn');
  subtabs.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');

  if (id === 'vault-management') {
    loadVaultManagementTab();
  } else if (id === 'cash-transfer') {
    renderCashTransferTab();
  } else if (id === 'drawer-reconcile') {
    renderDrawerReconcileTab();
  }
}

async function renderCashTransferTab() {
  const target = document.getElementById('treasury-sub-workspace');
  try {
    const data = await apiCall('/api/treasury/summary');
    target.innerHTML = `
      <div class="card">
        <h3>Request Branch-to-Branch Cash Transfer</h3>
        <form id="cash-transfer-form" style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
          <div class="form-row">
            <div class="form-group">
              <label>Origin Branch</label>
              <input type="text" value="${data.branch.name}" disabled>
              <input type="hidden" id="tr-from-branch" value="${data.branch.id}">
            </div>
            <div class="form-group">
              <label>Target Branch</label>
              <select id="tr-to-branch">
                <option value="b-main">Global HQ Branch</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Amount to transfer (₹)</label>
            <input type="number" id="tr-amount" required placeholder="50000">
          </div>
          <button type="submit" class="btn btn-primary">Dispatch Request</button>
        </form>
      </div>
    `;
    document.getElementById('cash-transfer-form').addEventListener('submit', handleCashTransferSubmit);
  } catch(e){}
}

async function handleCashTransferSubmit(e) {
  e.preventDefault();
  const fromBranchId = document.getElementById('tr-from-branch').value;
  const toBranchId = document.getElementById('tr-to-branch').value;
  const amount = document.getElementById('tr-amount').value;

  try {
    await apiCall('/api/treasury/transfer', 'POST', { fromBranchId, toBranchId, amount });
    showToast('Transfer request submitted to HQ Admin.', 'success');
    renderCashTransferTab();
  } catch(e){}
}

async function renderDrawerReconcileTab() {
  const target = document.getElementById('treasury-sub-workspace');
  try {
    const data = await apiCall('/api/treasury/summary');
    target.innerHTML = `
      <div class="dashboard-grid">
        <div class="card">
          <h3>Beginning Of Day (BOD) Fund Drawer</h3>
          <form id="bod-form" style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
            <div class="form-group">
              <label>Select Teller</label>
              <select id="bod-teller">
                ${data.tellers.map(t => `<option value="${t.tellerId}">${t.tellerId}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Amount to Allocate (₹)</label>
              <input type="number" id="bod-amount" value="10000" required>
            </div>
            <button type="submit" class="btn btn-primary">Execute BOD Funding</button>
          </form>
        </div>

        <div class="card">
          <h3>End Of Day (EOD) Teller Close</h3>
          <form id="eod-form" style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
            <div class="form-group">
              <label>Select Teller</label>
              <select id="eod-teller">
                ${data.tellers.map(t => `<option value="${t.tellerId}">${t.tellerId}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Actual Cash Counted in Drawer (₹)</label>
              <input type="number" id="eod-actual" required placeholder="9950">
            </div>
            <button type="submit" class="btn btn-success">Verify and Reconcile Drawer</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('bod-form').addEventListener('submit', handleBODSubmit);
    document.getElementById('eod-form').addEventListener('submit', handleEODSubmit);
  } catch(e){}
}

async function handleBODSubmit(e) {
  e.preventDefault();
  const tellerId = document.getElementById('bod-teller').value;
  const amount = document.getElementById('bod-amount').value;
  try {
    const res = await apiCall('/api/treasury/bod', 'POST', { tellerId, amount });
    showToast(res.message, 'success');
  } catch(e){}
}

async function handleEODSubmit(e) {
  e.preventDefault();
  const tellerId = document.getElementById('eod-teller').value;
  const actualCash = document.getElementById('eod-actual').value;
  try {
    const res = await apiCall('/api/treasury/eod', 'POST', { tellerId, actualCash });
    showToast(res.message, res.status === 'reconciled' ? 'success' : 'warning');
  } catch(e){}
}


// ==========================================
// RENDER EMPLOYEE / TELLER VIEWS
// ==========================================
async function renderEmployee(tab, container) {
  try {
    const summary = await apiCall('/api/dashboard/summary');
    if (tab === 'summary') {
      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Drawer Cash</h3>
            <div class="stat-val">₹${summary.position ? summary.position.cashInHand : '0.00'}</div>
            <div class="stat-desc">Limit ceiling: $${summary.position ? summary.position.limit : '0'}</div>
          </div>
          <div class="stat-card">
            <h3>My Branch</h3>
            <div class="stat-val" style="font-size:1.2rem;">${summary.branch.name}</div>
            <div class="stat-desc">Assigned node ID: ${summary.branch.id}</div>
          </div>
        </div>

        <div class="card">
          <h3>Customer Quick Lookup</h3>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>User ID</th><th>Client Name</th><th>Email</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${summary.customers.map(c => `
                  <tr>
                    <td><code>${c.id}</code></td>
                    <td><b>${c.fullName}</b></td>
                    <td>${c.email}</td>
                    <td><span class="status-badge ${c.status}">${c.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (tab === 'customer-onboarding' || tab === 'customers') {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 850px; margin: 0 auto;">
          <div class="card" style="width: 100%; background: linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(99,102,241,0.06) 100%); border: 1px solid var(--border-color);">
            <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;">👤 Walk-in Customer Account Opening</h2>
            <p style="margin: 6px 0 0 0; color: var(--text-secondary); font-size: 0.88rem;">
              Branch Staff Onboarding Portal — Register walk-in branch customers and issue primary bank accounts.
            </p>
          </div>

          <div id="emp-onboard-result-container"></div>

          <div class="card" id="emp-onboard-form-card" style="width: 100%;">
            <form id="emp-onboard-form" onsubmit="handleTellerOnboardCustomer(event)">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Full Name *</label>
                  <input type="text" id="eo-name" required placeholder="e.g. Anish Malhotra" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;" />
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Email Address *</label>
                  <input type="email" id="eo-email" required placeholder="anish@gmail.com" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;" />
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Mobile Number *</label>
                  <input type="text" id="eo-mobile" required placeholder="+91 9820011223" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;" />
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Account Number (Custom/Auto)</label>
                  <input type="text" id="eo-accno" placeholder="Auto-generated if blank" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;" />
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Customer's PAN Number *</label>
                  <input type="text" id="eo-pan" required placeholder="ABCDE1234F" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem; text-transform: uppercase;" />
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Date of Birth (DOB) *</label>
                  <input type="date" id="eo-dob" required value="1995-01-01" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;" />
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">S/D/H/W/o *</label>
                  <input type="text" id="eo-sdhwo" required placeholder="S/o Ramesh Malhotra" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;" />
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Mode of Operation (MOP) *</label>
                  <select id="eo-mop" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;">
                    <option value="Self">Self</option>
                    <option value="Either or Survivor">Either or Survivor</option>
                    <option value="Former or Survivor">Former or Survivor</option>
                    <option value="Jointly Operated">Jointly Operated</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Account Type *</label>
                  <select id="eo-acctype" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;">
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Initial Deposit Amount (₹) *</label>
                  <input type="number" id="eo-deposit" required value="2000" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;" />
                </div>
                <div style="grid-column: span 2;">
                  <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 6px;">Residential Address</label>
                  <input type="text" id="eo-address" placeholder="Full residential street address" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem;" />
                </div>
              </div>
              <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="padding: 12px 24px; font-weight: 700; font-size: 1rem; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);">
                  ➕ Open Customer Account & Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
    } else if (tab === 'transactions') {
      container.innerHTML = `
        <div class="card">
          <h3>Assist Counter Transaction (Deposit / Withdraw / Transfer)</h3>
          <form id="teller-tx-form" style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
            <div class="form-group">
              <label>Transaction Type</label>
              <select id="tt-type">
                <option value="deposit">Deposit (Cash Received)</option>
                <option value="withdrawal">Withdrawal (Cash Disbursed)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Customer Account Number</label>
              <input type="text" id="tt-account" required placeholder="e.g. 1000987654">
            </div>
            <div class="form-group">
              <label>Amount (₹)</label>
              <input type="number" id="tt-amount" required placeholder="1000">
            </div>
            <div class="form-group">
              <label>Transaction Narrative</label>
              <input type="text" id="tt-desc" placeholder="Counter cash transaction">
            </div>
            <button type="submit" class="btn btn-success">Post Transaction to Core</button>
          </form>
        </div>
      `;
      document.getElementById('teller-tx-form').addEventListener('submit', handleTellerTransaction);
    } else if (tab === 'crm') {
      const data = await apiCall('/api/crm/data');
      container.innerHTML = `
        <div class="dashboard-grid">
          <div class="card">
            <div class="card-header"><h3>Active Leads</h3><button class="btn btn-primary btn-sm" onclick="openCreateLeadModal()">Add CRM Lead</button></div>
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Interest</th><th>Source</th><th>Status</th></tr></thead>
                <tbody>
                  ${data.leads.map(l => `
                    <tr>
                      <td><b>${l.name}</b><br><small>${l.email}</small></td>
                      <td>${l.productInterest}</td>
                      <td>${l.source}</td>
                      <td><span class="status-badge ${l.status === 'qualified' ? 'active' : 'pending'}">${l.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <h3>Active Campaigns</h3>
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Budget</th><th>Generated</th></tr></thead>
                <tbody>
                  ${data.campaigns.map(c => `
                    <tr>
                      <td><b>${c.name}</b></td>
                      <td>₹${c.budget}</td>
                      <td>${c.leadsGenerated} leads</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (tab === 'tickets') {
      const list = await apiCall('/api/dashboard/tickets');
      container.innerHTML = `
        <div class="card">
          <h3>Customer Support Tickets</h3>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Ticket ID</th><th>Title</th><th>Category</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${list.map(t => `
                  <tr>
                    <td><code>${t.id}</code></td>
                    <td><b>${t.title}</b><br><small>${t.description}</small></td>
                    <td>${t.category}</td>
                    <td><span class="status-badge ${t.status === 'open' ? 'rejected' : 'active'}">${t.status}</span></td>
                    <td>
                      ${t.status === 'open' ? `<button class="btn btn-outline-primary btn-sm" onclick="resolveTicket('${t.id}')">Reply & Resolve</button>` : 'Resolved'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (tab === 'dms') {
      const docs = await apiCall('/api/dms');
      container.innerHTML = `
        <div class="card">
          <div class="card-header"><h3>Document Vault</h3></div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Document</th><th>Owner</th><th>Version</th><th>Status</th></tr></thead>
              <tbody>
                ${docs.map(d => `
                  <tr>
                    <td><b>${d.title}</b><br><small>${d.fileName}</small></td>
                    <td><code>${d.userId}</code></td>
                    <td>Version ${d.version}</td>
                    <td><span class="status-badge ${d.status}">${d.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Employee render error:', err);
    if (err.message && (err.message.includes('suspended') || err.message.includes('deleted') || err.message.includes('expired') || err.isAuthError)) {
      triggerLogout();
      return;
    }
    container.innerHTML = `
      <div class="card text-center" style="padding: 40px; margin: 20px auto; max-width: 600px;">
        <h2 style="color: var(--danger); margin-bottom: 12px;">⚠️ Workspace View Error</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${err.message || 'Unable to load employee workspace data.'}</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 15px;">
          <button class="btn btn-outline-primary" onclick="switchTab('${tab}')">🔄 Retry</button>
          <button class="btn btn-primary" onclick="triggerLogout()">🔑 Sign In Again</button>
        </div>
      </div>
    `;
  }
}

async function handleTellerOnboardCustomer(e) {
  if (e && e.preventDefault) e.preventDefault();
  const fullName = document.getElementById('eo-name').value;
  const email = document.getElementById('eo-email').value;
  const mobileNumber = document.getElementById('eo-mobile').value;
  const accountNumber = document.getElementById('eo-accno')?.value || '';
  const panNumber = document.getElementById('eo-pan').value;
  const dob = document.getElementById('eo-dob').value;
  const sdhwo = document.getElementById('eo-sdhwo').value;
  const mopType = document.getElementById('eo-mop').value;
  const accountType = document.getElementById('eo-acctype').value;
  const initialDeposit = document.getElementById('eo-deposit').value;
  const address = document.getElementById('eo-address').value;

  try {
    const result = await apiCall('/api/customers/register', 'POST', {
      fullName,
      email,
      mobileNumber,
      accountNumber,
      panNumber,
      dob,
      sdhwo,
      mopType,
      address,
      branchId: state.user?.branchId || 'b-delhi',
      accountType,
      initialDeposit
    });

    showToast('Customer account opened successfully.', 'success');

    const resultDiv = document.getElementById('emp-onboard-result-container');
    const formCard = document.getElementById('emp-onboard-form-card');
    if (formCard) formCard.style.display = 'none';

    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="card" style="width: 100%; border: 2px solid #16a34a; background: var(--card-bg);">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 3rem;">🎉</span>
            <h2 style="color: #16a34a; margin: 8px 0 4px 0;">Customer Account Opened Successfully!</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
              The account details have been recorded in the central core banking database.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; background: rgba(22, 163, 74, 0.05); padding: 20px; border-radius: 10px; border: 1px dashed #16a34a;">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Customer Name</span>
              <div style="font-size: 1.05rem; font-weight: 700; margin-top: 2px;">${result.customer?.fullName || fullName}</div>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Assigned Customer ID</span>
              <div style="font-size: 1.1rem; font-weight: 700; color: #0284c7; font-family: monospace; margin-top: 2px;">
                ${result.customer?.userId || result.customer?.id}
              </div>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Primary Account Number</span>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); font-family: monospace; margin-top: 2px;">
                ${result.account?.accountNumber}
              </div>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Temporary Login Password</span>
              <div style="font-size: 1.05rem; font-weight: 700; color: #d97706; font-family: monospace; margin-top: 2px;">
                ${result.customer?.tempPassword || 'Cust1234!'}
              </div>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Initial Balance</span>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--success); margin-top: 2px;">
                ₹${parseFloat(result.account?.balance || initialDeposit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Mode of Operation</span>
              <div style="font-size: 0.95rem; font-weight: 600; color: var(--accent-primary); margin-top: 2px;">
                ${result.account?.mopType || mopType}
              </div>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 12px 16px; background: rgba(37,99,235,0.05); border-radius: 8px; border: 1px solid rgba(37,99,235,0.2); font-size: 0.85rem; color: var(--text-secondary);">
            ℹ️ <strong>System Scoping Notice:</strong> As a branch staff member, this account has been assigned to your branch. The Branch Manager can view this account under their <strong>Branch Customers</strong> registry, and Global HQ can monitor it under the central <strong>Customer Registry</strong>.
          </div>

          <div style="display: flex; justify-content: center; margin-top: 24px;">
            <button class="btn btn-primary" onclick="resetTellerOnboardForm()" style="padding: 12px 24px; font-weight: 700;">
              ➕ Onboard Another Customer
            </button>
          </div>
        </div>
      `;
    }
  } catch(err) {
    showToast(err.message || 'Failed to onboard customer', 'danger');
  }
}

window.resetTellerOnboardForm = function() {
  const resultDiv = document.getElementById('emp-onboard-result-container');
  const formCard = document.getElementById('emp-onboard-form-card');
  if (resultDiv) resultDiv.innerHTML = '';
  if (formCard) formCard.style.display = 'block';
};

async function handleTellerTransaction(e) {
  e.preventDefault();
  const type = document.getElementById('tt-type').value;
  const acc = document.getElementById('tt-account').value;
  const amount = parseFloat(document.getElementById('tt-amount').value);
  const desc = document.getElementById('tt-desc').value;

  try {
    const payload = {
      amount,
      type,
      description: desc
    };
    if (type === 'deposit') {
      payload.toAccountNumber = acc;
    } else {
      payload.fromAccountNumber = acc;
    }

    const res = await apiCall('/api/dashboard/transactions', 'POST', payload);
    showToast(res.message, 'success');
    switchTab('summary');
  } catch(e){}
}

function openCreateLeadModal() {
  const name = prompt('Lead Name:');
  const email = prompt('Lead Email:');
  const mobile = prompt('Lead Phone:');
  const productInterest = prompt('Product interest (Home Loan / FD / Savings):');
  
  if (name && email && mobile) {
    apiCall('/api/crm/leads', 'POST', { name, email, mobile, productInterest })
      .then(() => {
        showToast('CRM Lead added.', 'success');
        switchTab('crm');
      });
  }
}

function resolveTicket(id) {
  const reply = prompt('Enter reply response text:');
  if (reply) {
    apiCall('/api/dashboard/tickets', 'PUT', { ticketId: id, status: 'resolved', responseText: reply })
      .then(() => {
        showToast('Support ticket resolved.', 'success');
        switchTab('tickets');
      });
  }
}


// ==========================================
// RENDER CUSTOMER VIEWS
// ==========================================
async function renderCustomer(tab, container) {
  try {
    const sum = await apiCall('/api/dashboard/summary');
    if (tab === 'summary') {
      container.innerHTML = `
        <div class="stats-grid">
          ${sum.accounts.map(acc => `
            <div class="stat-card">
              <h3>${acc.type.toUpperCase()} ACCOUNT</h3>
              <div class="stat-val text-success">₹${acc.balance.toFixed(2)}</div>
              <div class="stat-desc">Account No: ${acc.accountNumber} | status: ${acc.status}</div>
            </div>
          `).join('')}
          <div class="stat-card">
            <h3>Active Credit Cards</h3>
            <div class="stat-val" style="font-size:1.4rem;">
              ${sum.cards.length === 0 ? 'No cards issued' : `${sum.cards.length} Cards`}
            </div>
            <div class="stat-desc">Debit or Credit limits status</div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <h3>Recent Account Transactions</h3>
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th></tr></thead>
                <tbody>
                  ${sum.recentTransactions.length === 0 ? `<tr><td colspan="4" class="text-center">No transactions recorded.</td></tr>` : ''}
                  ${sum.recentTransactions.map(t => `
                    <tr>
                      <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                      <td><b>${t.type.toUpperCase()}</b></td>
                      <td>${t.category}</td>
                      <td><b class="${t.type === 'deposit' ? 'text-success' : 'text-danger'}">
                        ${t.type === 'deposit' ? '+' : '-'}₹${t.amount}
                      </b></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="cards-flex">
            ${sum.cards.map(c => `
              <div class="atm-card">
                <div class="atm-card-header">
                  <span>${c.type.toUpperCase()} CARD</span>
                  <span>BHARATIYA SARVODAYA BANK</span>
                </div>
                <div class="atm-card-chip"></div>
                <div class="atm-card-num">${c.cardNumber.replace(/(\d{4})/g, '$1 ')}</div>
                <div class="atm-card-footer">
                  <div>
                    <span class="atm-card-holder">${state.user?.fullName || state.user?.name || 'Account Holder'}</span>
                  </div>
                  <div>
                    <span class="atm-card-expiry">Expires: ${c.expiryDate}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (tab === 'transfers') {
      container.innerHTML = `
        <div class="card">
          <h3>Send Funds Transfer</h3>
          <form id="transfer-form" style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
            <div class="form-group">
              <label>Select My Debiting Account</label>
              <select id="tf-from">
                ${sum.accounts.map(a => `<option value="${a.accountNumber}">${a.type.toUpperCase()} (${a.accountNumber}) - Balance: ₹${a.balance}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Select Beneficiary / Payee</label>
              <select id="tf-to-select" onchange="handleBeneficiarySelect(this)">
                <option value="">-- Or enter account below --</option>
                ${sum.beneficiaries.map(b => `<option value="${b.accountNumber}">${b.name} (${b.bankName} - ${b.accountNumber})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Destination Account Number</label>
              <input type="text" id="tf-to" required placeholder="Type payee account number">
            </div>
            <div class="form-group">
              <label>Amount to Send (₹)</label>
              <input type="number" id="tf-amount" required placeholder="500">
            </div>
            <div class="form-group">
              <label>Reference Narrative</label>
              <input type="text" id="tf-desc" placeholder="Rent payment, groceries">
            </div>
            <div class="form-group">
              <label>6-Digit Transaction PIN</label>
              <input type="password" id="tf-pin" required placeholder="••••••" maxlength="6">
            </div>
            <button type="submit" class="btn btn-primary">Authorize Transfer</button>
          </form>
        </div>
      `;
      document.getElementById('transfer-form').addEventListener('submit', handleCustomerTransfer);
    } else if (tab === 'beneficiaries') {
      container.innerHTML = `
        <div class="dashboard-grid">
          <div class="card">
            <h3>Registered Beneficiaries</h3>
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Account No</th><th>Bank</th><th>Action</th></tr></thead>
                <tbody>
                  ${sum.beneficiaries.length === 0 ? `<tr><td colspan="4" class="text-center">No contacts saved.</td></tr>` : ''}
                  ${sum.beneficiaries.map(b => `
                    <tr>
                      <td><b>${b.name}</b></td>
                      <td><code>${b.accountNumber}</code></td>
                      <td>${b.bankName}</td>
                      <td><button class="btn btn-outline-danger btn-sm" onclick="deleteBeneficiary('${b.id}')">Remove</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <h3>Add Beneficiary Payee</h3>
            <form id="add-ben-form" style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
              <div class="form-group"><label>Payee Name</label><input type="text" id="ab-name" required placeholder="John Miller"></div>
              <div class="form-group"><label>Account Number</label><input type="text" id="ab-acc" required placeholder="1000123456"></div>
              <div class="form-group"><label>Bank Name</label><input type="text" id="ab-bank" value="Bharatiya Sarvodaya Bank"></div>
              <button type="submit" class="btn btn-primary">Save Payee</button>
            </form>
          </div>
        </div>
      `;
      document.getElementById('add-ben-form').addEventListener('submit', handleAddBeneficiary);
    } else if (tab === 'products') {
      container.innerHTML = `
        <div class="dashboard-grid">
          <div class="card">
            <h3>Open Fixed Deposit (FD)</h3>
            <p class="text-secondary" style="margin-bottom:12px;">Invest savings into high-yield certificates. Interest compiles quarterly.</p>
            <form id="fd-form" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group"><label>Principal Placement Amount (₹)</label><input type="number" id="fd-amount" required placeholder="5000"></div>
              <div class="form-group">
                <label>Term Duration</label>
                <select id="fd-term">
                  <option value="12">12 Months (6.8% APR)</option>
                  <option value="24">24 Months (7.5% APR)</option>
                </select>
              </div>
              <div class="form-group">
                <label><input type="checkbox" id="fd-auto" checked> Auto Renewal on Maturity</label>
              </div>
              <button type="submit" class="btn btn-primary">Confirm Placement</button>
            </form>
          </div>

          <div class="card">
            <h3>Apply for Credit / Personal Loan</h3>
            <form id="loan-form" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group"><label>Loan Capital Amount Requested (₹)</label><input type="number" id="ln-amount" required placeholder="15000"></div>
              <div class="form-group">
                <label>Loan Type Interest rate</label>
                <select id="ln-type">
                  <option value="home">Home Loan (6.5% APR)</option>
                  <option value="car">Car Loan (7.8% APR)</option>
                  <option value="personal">Personal Loan (11.5% APR)</option>
                </select>
              </div>
              <div class="form-group"><label>Term Duration (Months)</label><input type="number" id="ln-months" value="36" required></div>
              <button type="submit" class="btn btn-success">Submit Application</button>
            </form>
          </div>
        </div>
      `;
      document.getElementById('fd-form').addEventListener('submit', handleFDPlacement);
      document.getElementById('loan-form').addEventListener('submit', handleLoanSubmit);
    } else if (tab === 'dms') {
      const docs = await apiCall('/api/dms');
      container.innerHTML = `
        <div class="dashboard-grid">
          <div class="card">
            <h3>My Document Vault</h3>
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Document</th><th>Category</th><th>Version</th><th>Status</th></tr></thead>
                <tbody>
                  ${docs.map(d => `
                    <tr>
                      <td><b>${d.title}</b><br><small>${d.fileName}</small></td>
                      <td><span class="status-badge frozen">${d.category}</span></td>
                      <td>Version ${d.version}</td>
                      <td><span class="status-badge ${d.status}">${d.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <h3>Upload identification Document</h3>
            <form id="cust-upload-form" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group"><label>Document Title</label><input type="text" id="doc-title" placeholder="Aadhaar ID Card" required></div>
              <div class="form-group">
                <label>Category</label>
                <select id="doc-category">
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="passport">Passport</option>
                  <option value="salary_slip">Salary Slip</option>
                </select>
              </div>
              <div class="form-group"><label>Simulated Document Filename</label><input type="text" id="doc-filename" placeholder="aadhaar_file.pdf" required></div>
              <button type="submit" class="btn btn-primary">Upload Document</button>
            </form>
          </div>
        </div>
      `;
      document.getElementById('cust-upload-form').addEventListener('submit', handleCustomerDocUpload);
    } else if (tab === 'assistant') {
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3>AI Personal Financial Advisor</h3>
            <span class="status-badge active font-mono" id="ai-credit-label">Risk rating: Analysing...</span>
          </div>
          <div class="chat-container">
            <div class="chat-messages" id="ai-chat-box">
              <div class="chat-bubble assistant">Hello ${state.user?.fullName || state.user?.name || 'Valued Customer'}, I am your Nexus AI banking assistant. I can forecast your credit score, look up interest rates, recommend pre-approved credit upgrades or analyse your spending patterns. Type any question below.</div>
            </div>
            <form id="ai-chat-form" class="chat-input-bar">
              <input type="text" id="ai-input" placeholder="e.g. recommend a credit card or check loan rates..." required autocomplete="off">
              <button type="submit">Ask AI</button>
            </form>
          </div>
        </div>
      `;
      loadCustomerAiInsightsLabel();
      document.getElementById('ai-chat-form').addEventListener('submit', handleAiAssistantChat);
    } else if (tab === 'settings') {
      container.innerHTML = `
        <div class="dashboard-grid">
          <div class="card">
            <h3>Transaction PIN setup</h3>
            <p class="text-secondary" style="margin-bottom:12px;">Transaction PIN is required to authorize transfers or withdrawals.</p>
            <form id="pin-form" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group"><label>New 6-Digit PIN</label><input type="password" id="se-pin" required maxlength="6" placeholder="••••••"></div>
              <button type="submit" class="btn btn-primary">Configure PIN</button>
            </form>
          </div>
          <div class="card">
            <h3>Two Factor Authentication (2FA)</h3>
            <p class="text-secondary" style="margin-bottom:12px;">Secure account login sessions with OTP checks.</p>
            <button class="btn btn-outline-primary" onclick="showToast('2FA configured. Secure keys seeded.', 'success')">Enable 2FA Verification</button>
          </div>
        </div>
      `;
      document.getElementById('pin-form').addEventListener('submit', handlePinConfigure);
    }
  } catch (err) {
    console.error('Customer render error:', err);
    container.innerHTML = `
      <div class="card text-center" style="padding: 40px; margin: 20px auto; max-width: 600px;">
        <h2 style="color: var(--danger); margin-bottom: 12px;">⚠️ Workspace View Error</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${err.message || 'Unable to load customer workspace data.'}</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 15px;">
          <button class="btn btn-outline-primary" onclick="switchTab('${tab}')">🔄 Retry</button>
          <button class="btn btn-primary" onclick="triggerLogout()">🔑 Sign In Again</button>
        </div>
      </div>
    `;
  }
}

function handleBeneficiarySelect(select) {
  if (select.value) {
    document.getElementById('tf-to').value = select.value;
  }
}

async function handleCustomerTransfer(e) {
  e.preventDefault();
  const fromNum = document.getElementById('tf-from').value;
  const toNum = document.getElementById('tf-to').value;
  const amount = parseFloat(document.getElementById('tf-amount').value);
  const desc = document.getElementById('tf-desc').value;
  const pin = document.getElementById('tf-pin').value;

  try {
    const res = await apiCall('/api/dashboard/transactions', 'POST', {
      fromAccountNumber: fromNum,
      toAccountNumber: toNum,
      amount,
      type: 'transfer',
      description: desc,
      pin
    });
    showToast(res.message, 'success');
    switchTab('summary');
  } catch(e){}
}

async function handleAddBeneficiary(e) {
  e.preventDefault();
  const name = document.getElementById('ab-name').value;
  const accountNumber = document.getElementById('ab-acc').value;
  const bankName = document.getElementById('ab-bank').value;

  try {
    await apiCall('/api/dashboard/beneficiaries', 'POST', { name, accountNumber, bankName });
    showToast('Beneficiary saved.', 'success');
    switchTab('beneficiaries');
  } catch(e){}
}

async function deleteBeneficiary(id) {
  if (confirm('Delete saved payee?')) {
    try {
      await apiCall(`/api/dashboard/beneficiaries/${id}`, 'DELETE');
      switchTab('beneficiaries');
    } catch(e){}
  }
}

async function handleFDPlacement(e) {
  e.preventDefault();
  const principalAmount = document.getElementById('fd-amount').value;
  const termMonths = document.getElementById('fd-term').value;
  const autoRenewal = document.getElementById('fd-auto').checked;

  try {
    await apiCall('/api/dashboard/fds/apply', 'POST', { principalAmount, termMonths, autoRenewal });
    showToast('Fixed Deposit placement funded and processed.', 'success');
    switchTab('summary');
  } catch(e){}
}

async function handleLoanSubmit(e) {
  e.preventDefault();
  const amount = document.getElementById('ln-amount').value;
  const loanType = document.getElementById('ln-type').value;
  const termMonths = document.getElementById('ln-months').value;

  try {
    await apiCall('/api/dashboard/loans/apply', 'POST', { amount, loanType, termMonths });
    showToast('Loan request registered. Awaiting Manager Credit check approvals.', 'success');
    switchTab('summary');
  } catch(e){}
}

async function handleCustomerDocUpload(e) {
  e.preventDefault();
  const title = document.getElementById('doc-title').value;
  const category = document.getElementById('doc-category').value;
  const fileName = document.getElementById('doc-filename').value;

  try {
    await apiCall('/api/dms/upload', 'POST', { title, category, fileName });
    showToast('Document uploaded successfully.', 'success');
    switchTab('dms');
  } catch(e){}
}

async function handlePinConfigure(e) {
  e.preventDefault();
  const pin = document.getElementById('se-pin').value;
  try {
    await apiCall('/api/auth/pin', 'POST', { pin });
    showToast('Transaction PIN successfully configured.', 'success');
  } catch(e){}
}

// AI Assistant Chatbot
async function loadCustomerAiInsightsLabel() {
  try {
    const data = await apiCall(`/api/crm/analytics/${state.user.id}`);
    document.getElementById('ai-credit-label').innerText = `Credit score: ${data.creditScore} | Churn probability: ${(data.churnProbability*100).toFixed(0)}%`;
  } catch(e){}
}

async function handleAiAssistantChat(e) {
  e.preventDefault();
  const input = document.getElementById('ai-input');
  const query = input.value;
  if (!query.trim()) return;

  const chatBox = document.getElementById('ai-chat-box');

  // Append user message
  const uBubble = document.createElement('div');
  uBubble.className = 'chat-bubble user';
  uBubble.innerText = query;
  chatBox.appendChild(uBubble);
  chatBox.scrollTop = chatBox.scrollHeight;
  input.value = '';

  // API Analytics recommend response
  try {
    const aiData = await apiCall(`/api/crm/analytics/${state.user.id}`);
    
    setTimeout(() => {
      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble assistant';
      
      let answer = `I analyzed your portfolio profiles. Your Customer Value Score is ${aiData.customerValueScore}/100. Based on this, I recommend looking at: ${aiData.recommendations.join(', ')}`;
      
      const cleanQ = query.toLowerCase();
      if (cleanQ.includes('loan') || cleanQ.includes('rate')) {
        answer = `Our current loan interest rates are: Home Loan (6.5% APR), Car Loan (7.8% APR), and Personal Loan (11.5% APR). Since your credit score is ${aiData.creditScore}, you are highly qualified. Would you like to submit an application?`;
      } else if (cleanQ.includes('fd') || cleanQ.includes('fixed deposit')) {
        answer = `Fixed Deposits (FD) offer premium rates: 12 months at 6.8% and 24 months at 7.5%. Opening an FD automatically Sweep transfers funds from your Savings balance.`;
      } else if (cleanQ.includes('balance') || cleanQ.includes('account')) {
        answer = `You have an active Savings Account. I recommend maintaining a balance above ₹1,000 to keep your Churn risk low (currently ${(aiData.churnProbability*100).toFixed(0)}%).`;
      } else if (cleanQ.includes('credit card') || cleanQ.includes('card')) {
        answer = `I see a pre-approved upgrade for: ${aiData.recommendations.find(r => r.includes('Card')) || 'Platinum Credit Card Upgrade'}. You can apply directly from the Products portal.`;
      }

      botBubble.innerText = answer;
      chatBox.appendChild(botBubble);
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);

  } catch(e){}
}


// ==========================================
// RENDER MERCHANT VIEWS
// ==========================================
async function renderMerchant(tab, container) {
  try {
    const sum = await apiCall('/api/dashboard/summary');
    if (tab === 'summary') {
      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Merchant Business Name</h3>
            <div class="stat-val" style="font-size:1.4rem;">${sum.profile.businessName}</div>
            <div class="stat-desc">Status: ${sum.profile.status} | GST: ${sum.profile.gstNumber}</div>
          </div>
          <div class="stat-card">
            <h3>Settled Balance</h3>
            <div class="stat-val text-success">₹${sum.account ? sum.account.balance.toFixed(2) : '0.00'}</div>
            <div class="stat-desc">Primary Account No: ${sum.account ? sum.account.accountNumber : '-'}</div>
          </div>
          <div class="stat-card">
            <h3>Sales Received</h3>
            <div class="stat-val">${sum.recentPayments.length} Payments</div>
            <div class="stat-desc">Pending payouts to bank accounts</div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <h3>Recent QR Code Sales Payments</h3>
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  ${sum.recentPayments.length === 0 ? `<tr><td colspan="3" class="text-center">No sales payments received.</td></tr>` : ''}
                  ${sum.recentPayments.map(p => `
                    <tr>
                      <td>${new Date(p.createdAt).toLocaleString()}</td>
                      <td><b class="text-success">₹${p.amount}</b></td>
                      <td><span class="status-badge active">${p.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="card text-center">
            <h3>Store Static QR Code</h3>
            <div style="background:white; padding:16px; border-radius:12px; display:inline-block; margin-top:16px;">
              <!-- Simulated QR image generator using mock block -->
              <div style="width:160px; height:160px; background:repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 20px 20px; border:2px solid #000;"></div>
            </div>
            <p class="text-secondary mt-2">Scan to pay: <code>${sum.account ? sum.account.accountNumber : ''}</code></p>
          </div>
        </div>
      `;
    } else if (tab === 'qr') {
      container.innerHTML = `
        <div class="dashboard-grid">
          <div class="card">
            <h3>Generate Dynamic Bill QR</h3>
            <form id="dynamic-qr-form" style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
              <div class="form-group"><label>Order Transaction Amount (₹)</label><input type="number" id="qr-amount" required placeholder="50"></div>
              <div class="form-group"><label>Order Reference / Bill ID</label><input type="text" id="qr-ref" placeholder="Bill #1092"></div>
              <button type="submit" class="btn btn-primary">Generate Dynamic QR</button>
            </form>
          </div>
          <div class="card text-center hidden" id="dynamic-qr-result-card">
            <h3>Dynamic Bill QR Code</h3>
            <div style="background:white; padding:16px; border-radius:12px; display:inline-block; margin-top:16px;">
              <div style="width:160px; height:160px; background:repeating-conic-gradient(#8b5cf6 0% 25%, #fff 0% 50%) 50% / 16px 16px; border:2px solid #8b5cf6;"></div>
            </div>
            <h4 class="mt-1" id="dyn-qr-amount-text">Bill: ₹0.00</h4>
            <p class="text-secondary">Reference: <code id="dyn-qr-ref-text">Bill #00</code></p>
            <button class="btn btn-success btn-sm mt-2" onclick="simulateMerchantPaymentScan()">Simulate Customer Pay Scan</button>
          </div>
        </div>
      `;
      document.getElementById('dynamic-qr-form').addEventListener('submit', handleDynamicQrGenerate);
    } else if (tab === 'settlements') {
      container.innerHTML = `
        <div class="card">
          <h3>EOD Settlement Logs & Payouts</h3>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Settled Payout</th><th>Status</th><th>Transactions Included</th></tr></thead>
              <tbody>
                ${sum.settlements.length === 0 ? `<tr><td colspan="4" class="text-center">No settlements recorded. Automated EOD will process pending sales.</td></tr>` : ''}
                ${sum.settlements.map(s => `
                  <tr>
                    <td>${s.processedAt ? new Date(s.processedAt).toLocaleDateString() : 'Awaiting EOD'}</td>
                    <td><b class="text-info">₹${s.amount}</b></td>
                    <td><span class="status-badge ${s.status === 'completed' ? 'active' : 'pending'}">${s.status}</span></td>
                    <td><code>${s.transactionIds.join(', ')}</code></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (tab === 'developers') {
      container.innerHTML = `
        <div class="dashboard-subtabs">
          <button class="subtab-btn active" onclick="switchSubTab(event, 'api-keys')">Developer Credentials</button>
          <button class="subtab-btn" onclick="switchSubTab(event, 'api-logs')">Access Metrics</button>
        </div>
        <div id="dev-portal-sub">Loading keys...</div>
      `;
      loadApiKeysTab();
    }
  } catch (err) {
    console.error('Merchant render error:', err);
    container.innerHTML = `
      <div class="card text-center" style="padding: 40px; margin: 20px auto; max-width: 600px;">
        <h2 style="color: var(--danger); margin-bottom: 12px;">⚠️ Workspace View Error</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${err.message || 'Unable to load merchant workspace data.'}</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 15px;">
          <button class="btn btn-outline-primary" onclick="switchTab('${tab}')">🔄 Retry</button>
          <button class="btn btn-primary" onclick="triggerLogout()">🔑 Sign In Again</button>
        </div>
      </div>
    `;
  }
}

function handleDynamicQrGenerate(e) {
  e.preventDefault();
  const amt = parseFloat(document.getElementById('qr-amount').value);
  const ref = document.getElementById('qr-ref').value;

  document.getElementById('dyn-qr-amount-text').innerText = `Bill: $${amt.toFixed(2)}`;
  document.getElementById('dyn-qr-ref-text').innerText = ref || 'Bill #Auto';
  
  // Cache variables for scan simulation
  window.simPayAmt = amt;
  window.simPayRef = ref || 'QR Sale payment';

  document.getElementById('dynamic-qr-result-card').classList.remove('hidden');
}

async function simulateMerchantPaymentScan() {
  const customerAccNo = '1000987654'; // Customer Alice
  const merchantAccNo = '2000123456';
  
  try {
    await apiCall('/api/dashboard/transactions', 'POST', {
      fromAccountNumber: customerAccNo,
      toAccountNumber: merchantAccNo,
      amount: window.simPayAmt,
      type: 'transfer',
      category: 'Merchant Payment',
      description: `QR: ${window.simPayRef}`
    });
    
    showToast('Simulation: Customer scanned QR and payment processed successfully!', 'success');
    switchTab('summary');
  } catch(e){}
}


// ==========================================
// NOTIFICATIONS WIDGET MANAGEMENT
// ==========================================
async function loadNotificationsCount() {
  if (state.user.role !== 'Customer') return;
  try {
    const list = await fetch(getApiUrl('/api/dashboard/notifications'), { headers: { 'Authorization': `Bearer ${state.token}` } }).then(r=>r.json());
    const bellCount = document.getElementById('bell-unread-count');
    
    if (list.length > 0) {
      bellCount.innerText = list.length;
      bellCount.classList.remove('hidden');
    } else {
      bellCount.classList.add('hidden');
    }
  } catch(e){}
}

function toggleNotificationsPane() {
  const dropdown = document.getElementById('notifications-dropdown-pane');
  dropdown.classList.toggle('hidden');

  if (!dropdown.classList.contains('hidden')) {
    loadNotificationsList();
  }
}

async function loadNotificationsList() {
  const container = document.getElementById('notifications-list-container');
  try {
    const list = await fetch(getApiUrl('/api/dashboard/notifications'), { headers: { 'Authorization': `Bearer ${state.token}` } }).then(r=>r.json());
    if (list.length === 0) {
      container.innerHTML = `<p class="empty-notif">No new security or account alerts.</p>`;
      return;
    }

    container.innerHTML = list.map(n => `
      <div class="notif-item ${!n.read ? 'unread' : ''}">
        <h4>${n.title}</h4>
        <p>${n.message}</p>
        <span style="font-size:0.7rem; color:var(--text-muted);">${new Date(n.createdAt).toLocaleDateString()}</span>
      </div>
    `).join('');
  } catch(e){}
}

async function markAllNotificationsRead(e) {
  e.stopPropagation();
  try {
    await apiCall('/api/dashboard/notifications/read', 'PUT');
    document.getElementById('bell-unread-count').classList.add('hidden');
    loadNotificationsList();
    showToast('Notifications marked as read.', 'success');
  } catch(e){}
}

async function renderBranchCustomersView(container) {
  try {
    const normRole = normalizeRole(state.user?.role);
    const isSuperAdmin = normRole === 'Super Admin';
    let data;
    let branches = [];
    let activeBranchId = state.selectedBranchId || state.user?.branchId || 'b-main';

    if (isSuperAdmin) {
      branches = await apiCall('/api/branches').catch(() => []);
      if (state.selectedBranchId) {
        activeBranchId = state.selectedBranchId;
      } else if (branches.length > 0) {
        activeBranchId = branches[0].id;
      }
      data = await apiCall(`/api/branches/${activeBranchId}/customers`);
    } else {
      // Dedicated branch endpoint scoped to logged in Branch Manager
      data = await apiCall('/api/branch-customers');
      if (data && data.branch) activeBranchId = data.branch.id;
    }
    
    const branch = data.branch || {};
    const customers = data.customers || [];

    const allAccounts = customers.flatMap(c => c.accounts || []);
    const filterType = state.selectedAccountTypeFilter || 'ALL';
    let filteredAccountCount = allAccounts.length;
    if (filterType !== 'ALL') {
      filteredAccountCount = allAccounts.filter(a => (a.type || '').toLowerCase() === filterType.toLowerCase()).length;
    }

    container.innerHTML = `
      <div class="card" style="width: 100%; padding: 24px; display: flex; flex-direction: column; gap: 18px;">
        <!-- Integrated Header Bar: Title + Branch Selector / Create Button -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 14px;">
          <div>
            <h2 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1.3rem; font-weight: 800;">
              🏢 Branch Customer Database
            </h2>
            <p style="margin: 3px 0 0 0; color: var(--text-secondary); font-size: 0.84rem;">
              Scoped Customer Registry & Accounts for <strong>${branch.name || 'HQ Branch'} (${branch.code || ''})</strong>
            </p>
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="openBranchCustomerModal()" style="padding: 8px 16px; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.25); border: none; cursor: pointer;">
              ➕ Create Account / Onboard Customer
            </button>

            ${isSuperAdmin && branches.length > 0 ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-weight: 700; font-size: 0.85rem; margin: 0; color: var(--text-secondary);">Branch:</label>
                <select id="branch-select-dropdown" onchange="switchBranchCustomerView(this.value)" style="padding: 7px 12px; border-radius: 8px; border: 1px solid var(--border-color); font-weight: 700; font-size: 0.85rem; background: var(--bg-main); color: var(--text-primary); cursor: pointer;">
                  ${branches.map(b => `<option value="${b.id}" ${b.id === activeBranchId ? 'selected' : ''}>${b.name} (${b.code})</option>`).join('')}
                </select>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Integrated Metrics Row (4 compact cards) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <!-- Card 1: Branch Location -->
          <div style="background: rgba(37, 99, 235, 0.04); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(37, 99, 235, 0.12);">
            <span style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Branch Location</span>
            <div style="font-size: 0.88rem; font-weight: 800; color: var(--accent-primary); margin-top: 2px;">${branch.name || 'Branch HQ'}</div>
            <span style="font-size: 0.68rem; color: var(--text-secondary);">IFSC: ${branch.ifscCode || 'BSB0000MUM1'} | MICR: ${branch.micrCode || '400240001'}</span>
          </div>

          <!-- Card 2: Total Branch Customers -->
          <div style="background: rgba(99, 102, 241, 0.04); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.12);">
            <span style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total Branch Customers</span>
            <div style="font-size: 0.98rem; font-weight: 800; margin-top: 2px; color: var(--text-primary);">${customers.length} Registered</div>
          </div>

          <!-- Card 3: Total Branch Accounts (with Filter) -->
          <div style="background: rgba(14, 165, 233, 0.04); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(14, 165, 233, 0.12); display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
              <span style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total Branch Accounts</span>
              <select onchange="filterBranchAccounts(this.value)" style="padding: 2px 6px; font-size: 0.68rem; border-radius: 6px; border: 1px solid var(--border-color); font-weight: 700; background: var(--bg-main); color: var(--text-primary); cursor: pointer;">
                <option value="ALL" ${(!state.selectedAccountTypeFilter || state.selectedAccountTypeFilter === 'ALL') ? 'selected' : ''}>All Types</option>
                <option value="savings" ${state.selectedAccountTypeFilter === 'savings' ? 'selected' : ''}>Savings</option>
                <option value="current" ${state.selectedAccountTypeFilter === 'current' ? 'selected' : ''}>Current</option>
                <option value="fixed_deposit" ${state.selectedAccountTypeFilter === 'fixed_deposit' ? 'selected' : ''}>Fixed Deposit</option>
                <option value="loan" ${state.selectedAccountTypeFilter === 'loan' ? 'selected' : ''}>Loan</option>
              </select>
            </div>
            <div style="font-size: 0.98rem; font-weight: 800; color: #0284c7; margin-top: 2px;">
              ${filteredAccountCount} Accounts
            </div>
          </div>

          <!-- Card 4: Branch Customer Deposits -->
          <div style="background: rgba(16, 185, 129, 0.04); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.12);">
            <span style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Branch Customer Deposits</span>
            <div style="font-size: 0.98rem; font-weight: 800; color: #059669; margin-top: 2px;">₹${(data.totalDeposits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <!-- Customer Table Container -->
        <div style="margin-top: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              👥 Customers Managed by Branch
            </h3>
            <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 600;">Showing ${customers.length} records</span>
          </div>

          <div class="table-wrapper" style="max-height: 520px; overflow-x: auto; overflow-y: auto; border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px;">
            <table style="width: 100%; border-collapse: collapse; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Customer Name</th>
                  <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Email & Customer ID</th>
                  <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Mobile / Phone</th>
                  <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; white-space: nowrap;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${customers.length === 0 ? `
                  <tr><td colSpan="4" style="text-align: center; padding: 25px; color: #64748b; font-size: 0.85rem;">No customer records found in this branch database.</td></tr>
                ` : customers.map(c => `
                  <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 10px 12px;">
                      <span style="font-size: 0.85rem; font-weight: 700; color: #0f172a; cursor: pointer;" onclick="viewCustomerProfile('${c.id}')">${c.fullName}</span>
                    </td>
                    <td style="padding: 10px 12px;">
                      <div style="display: flex; flex-direction: column; gap: 2px;">
                        <span style="font-size: 0.8rem; color: #334155; font-weight: 500;">${c.email}</span>
                        <span style="font-size: 0.72rem; color: #0284c7; font-family: ui-monospace, monospace; font-weight: 600;">ID: ${c.userId || c.id}</span>
                      </div>
                    </td>
                    <td style="padding: 10px 12px;">
                      <span style="font-size: 0.8rem; color: #475569; font-weight: 500;">${c.mobileNumber || 'N/A'}</span>
                    </td>
                    <td style="padding: 10px 12px; white-space: nowrap;">
                      <div style="display: flex; gap: 6px; align-items: center;">
                        <button style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; cursor: pointer;" onclick="viewCustomerProfile('${c.id}')">👁️ Profile</button>
                        <button style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; cursor: pointer;" onclick="viewCustomerAccounts('${c.id}')">💳 Accounts</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="padding: 20px; color: var(--danger-color);">Failed to load branch customer database: ${err.message}</div>`;
  }
}

function switchBranchCustomerView(branchId) {
  state.selectedBranchId = branchId;
  const target = document.getElementById('workspace-target');
  renderBranchCustomersView(target);
}

// ================= GLOBAL BRANCH CUSTOMER MODAL HANDLERS =================

window.openBranchCustomerModal = function() {
  const modalHtml = `
    <div id="branch-customer-modal-container" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="background: var(--bg-card, #ffffff); width: 92%; max-width: 720px; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); color: var(--text-primary); max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b;">➕ Create Account / Onboard Branch Customer</h2>
          <button onclick="closeBranchCustomerModal()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #64748b;">✕</button>
        </div>
        <form id="onboard-branch-customer-form" onsubmit="submitBranchCustomerForm(event)">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Full Name *</label>
              <input type="text" id="ob-fullname" required placeholder="e.g. Ramesh Kumar" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Email Address *</label>
              <input type="email" id="ob-email" required placeholder="ramesh@gmail.com" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Mobile Number *</label>
              <input type="text" id="ob-mobile" required placeholder="+91 9810012345" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Customer's PAN Number *</label>
              <input type="text" id="ob-pan" required placeholder="ABCDE1234F" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem; text-transform: uppercase;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Aadhaar Card Number *</label>
              <input type="text" id="ob-aadhaar" required placeholder="3829 4820 1938" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Nominee Name *</label>
              <input type="text" id="ob-nominee" required placeholder="Nominee Full Name (e.g. Sunita Kumar)" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Date of Birth (DOB) *</label>
              <input type="date" id="ob-dob" required value="1992-05-15" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">S/D/H/W/o *</label>
              <input type="text" id="ob-sdhwo" required placeholder="S/o Suresh Kumar" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Mode of Operation (MOP) *</label>
              <select id="ob-mop" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem; background: #fff;">
                <option value="Self">Self</option>
                <option value="Either or Survivor">Either or Survivor</option>
                <option value="Former or Survivor">Former or Survivor</option>
                <option value="Jointly Operated">Jointly Operated</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Account Type *</label>
              <select id="ob-acctype" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem; background: #fff;">
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Initial Deposit Amount (₹) *</label>
              <input type="number" id="ob-deposit" required value="2000" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>
            <div style="grid-column: span 2;">
              <label style="font-size: 0.8rem; font-weight: 700; display: block; margin-bottom: 4px;">Residential Address</label>
              <input type="text" id="ob-address" placeholder="Full residential street address" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" onclick="closeBranchCustomerModal()" class="btn btn-secondary" style="padding: 8px 16px;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="padding: 8px 20px; font-weight: 700;">Open Account & Onboard</button>
          </div>
        </form>
      </div>
    </div>
  `;

  let existingModal = document.getElementById('branch-customer-modal-container');
  if (existingModal) existingModal.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.closeBranchCustomerModal = function() {
  let modal = document.getElementById('branch-customer-modal-container');
  if (modal) modal.remove();
};

window.submitBranchCustomerForm = async function(e) {
  e.preventDefault();
  try {
    const fullName = document.getElementById('ob-fullname').value;
    const email = document.getElementById('ob-email').value;
    const mobileNumber = document.getElementById('ob-mobile').value;
    const panNumber = document.getElementById('ob-pan').value;
    const aadhaarNumber = document.getElementById('ob-aadhaar')?.value || '3829 4820 1938';
    const nomineeName = document.getElementById('ob-nominee')?.value || 'N/A';
    const dob = document.getElementById('ob-dob').value;
    const sdhwo = document.getElementById('ob-sdhwo').value;
    const mopType = document.getElementById('ob-mop').value;
    const accountType = document.getElementById('ob-acctype').value;
    const initialDeposit = document.getElementById('ob-deposit').value;
    const address = document.getElementById('ob-address').value;

    await apiCall('/api/customers/register', 'POST', {
      fullName,
      email,
      mobileNumber,
      panNumber,
      aadhaarNumber,
      nomineeName,
      dob,
      sdhwo,
      mopType,
      accountType,
      initialDeposit,
      address,
      branchId: state.user?.branchId || 'b-delhi'
    });

    showToast('Customer onboarded & account opened successfully.', 'success');
    closeBranchCustomerModal();
    renderBranchCustomersView(document.getElementById('workspace-target'));
  } catch (err) {
    showToast(err.message || 'Failed to onboard customer', 'danger');
  }
};

window.filterBranchAccounts = function(type) {
  state.selectedAccountTypeFilter = type;
  renderBranchCustomersView(document.getElementById('workspace-target'));
};

window.toggleInlineProfileEdit = function() {
  const box = document.getElementById('inline-profile-edit-box');
  if (box) box.classList.toggle('hidden');
};

window.submitInlineProfileEdit = async function(e, customerId) {
  e.preventDefault();
  try {
    const email = document.getElementById('edit-profile-email').value;
    const mobileNumber = document.getElementById('edit-profile-phone').value;
    const address = document.getElementById('edit-profile-address').value;

    await apiCall(`/api/customers/${customerId}`, 'PUT', { email, mobileNumber, address });
    showToast('Customer profile (Email, Phone No, Address) updated successfully.', 'success');
    closeBranchCustomerModal();
    renderBranchCustomersView(document.getElementById('workspace-target'));
  } catch (err) {
    showToast(err.message || 'Failed to update customer profile', 'danger');
  }
};

window.closeBranchCustomerModal = function() {
  const modal = document.getElementById('branch-customer-modal-container');
  if (modal) modal.remove();
};

window.viewCustomerProfile = async function(customerId) {
  try {
    const activeBranchId = state.selectedBranchId || state.user?.branchId || 'b-main';
    const normRole = normalizeRole(state.user?.role);
    const isSuperAdmin = normRole === 'Super Admin';
    const data = isSuperAdmin ? await apiCall(`/api/branches/${activeBranchId}/customers`) : await apiCall('/api/branch-customers');
    const customers = data.customers || [];
    const cust = customers.find(c => c.id === customerId || c.userId === customerId);
    if (!cust) return showToast('Customer record not found.', 'danger');

    const modalHtml = `
      <div id="branch-customer-modal-container" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;" onclick="if(event.target===this) closeBranchCustomerModal()">
        <div style="background: var(--bg-card, #ffffff); width: 90%; max-width: 650px; border-radius: 12px; padding: 24px; color: var(--text-primary); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 10px;">
            <h2 style="margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">👤 Customer Profile - ${cust.fullName}</h2>
            <div style="display: flex; align-items: center; gap: 10px;">
              <button type="button" onclick="toggleInlineProfileEdit()" style="padding: 5px 12px; font-weight: 700; font-size: 0.78rem; border-radius: 6px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                ✏️ Edit Profile
              </button>
              <button type="button" onclick="closeBranchCustomerModal()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #64748b; font-weight: bold;">✕</button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.82rem; background: rgba(0,0,0,0.03); padding: 14px; border-radius: 8px; margin-bottom: 15px;">
            <div><strong>Full Name:</strong> ${cust.fullName}</div>
            <div><strong>Customer ID:</strong> <span style="color:#0284c7; font-family:monospace; font-weight:bold;">${cust.userId || cust.id}</span></div>
            <div><strong>Email Address:</strong> ${cust.email}</div>
            <div><strong>Mobile Phone:</strong> ${cust.mobileNumber || 'N/A'}</div>
            <div><strong>Aadhaar Number:</strong> <span style="font-family:monospace; font-weight:bold; color:#0369a1;">${cust.aadhaarNumber || '3829 4820 1938'}</span></div>
            <div><strong>Nominee Name:</strong> <span style="font-weight:bold; color:#4338ca;">${cust.nomineeName || 'N/A'}</span></div>
            <div><strong>Address:</strong> ${cust.address || 'Mumbai, Maharashtra, India'}</div>
            <div><strong>KYC Status:</strong> <span style="color:${cust.kycStatus === 'verified' ? '#0284c7' : '#d97706'}; font-weight:bold;">${cust.kycStatus === 'verified' ? 'Verified ✓' : 'KYC Pending'}</span></div>
            <div><strong>PAN Number:</strong> <span style="font-family:monospace; font-weight:bold;">${cust.panNumber || 'ABCDE1234F'}</span></div>
            <div><strong>DOB:</strong> ${cust.dob || '1995-01-01'}</div>
            <div><strong>S/D/H/W/o:</strong> ${cust.sdhwo || 'N/A'}</div>
            <div><strong>Status:</strong> <span style="color:${cust.status === 'active' ? '#16a34a' : '#dc2626'}; font-weight:bold;">${(cust.status || 'active').toUpperCase()}</span></div>
          </div>

          <!-- Inline Profile Edit Box (Hidden by default) -->
          <div id="inline-profile-edit-box" class="hidden" style="margin-bottom: 15px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #cbd5e1;">
            <h4 style="margin: 0 0 10px 0; font-size: 0.88rem; font-weight: 700; color: #0f172a;">✏️ Edit Customer Profile (Email, Phone No & Address)</h4>
            <form id="inline-edit-form" onsubmit="submitInlineProfileEdit(event, '${cust.id}')">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div>
                  <label style="font-size: 0.75rem; font-weight: 600; display: block; margin-bottom: 4px;">Email Address</label>
                  <input type="email" id="edit-profile-email" value="${cust.email}" required style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                </div>
                <div>
                  <label style="font-size: 0.75rem; font-weight: 600; display: block; margin-bottom: 4px;">Phone No / Mobile</label>
                  <input type="text" id="edit-profile-phone" value="${cust.mobileNumber || ''}" required style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                </div>
              </div>
              <div style="margin-bottom: 12px;">
                <label style="font-size: 0.75rem; font-weight: 600; display: block; margin-bottom: 4px;">Address</label>
                <input type="text" id="edit-profile-address" value="${cust.address || ''}" required style="width: 100%; padding: 6px 10px; font-size: 0.8rem; border-radius: 6px; border: 1px solid #cbd5e1;">
              </div>
              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" onclick="toggleInlineProfileEdit()" style="padding: 5px 12px; font-size: 0.78rem; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">Cancel</button>
                <button type="submit" style="padding: 5px 16px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; border: none; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #fff; cursor: pointer;">💾 Save Changes</button>
              </div>
            </form>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
            <button type="button" onclick="closeBranchCustomerModal()" class="btn btn-secondary" style="padding: 8px 18px; font-weight: 600; cursor: pointer;">Close</button>
          </div>
        </div>
      </div>
    `;
    let existingModal = document.getElementById('branch-customer-modal-container');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (err) {
    showToast(err.message || 'Failed to fetch customer profile', 'danger');
  }
};

window.viewCustomerAccounts = async function(customerId) {
  try {
    const activeBranchId = state.selectedBranchId || state.user?.branchId || 'b-main';
    const normRole = normalizeRole(state.user?.role);
    const isSuperAdmin = normRole === 'Super Admin';
    const data = isSuperAdmin ? await apiCall(`/api/branches/${activeBranchId}/customers`) : await apiCall('/api/branch-customers');
    const customers = data.customers || [];
    const cust = customers.find(c => c.id === customerId || c.userId === customerId);
    if (!cust) return showToast('Customer record not found.', 'danger');

    const modalHtml = `
      <div id="branch-customer-modal-container" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;" onclick="if(event.target===this) closeBranchCustomerModal()">
        <div style="background: var(--bg-card, #ffffff); width: 90%; max-width: 680px; border-radius: 12px; padding: 24px; color: var(--text-primary); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 10px;">
            <h2 style="margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">💳 Branch Accounts - ${cust.fullName}</h2>
            <button type="button" onclick="closeBranchCustomerModal()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #64748b; font-weight: bold;">✕</button>
          </div>

          <div style="margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left;">
                  <th style="padding: 10px 12px; font-weight: 700; color: #475569;">ACCOUNT TYPE</th>
                  <th style="padding: 10px 12px; font-weight: 700; color: #475569;">ACCOUNT NUMBER</th>
                  <th style="padding: 10px 12px; font-weight: 700; color: #475569;">MOP</th>
                  <th style="padding: 10px 12px; font-weight: 700; color: #475569;">BALANCE</th>
                  <th style="padding: 10px 12px; font-weight: 700; color: #475569; white-space: nowrap;">ACCOUNT ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                ${(cust.accounts && cust.accounts.length > 0) ? cust.accounts.map(a => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 12px;"><span style="font-weight: 700; color: #0284c7; text-transform: uppercase;">${a.type}</span></td>
                    <td style="padding: 10px 12px;"><b style="font-family: monospace;">${a.accountNumber}</b></td>
                    <td style="padding: 10px 12px;"><span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 10px; font-weight: 600; font-size: 0.74rem;">${a.mopType || 'Self'}</span></td>
                    <td style="padding: 10px 12px; color: #059669; font-weight: 800;">₹${parseFloat(a.balance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td style="padding: 10px 12px; white-space: nowrap;">
                      <div style="display: flex; gap: 6px; align-items: center;">
                        ${cust.status === 'frozen' ? `
                          <button type="button" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; cursor: pointer;" onclick="toggleCustomerFreezeAction('${cust.id}', 'frozen')">🔓 Unfreeze</button>
                        ` : `
                          <button type="button" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; cursor: pointer;" onclick="toggleCustomerFreezeAction('${cust.id}', 'active')">🔒 Freeze</button>
                        `}
                        <button type="button" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; cursor: pointer;" onclick="deleteCustomerAction('${cust.id}', 'Account ${a.accountNumber} (${cust.fullName})')">🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('') : `
                  <tr><td colSpan="5" style="text-align: center; padding: 18px; color: #64748b;">No branch accounts linked to this customer.</td></tr>
                `}
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.8rem; font-weight: 600; color: #475569;">
              Account Status: <span style="color: ${cust.status === 'active' ? '#15803d' : '#b91c1c'}; font-weight: 700;">● ${(cust.status || 'active').toUpperCase()}</span>
            </div>
            <button type="button" onclick="closeBranchCustomerModal()" class="btn btn-secondary" style="padding: 6px 18px; font-weight: 600; cursor: pointer;">Close</button>
          </div>
        </div>
      </div>
    `;
    let existingModal = document.getElementById('branch-customer-modal-container');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (err) {
    showToast(err.message || 'Failed to fetch customer accounts', 'danger');
  }
};

window.editCustomerModal = async function(customerId) {
  try {
    const activeBranchId = state.selectedBranchId || state.user?.branchId || 'b-main';
    const normRole = normalizeRole(state.user?.role);
    const isSuperAdmin = normRole === 'Super Admin';
    const data = isSuperAdmin ? await apiCall(`/api/branches/${activeBranchId}/customers`) : await apiCall('/api/branch-customers');
    const cust = (data.customers || []).find(c => c.id === customerId || c.userId === customerId);
    if (!cust) return showToast('Customer record not found.', 'danger');

    const modalHtml = `
      <div id="branch-customer-modal-container" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="background: var(--bg-card, #ffffff); width: 90%; max-width: 500px; border-radius: 12px; padding: 24px; color: var(--text-primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 1.2rem;">✏️ Edit Customer - ${cust.fullName}</h2>
            <button onclick="closeBranchCustomerModal()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer;">✕</button>
          </div>
          <form onsubmit="submitEditCustomerForm(event, '${cust.id}')">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div>
                <label style="font-size: 0.8rem; font-weight: 600;">Full Name</label>
                <input type="text" id="edit-fullname" value="${cust.fullName}" required style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);" />
              </div>
              <div>
                <label style="font-size: 0.8rem; font-weight: 600;">Email Address</label>
                <input type="email" id="edit-email" value="${cust.email}" required style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);" />
              </div>
              <div>
                <label style="font-size: 0.8rem; font-weight: 600;">Mobile Number</label>
                <input type="text" id="edit-mobile" value="${cust.mobileNumber || ''}" required style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);" />
              </div>
              <div>
                <label style="font-size: 0.8rem; font-weight: 600;">Address</label>
                <input type="text" id="edit-address" value="${cust.address || ''}" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);" />
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button type="button" onclick="closeBranchCustomerModal()" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;
    let existingModal = document.getElementById('branch-customer-modal-container');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (err) {
    showToast(err.message || 'Failed to edit customer', 'danger');
  }
};

window.submitEditCustomerForm = async function(e, customerId) {
  e.preventDefault();
  try {
    const fullName = document.getElementById('edit-fullname').value;
    const email = document.getElementById('edit-email').value;
    const mobileNumber = document.getElementById('edit-mobile').value;
    const address = document.getElementById('edit-address').value;

    await apiCall('/api/customers/' + customerId, 'PUT', { fullName, email, mobileNumber, address });
    showToast('Customer details updated successfully.', 'success');
    closeBranchCustomerModal();
    renderBranchCustomersView(document.getElementById('workspace-target'));
  } catch (err) {
    showToast(err.message || 'Failed to update customer', 'danger');
  }
};

window.addCustomerAccountModal = function(customerId) {
  const modalHtml = `
    <div id="branch-customer-modal-container" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="background: var(--bg-card, #ffffff); width: 90%; max-width: 450px; border-radius: 12px; padding: 24px; color: var(--text-primary);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 1.2rem;">➕ Open Additional Account</h2>
          <button onclick="closeBranchCustomerModal()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer;">✕</button>
        </div>
        <form onsubmit="submitAddAccountForm(event, '${customerId}')">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600;">Account Type</label>
              <select id="addacc-type" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600;">Initial Deposit Amount (₹)</label>
              <input type="number" id="addacc-deposit" value="1000" required style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);" />
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" onclick="closeBranchCustomerModal()" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Open Account</button>
          </div>
        </form>
      </div>
    </div>
  `;
  let existingModal = document.getElementById('branch-customer-modal-container');
  if (existingModal) existingModal.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.submitAddAccountForm = async function(e, customerId) {
  e.preventDefault();
  try {
    const accountType = document.getElementById('addacc-type').value;
    const initialDeposit = document.getElementById('addacc-deposit').value;
    await apiCall('/api/customers/add-account', 'POST', { customerId, accountType, initialDeposit });
    showToast('Additional account opened successfully.', 'success');
    closeBranchCustomerModal();
    renderBranchCustomersView(document.getElementById('workspace-target'));
  } catch (err) {
    showToast(err.message || 'Failed to open account', 'danger');
  }
};

window.toggleCustomerFreezeAction = async function(customerId, currentStatus) {
  const action = currentStatus === 'frozen' ? 'unfreeze' : 'freeze';
  try {
    await apiCall('/api/customers/freeze', 'POST', { customerId, action });
    showToast(`Customer account ${action === 'freeze' ? 'frozen' : 'unfrozen'} successfully.`, 'success');
    renderBranchCustomersView(document.getElementById('workspace-target'));
  } catch (err) {
    showToast(err.message || 'Action failed', 'danger');
  }
};

window.deleteCustomerAction = async function(customerId, customerName) {
  if (!confirm(`Are you sure you want to delete customer '${customerName}' from this branch?`)) return;
  try {
    await apiCall('/api/customers/' + customerId, 'DELETE');
    showToast(`Customer '${customerName}' deleted successfully.`, 'info');
    renderBranchCustomersView(document.getElementById('workspace-target'));
  } catch (err) {
    showToast(err.message || 'Failed to delete customer', 'danger');
  }
};
