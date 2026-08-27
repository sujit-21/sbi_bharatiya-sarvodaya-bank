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
  switchBankSegment('personal');

  // Safety guarantee: ensure appropriate UI container is visible
  setTimeout(() => {
    const homeC = document.getElementById('home-container');
    const authC = document.getElementById('auth-container');
    const dashC = document.getElementById('dashboard-container');
    if (homeC && authC && dashC && homeC.classList.contains('hidden') && authC.classList.contains('hidden') && dashC.classList.contains('hidden')) {
      if (state.token && state.user) {
        showDashboard();
      } else {
        showHomePage();
      }
    }
  }, 100);
});

function checkRememberedUser() {
  try {
    const isRemembered = localStorage.getItem('cust_remember_me') === 'true';
    const rememberedEmail = localStorage.getItem('cust_remember_email');
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
  if (!toast) return;
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
  if (fields) fields.classList.toggle('hidden');
}

// Global Navigation Helpers for Homepage & NetBanking Flow
window.showHomePage = function() {
  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) loadingEl.classList.add('hidden');

  const homeC = document.getElementById('home-container');
  const authC = document.getElementById('auth-container');
  const dashC = document.getElementById('dashboard-container');
  if (homeC) homeC.classList.remove('hidden');
  if (authC) authC.classList.add('hidden');
  if (dashC) dashC.classList.add('hidden');

  const menu = document.getElementById('bank-login-menu');
  if (menu) menu.classList.remove('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.showAuth = function() {
  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) loadingEl.classList.add('hidden');

  const homeC = document.getElementById('home-container');
  const authC = document.getElementById('auth-container');
  const dashC = document.getElementById('dashboard-container');
  if (homeC) homeC.classList.add('hidden');
  if (authC) authC.classList.remove('hidden');
  if (dashC) dashC.classList.add('hidden');

  const menu = document.getElementById('bank-login-menu');
  if (menu) menu.classList.remove('show');

  showLoginForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (window.gsap) {
    try {
      gsap.fromTo('.auth-card',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' }
      );
    } catch(e){}
  }
};

// Bank Segments & Sub-Navigation Configurations
const BANK_SEGMENTS = {
  personal: {
    key: 'personal',
    name: 'Personal',
    navItems: [
      { label: 'Accounts ▾', desc: 'Savings Deluxe, Salary Advantage & Digital Accounts' },
      { label: 'Deposits ▾', desc: 'High-Yield Fixed & Recurring Deposits @ 7.85% p.a.' },
      { label: 'Cards ▾', desc: 'Platinum Cashback, Rewards & Contactless Debit Cards' },
      { label: 'Forex ▾', desc: 'Multi-Currency Forex Cards & Outward Remittance' },
      { label: 'Loans ▾', desc: 'Pre-Approved Home, Car & Personal Loans @ 8.40%' },
      { label: 'Investments ▾', desc: 'Mutual Funds, Sovereign Gold Bonds & NPS' },
      { label: 'Insurance ▾', desc: 'Term Life & Comprehensive Health Insurance' },
      { label: 'Payments ▾', desc: 'Instant BBPS Utility Payments, UPI & Fastag' }
    ],
    heroBadge: '🛡️ RBI REGULATED • ZERO BALANCE SAVINGS ACCOUNT',
    heroHeading: 'Experience Next-Gen Digital Banking with Bharatiya Sarvodaya Bank',
    heroSubText: 'Open a high-yield Digital Savings Account with up to <strong>7.25% p.a. interest</strong>, instant virtual debit card, zero maintenance charges, and free 24x7 IMPS/UPI transfers.',
    heroFeatures: ['7.25% Interest Rate', 'Zero Maintenance Fee', '5% Unlimited Cashback', '₹5 Lakh DICGC Insurance'],
    rateHeader: 'SPECIAL MONSOON BANKING RATES 2026',
    rates: [
      { name: 'Fixed Deposits (Senior Citizens)', sub: 'Tenure: 400 Days Special Scheme', val: '7.85%' },
      { name: 'Savings Deluxe Account', sub: 'Daily balance compounding', val: '7.25%' },
      { name: 'Pre-Approved Home Loans', sub: 'Zero processing fee for women', val: '8.40%' }
    ]
  },
  business: {
    key: 'business',
    name: 'Business',
    navItems: [
      { label: 'Current Account ▾', desc: 'Smart Business Current Accounts with Zero MAB and Dynamic Limits' },
      { label: 'Pay ▾', desc: 'Bulk Vendor Payouts, Salary CMS & Corporate Tax Payments' },
      { label: 'Collect ▾', desc: 'Dynamic UPI QR, Smart POS Terminals & Virtual Account Collections' },
      { label: 'Trade Services ▾', desc: 'Import/Export Letters of Credit (LC) & Bank Guarantees (BG)' },
      { label: 'Debt & Working Capital ▾', desc: 'Cash Credit, Overdraft & MSME Working Capital Lines' },
      { label: 'Treasury ▾', desc: 'Corporate Forex Hedging & Bulk Term Deposits' },
      { label: 'Transact Digitally ▾', desc: 'API Banking Integration & Merchant Payment Gateways' }
    ],
    heroBadge: '💼 EMPOWERING INDIAN MSMES & BUSINESSES',
    heroHeading: 'Scale Your Business with BSB Digital Enterprise Banking',
    heroSubText: 'Empowering over 5 Lakh businesses with zero-maintenance current accounts, automated bulk vendor payouts, instant merchant POS collections, and collateral-free credit lines.',
    heroFeatures: ['Instant Digital Current A/C', 'Zero MAB Options', 'Automated Vendor Payouts', 'Collateral-Free MSME Credit'],
    rateHeader: 'BUSINESS & MSME RATES 2026',
    rates: [
      { name: 'MSME Growth Credit Line', sub: 'Collateral free up to ₹1 Crore', val: '8.95%' },
      { name: 'Business Current Account', sub: 'Free 250 monthly NEFT/RTGS', val: '0 MAB' },
      { name: 'Export Trade Finance (LC)', sub: 'Fast track 24h issuance', val: '7.60%' }
    ]
  },
  nri: {
    key: 'nri',
    name: 'NRI',
    navItems: [
      { label: 'Accounts ▾', desc: 'NRE & NRO Savings/Current Accounts with 100% Tax-Free Interest in India' },
      { label: 'Deposits ▾', desc: 'FCNR (USD/GBP/EUR) & NRE High-Yield Fixed Deposits @ 8.10%' },
      { label: 'Cards ▾', desc: 'Global Platinum Forex & International Travel Contactless Cards' },
      { label: 'Loans ▾', desc: 'NRI Home Loans in India @ 8.50% & Loans Against FCNR Deposits' },
      { label: 'Insurance ▾', desc: 'Global Health & NRI Term Life with Foreign Currency Claim Settlement' },
      { label: 'Investments ▾', desc: 'Portfolio Investment Scheme (PINS) for Indian Equities & Mutual Funds' },
      { label: 'Send Money to India ▾', desc: 'Instant Inward Remittance with Zero FX Conversion Markup' },
      { label: 'NRI Exclusive ▾', desc: 'Dedicated 24x7 NRI Wealth Desk & Cross-Border Advisory' },
      { label: 'NRI Services ▾', desc: 'Power of Attorney (POA) Endorsement, KYC & Tax Filing Assistance' }
    ],
    heroBadge: '🌏 GLOBAL REACH • DEDICATED NRI WEALTH DESK',
    heroHeading: 'Stay Connected to Home with BSB NRI Global Banking',
    heroSubText: 'Seamless cross-border banking for Non-Resident Indians across 60+ countries. Enjoy tax-exempt NRE fixed deposit returns, zero-markup instant remittances, and dedicated relationship managers.',
    heroFeatures: ['Tax-Exempt NRE Returns', 'Instant Inward Remittances', 'FCNR Multi-Currency (USD/GBP/EUR)', 'Dedicated 24x7 NRI Desk'],
    rateHeader: 'GLOBAL NRI SCHEMES 2026',
    rates: [
      { name: 'NRE Fixed Deposit (INR)', sub: '100% Tax Free Interest in India', val: '8.10%' },
      { name: 'FCNR (USD) Deposit', sub: 'Zero currency risk on US Dollars', val: '5.85%' },
      { name: 'NRI Home Loan in India', sub: 'Flexible tenure up to 30 years', val: '8.50%' }
    ]
  },
  corporate: {
    key: 'corporate',
    name: 'Corporate',
    navItems: [
      { label: 'Transaction Banking ▾', desc: 'Integrated Cash Management (CMS), Liquidity & Escrow Solutions' },
      { label: 'Treasury & Markets ▾', desc: 'FX Risk Management, Derivatives & Structured Forex Products' },
      { label: 'Corporate Credit ▾', desc: 'Syndicated Term Loans, Project Finance & ECB Facilities' },
      { label: 'BSB NEO ▾', desc: 'Next-Gen Omnichannel Corporate Digital Banking Platform' },
      { label: 'Our Coverage ▾', desc: 'Dedicated Sector Experts for Infrastructure, Tech & Manufacturing' }
    ],
    heroBadge: '🏛️ WHOLESALE & INSTITUTIONAL BANKING',
    heroHeading: 'Empowering India’s Industry Giants with BSB Corporate Banking',
    heroSubText: 'End-to-end corporate cash management, cross-border structured trade, debt syndication, and high-frequency digital treasury solutions powered by BSB NEO.',
    heroFeatures: ['BSB NEO Digital Engine', 'Multi-Entity CMS Portals', 'Cross-Border Syndication', 'Automated Treasury Desk'],
    rateHeader: 'CORPORATE MARKET INDICATORS 2026',
    rates: [
      { name: 'Commercial Paper (CP)', sub: 'AAA Rated Corporates', val: '7.40%' },
      { name: 'Syndicated Term Lending', sub: 'Customized Project Finance', val: '8.65%' },
      { name: 'Treasury FX Forwards', sub: 'Hedging USD/INR, EUR/INR', val: 'Realtime' }
    ]
  },
  agri: {
    key: 'agri',
    name: 'Agri',
    navItems: [
      { label: 'Accounts ▾', desc: 'Kisan Savings Deluxe & Farmer Producer Organization (FPO) Accounts' },
      { label: 'Loans ▾', desc: 'Kisan Credit Card (KCC) @ 4% Subsidized Interest & Agri Infra Loans' },
      { label: 'Financial Inclusion ▾', desc: 'PM Jan Dhan Yojana, PM Fasal Bima & Direct Benefit Transfers (DBT)' },
      { label: 'Rural Banking ▾', desc: '12,000+ Business Correspondents (BC) & Micro-ATM Outlets' },
      { label: 'Commodity power ▾', desc: 'Electronic Negotiable Warehouse Receipt (e-NWR) Finance & Mandi Credit' }
    ],
    heroBadge: '🌾 SAMRIDDHI BHARAT • KISAN CREDIT & AGRI FINANCE',
    heroHeading: 'Empowering Indian Farmers & Rural Prosperity with BSB Agri Banking',
    heroSubText: 'Dedicated agricultural financial products: subsidized Kisan Credit Cards, tractor & farm machinery loans, solar pump financing, and electronic warehouse receipt collateral loans.',
    heroFeatures: ['4.00% Kisan Credit Card', 'Zero Processing Fee for Small Farmers', 'PM Fasal Bima Crop Cover', '12,000+ Rural Micro-Branches'],
    rateHeader: 'GOVT. SUBSIDIZED AGRI SCHEMES 2026',
    rates: [
      { name: 'Kisan Credit Card (KCC)', sub: 'With 3% prompt repayment incentive', val: '4.00%' },
      { name: 'Tractor & Harvester Loans', sub: 'Up to 90% on-road funding', val: '8.75%' },
      { name: 'Agri Infrastructure Fund (AIF)', sub: 'Central Govt. 3% Interest Subvention', val: '6.00%' }
    ]
  }
};

window.currentBankSegment = 'personal';

window.switchBankSegment = function(segmentKey) {
  const seg = BANK_SEGMENTS[segmentKey];
  if (!seg) return;
  window.currentBankSegment = segmentKey;

  // 1. Update Segment Pills Active State
  const pills = document.querySelectorAll('.bank-seg-pill');
  pills.forEach(pill => {
    if (pill.id === `seg-pill-${segmentKey}`) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // 2. Render Sub-Menu Navigation Items
  const subNavList = document.getElementById('bank-sub-nav-list');
  if (subNavList) {
    subNavList.innerHTML = seg.navItems.map(item => `
      <li class="bank-nav-item" onclick="showToast('${item.label.replace(' ▾', '')}: ${item.desc.replace(/'/g, "\\'")}', 'info')">
        ${item.label}
      </li>
    `).join('');
  }

  // 3. Dynamically Update Hero Banner Content
  const heroBadge = document.getElementById('hero-badge-text');
  const heroHeading = document.getElementById('hero-main-heading');
  const heroSub = document.getElementById('hero-sub-text');
  const heroFeatures = document.getElementById('hero-features-list');
  const promoHeader = document.getElementById('promo-rate-header');
  const promoRates = document.getElementById('promo-rates-container');

  if (heroBadge) heroBadge.innerText = seg.heroBadge;
  if (heroHeading) heroHeading.innerText = seg.heroHeading;
  if (heroSub) heroSub.innerHTML = seg.heroSubText;

  if (heroFeatures) {
    heroFeatures.innerHTML = seg.heroFeatures.map(feat => `
      <div class="hero-feature-item">
        <span class="hero-feature-icon">✓</span>
        <span>${feat}</span>
      </div>
    `).join('');
  }

  if (promoHeader) promoHeader.innerText = seg.rateHeader;

  if (promoRates) {
    promoRates.innerHTML = seg.rates.map(rate => `
      <div class="promo-rate-box">
        <div>
          <div style="font-size: 0.82rem; font-weight: 700; color: #51061b;">${rate.name}</div>
          <div style="font-size: 0.72rem; color: #783545;">${rate.sub}</div>
        </div>
        <div class="promo-rate-val">${rate.val}</div>
      </div>
    `).join('');
  }

  // Visual animation for segment transition
  if (window.gsap) {
    try {
      gsap.fromTo(['#bank-sub-nav-list .bank-nav-item', '#hero-main-heading', '#hero-sub-text', '.promo-rate-box'],
        { opacity: 0.4, y: 4 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power1.out', stagger: 0.03 }
      );
    } catch(e){}
  }
};

window.toggleLoginMenu = function(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('bank-login-menu');
  if (menu) menu.classList.toggle('show');
};

document.addEventListener('click', () => {
  const menu = document.getElementById('bank-login-menu');
  if (menu && menu.classList.contains('show')) {
    menu.classList.remove('show');
  }
});

// Interactive Financial Calculators for Bank Home
window.updateFdCalculator = function() {
  const amt = parseFloat(document.getElementById('fd-amt-slider')?.value) || 100000;
  const months = parseInt(document.getElementById('fd-tenure-slider')?.value) || 24;
  const rate = 7.35; // 7.35% APR
  const maturity = amt * Math.pow(1 + (rate / 400), (months / 3));

  const amtLabel = document.getElementById('fd-amt-val');
  const tenureLabel = document.getElementById('fd-tenure-val');
  const matLabel = document.getElementById('fd-maturity-val');

  if (amtLabel) amtLabel.innerText = `₹${amt.toLocaleString('en-IN')}`;
  if (tenureLabel) tenureLabel.innerText = `${months} Months (${rate}% APR)`;
  if (matLabel) matLabel.innerText = `₹${maturity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

window.updateEmiCalculator = function() {
  const p = parseFloat(document.getElementById('emi-amt-slider')?.value) || 500000;
  const years = parseInt(document.getElementById('emi-tenure-slider')?.value) || 5;
  const n = years * 12;
  const annualRate = 8.40;
  const r = annualRate / (12 * 100);

  const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const amtLabel = document.getElementById('emi-amt-val');
  const tenureLabel = document.getElementById('emi-tenure-val');
  const emiLabel = document.getElementById('emi-monthly-val');

  if (amtLabel) amtLabel.innerText = `₹${p.toLocaleString('en-IN')}`;
  if (tenureLabel) tenureLabel.innerText = `${years} Years (@ ${annualRate}% p.a.)`;
  if (emiLabel) emiLabel.innerText = `₹${emi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo`;
};

// Handle form events & role tabs
function initEventListeners() {
  const tabs = document.querySelectorAll('.role-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      state.currentRole = e.target.getAttribute('data-role');
      
      const signupText = document.getElementById('auth-signup-text');
      const merchantText = document.getElementById('auth-merchant-text');
      const signinText = document.getElementById('auth-signin-text');
      
      if (signupText) signupText.classList.add('hidden');
      if (merchantText) merchantText.classList.add('hidden');
      if (signinText) signinText.classList.add('hidden');

      showLoginForm();

      if (state.currentRole === 'Customer' && signupText) {
        signupText.classList.remove('hidden');
      } else if (state.currentRole === 'Merchant' && merchantText) {
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

function checkAuthSession() {
  if (state.token && state.user) {
    showDashboard();
  } else {
    showHomePage();
  }
}

// Switch auth views
function showLoginForm() {
  const loginForm = document.getElementById('login-form');
  const custFlow = document.getElementById('customer-signup-flow');
  const merchFlow = document.getElementById('merchant-signup-flow');
  const otpPane = document.getElementById('otp-verify-pane');
  const kycPane = document.getElementById('kyc-submit-pane');
  const pwdPane = document.getElementById('force-password-pane');
  const signinText = document.getElementById('auth-signin-text');

  if (loginForm) loginForm.classList.remove('hidden');
  if (custFlow) custFlow.classList.add('hidden');
  if (merchFlow) merchFlow.classList.add('hidden');
  if (otpPane) otpPane.classList.add('hidden');
  if (kycPane) kycPane.classList.add('hidden');
  if (pwdPane) pwdPane.classList.add('hidden');
  if (signinText) signinText.classList.add('hidden');

  const authHeader = document.getElementById('auth-main-header');
  if (authHeader) authHeader.classList.remove('hidden');

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

  const authHeader = document.getElementById('auth-main-header');
  if (authHeader) authHeader.classList.add('hidden');
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

  const authHeader = document.getElementById('auth-main-header');
  if (authHeader) authHeader.classList.add('hidden');
}

// API Fetch Helper
async function apiCall(endpoint, method = 'GET', body = null, suppressToast = false) {
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
          return apiCall(endpoint, method, body, suppressToast);
        }
      }
      triggerLogout();
      if (!suppressToast) {
        showToast(data.message || 'Session expired or invalidated. Please sign in again.', 'warning');
      }
      const err = new Error('Session invalid or expired. Please sign in again.');
      err.isAuthError = true;
      throw err;
    }

    if (response.status === 403) {
      if (!suppressToast) {
        showToast(data.message || 'Access Denied: Insufficient permissions for this action.', 'danger');
      }
      const err = new Error(data.message || 'Access Denied: Insufficient permissions.');
      err.isAuthError = true;
      throw err;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Server error occurred.');
    }

    return data;
  } catch (err) {
    if (!err.isAuthError && !suppressToast) {
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
      portal: 'customer',
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
        localStorage.setItem('cust_remember_email', email);
        localStorage.setItem('cust_remember_me', 'true');
      } else {
        localStorage.removeItem('cust_remember_email');
        localStorage.removeItem('cust_remember_me');
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
    if (btn.innerText.includes('Aarav') && email.includes('aarav')) {
      btn.style.borderColor = '#c7d2fe';
      btn.style.background = '#e0e7ff';
      btn.style.color = '#4338ca';
      btn.style.fontWeight = '700';
    } else if (btn.innerText.includes('Ram') && email.includes('r@')) {
      btn.style.borderColor = '#c7d2fe';
      btn.style.background = '#e0e7ff';
      btn.style.color = '#4338ca';
      btn.style.fontWeight = '700';
    } else if (btn.innerText.includes('Merchant') && email.includes('merchant')) {
      btn.style.borderColor = '#c7d2fe';
      btn.style.background = '#e0e7ff';
      btn.style.color = '#4338ca';
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
      tabId.style.color = '#4338ca';
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
    if (title) title.innerText = 'Retrieve Customer ID';
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
    if (title) title.innerText = 'Reset NetBanking Password';
    if (icon) icon.innerText = '🔒';
  }
};

window.handleForgotUserId = function(e) {
  e.preventDefault();
  const emailInput = document.getElementById('forgot-id-email');
  const resultDiv = document.getElementById('forgot-id-result');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  
  if (!resultDiv) return;
  
  let recoveredId = 'aarav.mehta@gmail.com';
  let roleName = 'Aarav Mehta (Account: 100000000001)';
  if (email.includes('ram') || email.includes('r@')) {
    recoveredId = 'r@gmail.com';
    roleName = 'Ram Shyam (Customer ID: NX@NW4E1W8)';
  } else if (email.includes('merchant')) {
    recoveredId = 'merchant@bank.com';
    roleName = 'Merchant Commercial Account';
  }

  resultDiv.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 4px;">✅ Verified Customer Profile Found</div>
    <div style="margin-bottom: 6px;">Customer: <strong>${roleName}</strong></div>
    <div style="margin-bottom: 8px;">User ID / Login: <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #c7d2fe; font-weight: 800;">${recoveredId}</code></div>
    <button type="button" onclick="applyRecoveredId('${recoveredId}')" style="padding: 6px 12px; border-radius: 6px; background: #4f46e5; color: #ffffff; border: none; font-size: 0.76rem; font-weight: 700; cursor: pointer;">Use This Customer ID to Sign In →</button>
  `;
  resultDiv.classList.remove('hidden');
};

window.applyRecoveredId = function(id) {
  const loginInput = document.getElementById('login-email');
  if (loginInput) loginInput.value = id;
  closeRecoveryModal();
  showToast('Customer ID applied to login field.', 'success');
};

window.handleForgotPassword = function(e) {
  e.preventDefault();
  const userInput = document.getElementById('forgot-pass-user');
  const resultDiv = document.getElementById('forgot-pass-result');
  const user = userInput ? userInput.value.trim() : '';

  if (!resultDiv) return;
  
  resultDiv.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 4px;">✅ OTP Reset Link Dispatched</div>
    <p style="margin-bottom: 6px; font-size: 0.8rem; line-height: 1.4;">An instant secure NetBanking OTP verification code has been dispatched to <strong>${user}</strong>.</p>
    <div style="padding: 6px 10px; background: #ffffff; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 0.78rem; margin-bottom: 8px;">
      Demo Password: <code style="font-weight: 800; color: #15803d;">Cust1234!</code>
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
  showToast('Signed out of NetBanking.', 'info');
  showHomePage();
}

function normalizeRole(role) {
  if (!role) return 'Customer';
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
    showHomePage();
    return;
  }

  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) loadingEl.classList.add('hidden');

  const homeC = document.getElementById('home-container');
  const authC = document.getElementById('auth-container');
  const dashC = document.getElementById('dashboard-container');
  if (homeC) homeC.classList.add('hidden');
  if (authC) authC.classList.add('hidden');
  if (dashC) dashC.classList.remove('hidden');

  // Set Profile info in sidebar safely
  const userName = state.user?.fullName || state.user?.name || state.user?.email || 'Aarav Mehta';
  const displayRole = state.user?.role || 'Customer';
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

  // Set Navbar User / Customer Indicator dynamically
  const branchIndicator = document.getElementById('manager-branch-indicator');
  if (branchIndicator) {
    const fullName = state.user?.fullName || userName || 'Aarav Mehta';
    branchIndicator.innerText = `Customer : ${fullName}`;
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
    btn.innerHTML = link.name;
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
    { id: 'profile', name: 'My Profile', icon: '👤' },
    { id: 'apply-services', name: 'Apply (Cards & Cheques)', icon: '💳' },
    { id: 'statements', name: 'Account Statements', icon: '📄' },
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
    if (normRole === 'Customer') {
      if (!userModules.includes('profile')) userModules.push('profile');
      if (!userModules.includes('apply-services')) userModules.push('apply-services');
      if (!userModules.includes('statements')) userModules.push('statements');
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
      ['summary', 'profile', 'apply-services', 'statements', 'transfers', 'beneficiaries', 'products', 'dms', 'assistant', 'settings'].includes(link.id)
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
    if (tab === 'profile') {
      await renderCustomerProfile(container, sum);
    } else if (tab === 'apply-services') {
      await renderCustomerApplyServices(container, sum);
    } else if (tab === 'statements') {
      await renderCustomerStatements(container, sum);
    } else if (tab === 'summary') {
      const primaryAcc = (sum.accounts && sum.accounts.length > 0)
        ? sum.accounts[0]
        : { type: 'savings', balance: 0, accountNumber: '1000987654', status: 'active' };

      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <h3>${(primaryAcc.type || 'SAVINGS').toUpperCase()} ACCOUNT</h3>
            <div class="stat-val text-success">₹${Number(primaryAcc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="stat-desc">Account No: <b style="color: #51061b;">${primaryAcc.accountNumber}</b> | Status: <span style="color: #16a34a; font-weight: 700;">● ${(primaryAcc.status || 'active').toUpperCase()}</span></div>
          </div>
          <div class="stat-card">
            <h3>ACTIVE CREDIT CARDS</h3>
            <div class="stat-val" style="font-size: 1.15rem; font-weight: 700; color: #51061b;">
              ${sum.cards.length === 0 ? '<span style="color: #94a3b8; font-weight: 500; font-size: 0.95rem;">No cards issued</span>' : `${sum.cards.length} Active Card${sum.cards.length > 1 ? 's' : ''}`}
            </div>
            <div class="stat-desc">Debit or Credit limits status</div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <h3 style="margin-bottom: 12px; font-size: 0.92rem; font-weight: 800; color: #51061b;">Recent Account Transactions</h3>
            <div class="table-wrapper" style="border: 1px solid #f8dfc5; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
                <thead>
                  <tr style="background: #fdf7ef; border-bottom: 1px solid #f8dfc5;">
                    <th style="padding: 8px 10px; font-size: 0.7rem; font-weight: 700; color: #783545; text-align: left; text-transform: uppercase;">Date</th>
                    <th style="padding: 8px 10px; font-size: 0.7rem; font-weight: 700; color: #783545; text-align: left; text-transform: uppercase;">Type</th>
                    <th style="padding: 8px 10px; font-size: 0.7rem; font-weight: 700; color: #783545; text-align: left; text-transform: uppercase;">Category</th>
                    <th style="padding: 8px 10px; font-size: 0.7rem; font-weight: 700; color: #783545; text-align: right; text-transform: uppercase;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${sum.recentTransactions.length === 0 ? `<tr><td colspan="4" class="text-center" style="padding: 14px; color: #94a3b8;">No transactions recorded.</td></tr>` : ''}
                  ${sum.recentTransactions.slice(0, 10).map(t => `
                    <tr style="border-bottom: 1px solid #fef3e7;">
                      <td style="padding: 7px 10px; color: #475569;">${new Date(t.createdAt || t.postedAt || t.date || Date.now()).toLocaleDateString('en-IN')}</td>
                      <td style="padding: 7px 10px;"><b>${(t.type || 'DEPOSIT').toUpperCase()}</b></td>
                      <td style="padding: 7px 10px; color: #334155;">${t.category || t.description || 'General Banking'}</td>
                      <td style="padding: 7px 10px; text-align: right;"><b style="color: ${t.type === 'deposit' ? '#16a34a' : '#dc2626'};">
                        ${t.type === 'deposit' ? '+' : '-'}₹${Number(t.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </b></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="cards-flex">
            ${sum.cards.map(c => `
              <div class="atm-card" style="border-radius: 12px; padding: 14px 16px;">
                <div class="atm-card-header" style="font-size: 0.72rem;">
                  <span>${c.type.toUpperCase()} CARD</span>
                  <span>BHARATIYA SARVODAYA BANK</span>
                </div>
                <div class="atm-card-chip"></div>
                <div class="atm-card-num" style="font-size: 0.95rem; letter-spacing: 2px;">${c.cardNumber.replace(/(\d{4})/g, '$1 ')}</div>
                <div class="atm-card-footer" style="font-size: 0.7rem;">
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
      const primaryAcc = (sum.accounts && sum.accounts.length > 0) ? sum.accounts[0] : { accountNumber: '1000987654', type: 'savings', balance: 155387.50 };
      container.innerHTML = `
        <div class="card" style="max-width: 620px; margin: 0 auto; padding: 16px 20px; border: 1px solid #f8dfc5; border-radius: 10px;">
          <h3 style="font-size: 1.05rem; font-weight: 800; color: #51061b; margin: 0 0 12px 0;">Send Funds Transfer</h3>
          <form id="transfer-form" style="display: flex; flex-direction: column; gap: 10px;">
            <div class="form-group">
              <label>Debiting Account (Fixed Primary Account)</label>
              <div style="padding: 7px 12px; background: #fef8f2; border: 1px solid #f8dfc5; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 700; color: #51061b;">
                <span>${(primaryAcc.type || 'Savings').toUpperCase()} - ${primaryAcc.accountNumber}</span>
                <span style="color: #15803d; font-size: 0.78rem; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1px 7px; border-radius: 4px;">Available Balance: ₹${(parseFloat(primaryAcc.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <input type="hidden" id="tf-from" value="${primaryAcc.accountNumber}">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label>Destination Account Number</label>
                <input type="text" id="tf-to" required placeholder="Type payee account number">
              </div>
              <div class="form-group">
                <label>Destination IFSC Code</label>
                <input type="text" id="tf-ifsc" required placeholder="e.g. SBIN0001001 / BSB0001001" style="text-transform: uppercase;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label>Amount to Send (₹)</label>
                <input type="number" id="tf-amount" required placeholder="500" min="1" step="any">
              </div>
              <div class="form-group">
                <label>MICR Code (9-Digit Branch Code)</label>
                <input type="text" id="tf-micr" placeholder="e.g. 110002001" maxlength="9">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label>Reference Narrative</label>
                <input type="text" id="tf-desc" placeholder="Rent payment, groceries">
              </div>
              <div class="form-group">
                <label>6-Digit Transaction PIN</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <input type="password" id="tf-pin" required placeholder="••••••" maxlength="6" style="width: 100%; padding-right: 32px;">
                  <button type="button" onclick="togglePinVisibility('tf-pin', this)" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #783545; padding: 2px; display: flex; align-items: center; justify-content: center;" title="Toggle PIN visibility">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top: 6px; padding: 7px 20px; align-self: flex-start;">Authorize Transfer</button>
          </form>
        </div>
      `;
      document.getElementById('transfer-form').addEventListener('submit', handleCustomerTransfer);
    } else if (tab === 'products') {
      const primaryAcc = (sum.accounts && sum.accounts.length > 0) ? sum.accounts[0] : { accountNumber: '1000987654', balance: 155387.50, type: 'Savings' };
      container.innerHTML = `
        <!-- CIBIL CREDIT BUREAU SECTION -->
        <div class="card" style="margin-bottom: 16px; border: 1px solid #f8dfc5; border-radius: 10px; background: #ffffff; padding: 14px 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #f8dfc5; padding-bottom: 10px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 900; font-size: 1rem; color: #0284c7; letter-spacing: 0.5px; border: 1.5px solid #0284c7; padding: 2px 8px; border-radius: 4px;">CIBIL™</span>
              <div>
                <h3 style="font-size: 0.95rem; font-weight: 800; color: #51061b; margin: 0;">TransUnion CIBIL™ Credit Bureau Report</h3>
                <p style="font-size: 0.74rem; color: #783545; margin: 0;">Official RBI-Authorized Consumer Credit Bureau Assessment</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.72rem; color: #15803d; font-weight: 700; background: #dcfce7; padding: 3px 8px; border-radius: 4px; border: 1px solid #86efac;">Verified Prime Record</span>
              <button type="button" id="btn-refresh-cibil" onclick="refreshCibilScore()" class="btn btn-outline-primary" style="font-size: 0.74rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; color: #51061b; border-color: #f8dfc5;">
                Refresh Bureau Score
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div style="background: #fef8f2; border: 1px solid #f8dfc5; border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 12px;">
              <div style="width: 46px; height: 46px; border-radius: 50%; background: #15803d; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 900; box-shadow: 0 4px 10px rgba(21, 128, 61, 0.25);">
                785
              </div>
              <div>
                <div style="font-size: 0.68rem; font-weight: 700; color: #783545; text-transform: uppercase;">CIBIL Score</div>
                <div id="cibil-score-val" style="font-size: 0.88rem; font-weight: 800; color: #15803d;">785 / 900 (Excellent)</div>
                <div style="font-size: 0.65rem; color: #475569;">Prime Tier • Very Low Risk</div>
              </div>
            </div>

            <div style="background: #fef8f2; border: 1px solid #f8dfc5; border-radius: 8px; padding: 10px 12px;">
              <div style="font-size: 0.68rem; font-weight: 700; color: #783545; text-transform: uppercase;">Pre-Approved Loan Eligibility</div>
              <div style="font-size: 0.92rem; font-weight: 800; color: #51061b;">₹25,00,000</div>
              <div style="font-size: 0.65rem; color: #15803d; font-weight: 600;">Instant Digital Sanction Available</div>
            </div>

            <div style="background: #fef8f2; border: 1px solid #f8dfc5; border-radius: 8px; padding: 10px 12px;">
              <div style="font-size: 0.68rem; font-weight: 700; color: #783545; text-transform: uppercase;">Repayment Track Record</div>
              <div style="font-size: 0.92rem; font-weight: 800; color: #15803d;">100% On-Time</div>
              <div style="font-size: 0.65rem; color: #475569;">0 Overdue / 0 Delinquencies</div>
            </div>

            <div style="background: #fef8f2; border: 1px solid #f8dfc5; border-radius: 8px; padding: 10px 12px;">
              <div style="font-size: 0.68rem; font-weight: 700; color: #783545; text-transform: uppercase;">Credit Utilization Ratio</div>
              <div style="font-size: 0.92rem; font-weight: 800; color: #0284c7;">18% (Optimal)</div>
              <div style="font-size: 0.65rem; color: #475569;">Well below 30% benchmark</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- OPEN FIXED DEPOSIT CARD -->
          <div class="card" style="border: 1px solid #f8dfc5; border-radius: 10px; background: #ffffff; padding: 14px 18px;">
            <h3 style="font-size: 0.95rem; font-weight: 800; color: #51061b; margin-bottom: 2px;">Open Fixed Deposit (FD)</h3>
            <p class="text-secondary" style="font-size: 0.76rem; color: #783545; margin-bottom: 12px;">Invest savings into high-yield certificates. Interest compiles quarterly.</p>
            
            <form id="fd-form" style="display:flex; flex-direction:column; gap:10px;">
              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Select Debiting Account</label>
                <select id="fd-acc" required style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                  <option value="${primaryAcc.accountNumber}">${(primaryAcc.type || 'Savings').toUpperCase()} - ${primaryAcc.accountNumber} (Balance: ₹${(parseFloat(primaryAcc.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Fixed Deposit Scheme / Product</label>
                <select id="fd-scheme" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                  <option value="Standard Term Deposit">Standard Term Deposit (General Public - 7.10% p.a.)</option>
                  <option value="Senior Citizen Special Deposit">Senior Citizen Special Deposit (7.60% p.a. • +0.50% Extra)</option>
                  <option value="Tax Saving Term Deposit">Tax Saving Term Deposit (5 Years Lock-in • Sec 80C Benefit - 7.25% p.a.)</option>
                  <option value="Monthly Income Scheme (MIS)">Monthly Income Scheme / MIS (7.15% p.a. • Monthly Interest Credit)</option>
                  <option value="BSB Green Earth Sustainable Deposit">BSB Green Earth Sustainable Term Deposit (7.35% p.a.)</option>
                  <option value="Short-Term Flexi Liquid Deposit">Short-Term Flexi Liquid Deposit (6.50% p.a. • Instant Liquidity)</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Term Duration / Tenure</label>
                <select id="fd-term" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                  <option value="1">7 Days to 45 Days (3.50% APR)</option>
                  <option value="3">46 Days to 179 Days (4.75% APR)</option>
                  <option value="6">180 Days to 210 Days (5.75% APR)</option>
                  <option value="9">211 Days to 364 Days (6.00% APR)</option>
                  <option value="12" selected>12 Months (1 Year - 6.80% APR)</option>
                  <option value="13">400 Days Special Amrit Kalash (7.10% APR)</option>
                  <option value="24">24 Months (2 Years - 7.00% APR)</option>
                  <option value="36">36 Months (3 Years - 6.75% APR)</option>
                  <option value="60">60 Months (5 Years - 6.50% APR)</option>
                  <option value="120">120 Months (10 Years - 6.50% APR)</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Interest Payout Frequency</label>
                <select id="fd-payout" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                  <option value="Cumulative on Maturity">Cumulative Reinvestment on Maturity (Compounded Quarterly)</option>
                  <option value="Monthly Payout">Monthly Interest Payout (Credited to Savings Account)</option>
                  <option value="Quarterly Payout">Quarterly Interest Payout (Credited to Savings Account)</option>
                  <option value="Half-Yearly Payout">Half-Yearly Interest Payout (Credited to Savings Account)</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Principal Placement Amount (₹)</label>
                <input type="number" id="fd-amount" required placeholder="5000" value="5000" min="1000" step="500" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
              </div>

              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Maturity & Renewal Instruction</label>
                <select id="fd-auto" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                  <option value="both" selected>Auto-Renew Principal & Interest on Maturity</option>
                  <option value="principal">Auto-Renew Principal Only (Credit Interest to Savings)</option>
                  <option value="none">Credit Principal & Interest to Savings (Do Not Renew)</option>
                </select>
              </div>

              <button type="submit" class="btn btn-primary" style="padding: 7px 18px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; background: #51061b; color: #fff2e3; border: none; margin-top: 4px; cursor: pointer;">
                Confirm Placement
              </button>
            </form>
          </div>

          <!-- APPLY FOR CREDIT / PERSONAL LOAN CARD -->
          <div class="card" style="border: 1px solid #f8dfc5; border-radius: 10px; background: #ffffff; padding: 14px 18px;">
            <h3 style="font-size: 0.95rem; font-weight: 800; color: #51061b; margin-bottom: 2px;">Apply for Credit / Personal Loan</h3>
            <p class="text-secondary" style="font-size: 0.76rem; color: #783545; margin-bottom: 12px;">Fast-track paperless loan processing backed by instant CIBIL appraisal.</p>

            <form id="loan-form" style="display:flex; flex-direction:column; gap:10px;">
              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Loan Product & Interest Rate</label>
                <select id="ln-type" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                  <option value="home">Home Loan / Housing Mortgage (8.40% APR • Up to 30 Years)</option>
                  <option value="personal">Personal Express Loan (10.50% APR • Instant Disbursal)</option>
                  <option value="car">Auto / Car Loan (8.75% APR • Up to 84 Months)</option>
                  <option value="education">Education / Scholar Loan (8.50% APR • Moratorium Period)</option>
                  <option value="gold">Gold Loan / Sovereign Pledge (8.90% APR • Same-Day Approval)</option>
                  <option value="sme">SME / Business Growth Loan (9.25% APR • Collateral-Free)</option>
                  <option value="fd_loan">Loan Against Fixed Deposit (8.10% APR • 1% above FD Rate)</option>
                  <option value="ev_green">Green Solar & EV Vehicle Loan (8.15% APR • Concessional)</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Term Duration / Tenure</label>
                <select id="ln-months" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                  <option value="6">6 Months (0.5 Year)</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36" selected>36 Months (3 Years)</option>
                  <option value="48">48 Months (4 Years)</option>
                  <option value="60">60 Months (5 Years)</option>
                  <option value="84">84 Months (7 Years - Auto/Personal)</option>
                  <option value="120">120 Months (10 Years)</option>
                  <option value="180">180 Months (15 Years - Home Loan)</option>
                  <option value="240">240 Months (20 Years - Home Loan)</option>
                  <option value="360">360 Months (30 Years - Home Loan)</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Loan Purpose / Requirement</label>
                <select id="ln-purpose" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                  <option value="Property Purchase / Construction">Property Purchase / Construction</option>
                  <option value="Home Renovation & Modernization">Home Renovation & Modernization</option>
                  <option value="Debt Consolidation & Card Payoff">Debt Consolidation & Card Payoff</option>
                  <option value="Medical Emergency & Hospitalization">Medical Emergency & Hospitalization</option>
                  <option value="Higher Education Tuition">Higher Education Tuition & Study Abroad</option>
                  <option value="Vehicle Purchase">Vehicle Purchase (Car / Bike / EV)</option>
                  <option value="Business Expansion">Business Expansion & Working Capital</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Employment Status</label>
                <select id="ln-emp" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                  <option value="Salaried">Salaried (Corporate / Govt / PSU)</option>
                  <option value="Self-Employed Professional">Self-Employed Professional (Doctor / CA / Lawyer)</option>
                  <option value="Business Owner / MSME">Business Owner / MSME Proprietor</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Loan Capital Amount Requested (₹)</label>
                <input type="number" id="ln-amount" required placeholder="15000" value="15000" min="5000" step="5000" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
              </div>

              <button type="submit" class="btn btn-success" style="padding: 7px 18px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; background: #15803d; color: #ffffff; border: none; margin-top: 4px; cursor: pointer;">
                Submit Application
              </button>
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
  const ifsc = document.getElementById('tf-ifsc')?.value || '';
  const micr = document.getElementById('tf-micr')?.value || '';
  const amount = parseFloat(document.getElementById('tf-amount').value);
  const desc = document.getElementById('tf-desc').value;
  const pin = document.getElementById('tf-pin').value;

  try {
    const res = await apiCall('/api/dashboard/transactions', 'POST', {
      fromAccountNumber: fromNum,
      toAccountNumber: toNum,
      ifsc,
      micr,
      amount,
      type: 'transfer',
      description: desc,
      pin
    });
    showToast(res.message, 'success');
    switchTab('summary');
  } catch(e){}
}

window.togglePinVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
  } else {
    input.type = 'password';
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
};

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

window.refreshCibilScore = function() {
  const btn = document.getElementById('btn-refresh-cibil');
  if (btn) {
    btn.innerText = 'Connecting CIBIL...';
    btn.disabled = true;
  }
  setTimeout(() => {
    if (btn) {
      btn.innerText = 'Refreshed Just Now';
      btn.disabled = false;
    }
    showToast('TransUnion CIBIL Score updated live: 785 / 900 (Prime Grade)', 'success');
  }, 600);
};

async function handleFDPlacement(e) {
  e.preventDefault();
  const principalAmount = document.getElementById('fd-amount').value;
  const termMonths = document.getElementById('fd-term').value;
  const scheme = document.getElementById('fd-scheme')?.value || 'Standard Term Deposit';
  const payoutFrequency = document.getElementById('fd-payout')?.value || 'Cumulative on Maturity';
  const autoRenewal = document.getElementById('fd-auto')?.value !== 'none';

  try {
    await apiCall('/api/dashboard/fds/apply', 'POST', { principalAmount, termMonths, autoRenewal, scheme, payoutFrequency });
    showToast('Fixed Deposit placement funded and processed successfully.', 'success');
    switchTab('summary');
  } catch(e){}
}

async function handleLoanSubmit(e) {
  e.preventDefault();
  const amount = document.getElementById('ln-amount').value;
  const loanType = document.getElementById('ln-type').value;
  const termMonths = document.getElementById('ln-months').value;
  const purpose = document.getElementById('ln-purpose')?.value || 'General Requirement';
  const employmentType = document.getElementById('ln-emp')?.value || 'Salaried';

  try {
    await apiCall('/api/dashboard/loans/apply', 'POST', { amount, loanType, termMonths, purpose, employmentType, cibilScore: 785 });
    showToast('Loan request registered. Instant CIBIL appraisal approved for Credit Disbursal.', 'success');
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

// ==========================================
// RENDER CUSTOMER PROFILE (READ-ONLY VIEW)
// ==========================================
async function renderCustomerProfile(container, sum) {
  let user = state.user || {};
  try {
    const authMe = await apiCall('/api/auth/me');
    if (authMe && authMe.user) {
      user = { ...user, ...authMe.user };
      state.user = user;
    }
  } catch(e) {}

  const primaryAcc = (sum.accounts && sum.accounts[0]) || { accountNumber: '1000987654', balance: 50000, type: 'Savings', status: 'active' };
  const initials = (user.fullName || 'Customer User').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const branchName = user.branchId === 'b-kolkata' ? 'Kolkata Park Street Branch (IFSC: BSB0007001)' :
                     user.branchId === 'b-mumbai' ? 'Mumbai Fort Branch (IFSC: BSB0002001)' :
                     'New Delhi Connaught Place Branch (IFSC: BSB0001001)';
  const customerId = user.userId || user.id || 'NX@MEHTA001';
  const panMasked = user.panNumber ? (user.panNumber.substring(0, 4) + '****' + user.panNumber.slice(-2)) : 'BPRP****4A';
  const phone = user.mobileNumber || '+91 9820123456';
  const address = user.address || '124, Sarvodaya Enclave, New Delhi, 110017';
  const dob = user.dob || '1990-05-14';
  const gender = user.gender || 'Male';
  const sdhwo = user.sdhwo || 'S/o Ramesh Mehta';

  container.innerHTML = `
    <!-- Top Profile Summary Banner (Compact) -->
    <div class="card" style="background: #ffffff; border: 1px solid #f8dfc5; padding: 14px 18px; margin-bottom: 12px; border-radius: 10px; box-shadow: 0 2px 8px rgba(81, 6, 27, 0.04);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: #51061b; color: #fff2e3; display: flex; align-items: center; justify-content: center; font-size: 0.92rem; font-weight: 800;">
            ${initials}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 2px;">
              <h2 style="font-size: 1.05rem; font-weight: 800; color: #51061b; margin: 0;">${user.fullName || 'Aarav Mehta'}</h2>
              <span style="background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; font-weight: 700; font-size: 0.68rem; padding: 1px 6px; border-radius: 4px;">Verified Customer</span>
              <span style="background: #fef8f2; color: #51061b; border: 1px solid #f8dfc5; font-weight: 700; font-size: 0.68rem; padding: 1px 6px; border-radius: 4px;">KYC Tier-3 Full KYC</span>
            </div>
            <p style="color: #783545; font-size: 0.76rem; margin: 0;">
              Resident Individual Account • Customer ID: <strong style="color: #51061b;">${customerId}</strong>
            </p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.68rem; font-weight: 700; color: #783545; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px;">Primary Balance</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: #15803d; font-family: monospace;">₹${(primaryAcc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div style="font-size: 0.7rem; color: #783545;">A/C: ${primaryAcc.accountNumber}</div>
        </div>
      </div>

      <!-- Compliance Notice Banner -->
      <div style="margin-top: 10px; padding: 6px 10px; background: #fdf7ef; border: 1px solid #f8dfc5; border-radius: 6px; font-size: 0.72rem; color: #783545; line-height: 1.4;">
        <strong>Official Read-Only Banking Record:</strong> Profile details are synchronized with core banking records (RBI / KYC Regulations). For name, mobile number, or address updates, please visit your home branch with valid ID.
      </div>
    </div>

    <!-- 4 Section Dropdowns (Accordion List) -->
    <div style="display: flex; flex-direction: column; gap: 8px;">
      
      <!-- Dropdown 1: Banking Identification (Read-Only) -->
      <details open style="background: #ffffff; border: 1px solid #f8dfc5; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(81, 6, 27, 0.03);">
        <summary style="padding: 9px 14px; font-size: 0.82rem; font-weight: 700; color: #51061b; background: #fdf7ef; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; border-bottom: 1px solid #f8dfc5; list-style: none;">
          <span>Banking Identification (Read-Only)</span>
          <span style="font-size: 0.7rem; color: #783545;">▼</span>
        </summary>
        <div style="padding: 10px 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px 16px; font-size: 0.78rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Customer ID</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <code style="background: #fdf7ef; padding: 2px 6px; border-radius: 4px; border: 1px solid #f8dfc5; font-weight: 700; color: #51061b;">${customerId}</code>
              <button type="button" onclick="navigator.clipboard.writeText('${customerId}'); showToast('Customer ID copied!', 'success');" style="background: none; border: none; cursor: pointer; color: #51061b; font-size: 0.72rem; font-weight: 700;" title="Copy ID">Copy</button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Primary Account Number</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <code style="background: #fdf7ef; padding: 2px 6px; border-radius: 4px; border: 1px solid #f8dfc5; font-weight: 700; color: #51061b;">${primaryAcc.accountNumber}</code>
              <button type="button" onclick="navigator.clipboard.writeText('${primaryAcc.accountNumber}'); showToast('Account Number copied!', 'success');" style="background: none; border: none; cursor: pointer; color: #51061b; font-size: 0.72rem; font-weight: 700;" title="Copy Account Number">Copy</button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Account Scheme</span>
            <span style="font-weight: 700; color: #1e293b;">${primaryAcc.type ? primaryAcc.type.toUpperCase() : 'SAVINGS'}</span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Assigned Home Branch</span>
            <span style="font-weight: 600; color: #1e293b; text-align: right;">${branchName}</span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Account Status</span>
            <span style="font-weight: 700; color: #16a34a;">Active & Unrestricted</span>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Base Currency</span>
            <span style="font-weight: 600; color: #1e293b;">Indian Rupee (INR - ₹)</span>
          </div>
        </div>
      </details>

      <!-- Dropdown 2: Contact Information (Read-Only) -->
      <details open style="background: #ffffff; border: 1px solid #f8dfc5; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(81, 6, 27, 0.03);">
        <summary style="padding: 9px 14px; font-size: 0.82rem; font-weight: 700; color: #51061b; background: #fdf7ef; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; border-bottom: 1px solid #f8dfc5; list-style: none;">
          <span>Contact Information (Read-Only)</span>
          <span style="font-size: 0.7rem; color: #783545;">▼</span>
        </summary>
        <div style="padding: 10px 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px 16px; font-size: 0.78rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Registered Email</span>
            <span style="font-weight: 600; color: #1e293b;">${user.email || 'customer@bank.com'} <span style="color: #16a34a; font-size: 0.72rem; font-weight: 700;">[Verified]</span></span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Registered Mobile</span>
            <span style="font-weight: 600; color: #1e293b;">${phone} <span style="color: #16a34a; font-size: 0.72rem; font-weight: 700;">[Verified]</span></span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Communication Address</span>
            <span style="font-weight: 600; color: #1e293b; text-align: right;">${address}</span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Permanent Address</span>
            <span style="font-weight: 600; color: #1e293b; text-align: right;">${address}</span>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Alert Channel</span>
            <span style="font-weight: 600; color: #51061b;">SMS & Email Alerts Active</span>
          </div>
        </div>
      </details>

      <!-- Dropdown 3: Government ID & KYC Records -->
      <details open style="background: #ffffff; border: 1px solid #f8dfc5; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(81, 6, 27, 0.03);">
        <summary style="padding: 9px 14px; font-size: 0.82rem; font-weight: 700; color: #51061b; background: #fdf7ef; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; border-bottom: 1px solid #f8dfc5; list-style: none;">
          <span>Government ID & KYC Records</span>
          <span style="font-size: 0.7rem; color: #783545;">▼</span>
        </summary>
        <div style="padding: 10px 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px 16px; font-size: 0.78rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">PAN Card Record</span>
            <span style="font-weight: 700; color: #1e293b;">${panMasked} <span style="color: #16a34a; font-size: 0.72rem; font-weight: 700;">[Linked]</span></span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Aadhaar / UIDAI Reference</span>
            <span style="font-weight: 700; color: #1e293b;">XXXX-XXXX-8921 <span style="color: #16a34a; font-size: 0.72rem; font-weight: 700;">[Biometric Verified]</span></span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Date of Birth</span>
            <span style="font-weight: 600; color: #1e293b;">${dob}</span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Gender</span>
            <span style="font-weight: 600; color: #1e293b;">${gender}</span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Father's / Spouse Name</span>
            <span style="font-weight: 600; color: #1e293b;">${sdhwo}</span>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Citizenship</span>
            <span style="font-weight: 600; color: #1e293b;">Indian (Resident)</span>
          </div>
        </div>
      </details>

      <!-- Dropdown 4: Nominee, Limits & Security -->
      <details open style="background: #ffffff; border: 1px solid #f8dfc5; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(81, 6, 27, 0.03);">
        <summary style="padding: 9px 14px; font-size: 0.82rem; font-weight: 700; color: #51061b; background: #fdf7ef; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; border-bottom: 1px solid #f8dfc5; list-style: none;">
          <span>Nominee, Limits & Security</span>
          <span style="font-size: 0.7rem; color: #783545;">▼</span>
        </summary>
        <div style="padding: 10px 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px 16px; font-size: 0.78rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Registered Nominee</span>
            <span style="font-weight: 700; color: #1e293b;">Pooja Mehta (Spouse) - 100%</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Daily NEFT / RTGS / IMPS Limit</span>
            <span style="font-weight: 700; color: #16a34a;">₹5,00,000 / day</span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Daily ATM Cash Limit</span>
            <span style="font-weight: 700; color: #16a34a;">₹1,00,000 / day</span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">Two-Factor Authentication (2FA)</span>
            <span style="font-weight: 700; color: #16a34a;">Active (SMS + PIN)</span>
          </div>

          <div style="display: flex; justify-content: space-between; padding-bottom: 6px; border-bottom: 1px dashed #f8dfc5;">
            <span style="color: #64748b;">NetBanking Encryption</span>
            <span style="font-weight: 600; color: #1e293b;">256-Bit TLS v1.3</span>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Security Risk Rating</span>
            <span style="font-weight: 700; color: #16a34a;">Low / Protected</span>
          </div>
        </div>
      </details>

    </div>
  `;
}

// ==========================================
// RENDER CUSTOMER APPLY SERVICES SECTION
// ==========================================
async function renderCustomerApplyServices(container, sum) {
  let user = state.user || {};
  const accounts = (sum.accounts && sum.accounts.length > 0) ? [sum.accounts[0]] : [
    { accountNumber: '1000987654', balance: 155387.50, type: 'Savings' }
  ];
  const primaryAcc = accounts[0];

  // Load customer submitted applications from localStorage
  const storageKey = `cust_applications_${user.userId || user.id || 'default'}`;
  let apps = [];
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      apps = JSON.parse(saved);
    } else {
      apps = [
        {
          id: 'APP-DC-94812',
          type: 'Debit Card',
          title: 'RuPay Platinum Contactless',
          accountNumber: primaryAcc.accountNumber,
          date: '2026-08-15',
          status: 'Approved & Dispatched',
          statusClass: 'active',
          tracking: 'Speed Post #IN98124819',
          details: 'Daily ATM limit: ₹50,000 • Tap & Pay Active'
        },
        {
          id: 'APP-CHQ-38192',
          type: 'Cheque Book',
          title: 'Cheque Book (50 Leaves)',
          accountNumber: primaryAcc.accountNumber,
          date: '2026-08-18',
          status: 'In Transit',
          statusClass: 'frozen',
          tracking: 'Courier #DTDC771928',
          details: 'Dispatched to Registered Address'
        }
      ];
      localStorage.setItem(storageKey, JSON.stringify(apps));
    }
  } catch(e) {}

  container.innerHTML = `
    <!-- Top Header & Tabs (Compact, No Emojis) -->
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
        <div>
          <h2 style="font-size: 1.05rem; font-weight: 800; color: #51061b; margin: 0 0 2px 0;">Apply for Banking Services & Cards</h2>
          <p style="color: #783545; font-size: 0.76rem; margin: 0;">Instantly apply for Debit Cards, Credit Cards, Cheque Books, Demand Drafts and UPI channels.</p>
        </div>
        <button type="button" onclick="switchApplyServiceSubTab('track')" class="btn btn-outline-primary" style="font-weight: 700; padding: 6px 12px; font-size: 0.76rem; border-radius: 6px; color: #51061b; border-color: #f8dfc5;">
          View My Applications (${apps.length})
        </button>
      </div>

      <!-- Sub-Tab Navigation Bar -->
      <div style="display: flex; background: #ffffff; border: 1px solid #f8dfc5; border-radius: 8px; padding: 3px; gap: 3px; overflow-x: auto;">
        <button type="button" id="subtab-btn-debit" class="btn subtab-btn active" onclick="switchApplyServiceSubTab('debit')" style="flex: 1; padding: 6px 10px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; border: none; background: #51061b; color: #fff2e3; cursor: pointer; white-space: nowrap;">
          Apply Debit Card
        </button>
        <button type="button" id="subtab-btn-credit" class="btn subtab-btn" onclick="switchApplyServiceSubTab('credit')" style="flex: 1; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 0.78rem; border: none; background: transparent; color: #783545; cursor: pointer; white-space: nowrap;">
          Apply Credit Card
        </button>
        <button type="button" id="subtab-btn-cheque" class="btn subtab-btn" onclick="switchApplyServiceSubTab('cheque')" style="flex: 1; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 0.78rem; border: none; background: transparent; color: #783545; cursor: pointer; white-space: nowrap;">
          Request Cheque Book
        </button>
        <button type="button" id="subtab-btn-upi" class="btn subtab-btn" onclick="switchApplyServiceSubTab('upi')" style="flex: 1; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 0.78rem; border: none; background: transparent; color: #783545; cursor: pointer; white-space: nowrap;">
          UPI & Channels
        </button>
        <button type="button" id="subtab-btn-dd" class="btn subtab-btn" onclick="switchApplyServiceSubTab('dd')" style="flex: 1; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 0.78rem; border: none; background: transparent; color: #783545; cursor: pointer; white-space: nowrap;">
          Demand Draft (DD)
        </button>
        <button type="button" id="subtab-btn-track" class="btn subtab-btn" onclick="switchApplyServiceSubTab('track')" style="flex: 1; padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 0.78rem; border: none; background: transparent; color: #783545; cursor: pointer; white-space: nowrap;">
          Track Requests (${apps.length})
        </button>
      </div>
    </div>

    <!-- PANE 1: DEBIT CARD APPLICATION -->
    <div id="pane-service-debit" class="service-pane">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px;">
        <div class="card" style="padding: 14px 18px; border-radius: 10px; border: 1px solid #f8dfc5; background: #ffffff;">
          <h3 style="font-size: 0.95rem; font-weight: 800; color: #51061b; margin-bottom: 12px;">New Debit Card Application</h3>
          <form onsubmit="handleApplyDebitCard(event)" style="display: flex; flex-direction: column; gap: 10px;">
            <div class="form-group">
              <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Select Linked Bank Account</label>
              <select id="dc-acc" required style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                ${accounts.map(a => `<option value="${a.accountNumber}">${(a.type || 'Savings').toUpperCase()} - ${a.accountNumber} (Balance: ₹${(parseFloat(a.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Choose Card Variant & Network</label>
              <select id="dc-type" onchange="updateDebitCardPreview(this.value)" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                <option value="RuPay Platinum">RuPay Platinum Contactless (Free • ₹50,000/day ATM)</option>
                <option value="Visa Platinum International">Visa Platinum International (Lounge Access • ₹1,00,000/day ATM)</option>
                <option value="Mastercard World">Mastercard World Contactless (Zero Forex • ₹2,00,000/day ATM)</option>
                <option value="Signature Black Titanium">Signature Black Titanium (Elite Concierge • ₹5,00,000/day ATM)</option>
              </select>
            </div>

            <div class="form-group">
              <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Cardholder Name (Embossed on Card)</label>
              <input type="text" id="dc-name" required value="${user.fullName || 'Aarav Mehta'}" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
            </div>

            <div class="form-group">
              <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Dispatch Delivery Address</label>
              <input type="text" id="dc-address" required value="${user.address || '124, Sarvodaya Enclave, New Delhi, 110017'}" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
            </div>

            <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
              <input type="checkbox" id="dc-intl" checked style="accent-color: #51061b; width: 14px; height: 14px;">
              <label for="dc-intl" style="font-size: 0.75rem; color: #783545; cursor: pointer;">Enable Online E-Commerce & Domestic Tap-to-Pay (NFC)</label>
            </div>

            <button type="submit" class="btn btn-primary" style="padding: 7px 18px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; background: #51061b; color: #fff2e3; border: none; margin-top: 4px; cursor: pointer;">
              Submit Debit Card Request
            </button>
          </form>
        </div>

        <!-- Live Visual Realistic Card Preview -->
        <div class="card" style="padding: 14px 18px; border-radius: 10px; border: 1px solid #f8dfc5; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #ffffff;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #783545; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Live Card Mockup</div>
          <div id="debit-card-preview-box" class="atm-card" style="width: 100%; max-width: 290px; height: 165px; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0369a1 100%); border: 1px solid #38bdf8; border-radius: 12px; padding: 14px 16px; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 8px 24px rgba(30, 58, 138, 0.4); position: relative; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.65rem; font-weight: 800; letter-spacing: 0.5px; color: #fed7aa;">BHARATIYA SARVODAYA BANK</span>
              <span id="preview-card-network" style="font-size: 0.68rem; font-weight: 800; background: #ffffff; color: #1e3a8a; padding: 1px 5px; border-radius: 3px;">RUPAY</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <div style="width: 30px; height: 22px; background: linear-gradient(135deg, #fbbf24, #f59e0b); border-radius: 4px; border: 1px solid #d97706;"></div>
              <div style="font-size: 0.75rem; color: #cbd5e1; font-weight: 600;">CONTACTLESS</div>
            </div>
            <div style="font-family: 'Space Grotesk', monospace; font-size: 0.98rem; letter-spacing: 1.8px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
              4532 •••• •••• 9812
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.68rem;">
              <div>
                <div style="font-size: 0.55rem; color: #cbd5e1; text-transform: uppercase;">Cardholder</div>
                <div id="preview-holder-name" style="font-weight: 700; text-transform: uppercase;">${user.fullName || 'Aarav Mehta'}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.55rem; color: #cbd5e1; text-transform: uppercase;">Valid Thru</div>
                <div style="font-weight: 700;">08/31</div>
              </div>
            </div>
          </div>
          <div style="margin-top: 12px; font-size: 0.72rem; color: #15803d; font-weight: 600; text-align: center;">
            Instant Green PIN Generation via SMS upon delivery
          </div>
        </div>
      </div>
    </div>

    <!-- PANE 2: CREDIT CARD APPLICATION -->
    <div id="pane-service-credit" class="service-pane hidden">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px;">
        <div class="card" style="padding: 14px 18px; border-radius: 10px; border: 1px solid #f8dfc5; background: #ffffff;">
          <h3 style="font-size: 0.95rem; font-weight: 800; color: #51061b; margin-bottom: 12px;">Apply for Pre-Approved Credit Card</h3>
          <form onsubmit="handleApplyCreditCard(event)" style="display: flex; flex-direction: column; gap: 10px;">
            <div class="form-group">
              <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Select Credit Card Variant</label>
              <select id="cc-variant" onchange="updateCreditCardPreview(this.value)" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                <option value="BSB Millennia Cashback">BSB Millennia Cashback (5% Cashback on Amazon/Flipkart/Swiggy)</option>
                <option value="BSB Regalia Gold">BSB Regalia Gold (4X Reward Points + Domestic Lounge Access)</option>
                <option value="BSB Infinia Super-Premium">BSB Infinia Super-Premium (Unlimited Global Lounge + Golf Perks)</option>
                <option value="SBI SimplySave Rewards">SBI / BSB SimplySave Rewards (10X Points on Dining & Movies)</option>
              </select>
            </div>

            <div class="form-group">
              <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Desired Credit Limit (₹)</label>
              <input type="number" id="cc-limit" required min="50000" max="1000000" step="10000" value="150000" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
            </div>

            <div class="form-group">
              <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Employment Type</label>
              <select id="cc-employment" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
                <option value="Salaried">Salaried (Corporate / Govt)</option>
                <option value="Self-Employed">Self-Employed / Business Owner</option>
                <option value="Professional">Doctor / CA / Lawyer / Consultant</option>
              </select>
            </div>

            <div class="form-group">
              <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Monthly Net Income (₹)</label>
              <input type="number" id="cc-income" required placeholder="75000" value="85000" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
            </div>

            <button type="submit" class="btn btn-primary" style="padding: 7px 18px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; background: #51061b; color: #fff2e3; border: none; margin-top: 4px; cursor: pointer;">
              Check Eligibility & Apply
            </button>
          </form>
        </div>

        <!-- Live Realistic Credit Card Preview & Benefits -->
        <div class="card" style="padding: 14px 18px; border-radius: 10px; border: 1px solid #f8dfc5; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #ffffff;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #783545; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Live Credit Card Mockup</div>
          <div id="credit-card-preview-box" class="atm-card" style="width: 100%; max-width: 290px; height: 165px; background: linear-gradient(135deg, #2e1065 0%, #581c87 50%, #9333ea 100%); border: 1px solid #c084fc; border-radius: 12px; padding: 14px 16px; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 8px 24px rgba(88, 28, 135, 0.4); position: relative; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.65rem; font-weight: 800; letter-spacing: 0.5px; color: #fed7aa;">BHARATIYA SARVODAYA BANK</span>
              <span id="preview-cc-network" style="font-size: 0.62rem; font-weight: 800; background: #ffffff; color: #581c87; padding: 1px 5px; border-radius: 3px;">MILLENNIA CASHBACK</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <div style="width: 30px; height: 22px; background: linear-gradient(135deg, #e2e8f0, #cbd5e1); border-radius: 4px; border: 1px solid #94a3b8;"></div>
              <div style="font-size: 0.75rem; color: #cbd5e1; font-weight: 600;">CREDIT ELITE</div>
            </div>
            <div id="preview-cc-number" style="font-family: 'Space Grotesk', monospace; font-size: 0.98rem; letter-spacing: 1.8px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
              5241 •••• •••• 7734
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.68rem;">
              <div>
                <div style="font-size: 0.55rem; color: #cbd5e1; text-transform: uppercase;">Primary Holder</div>
                <div style="font-weight: 700; text-transform: uppercase;">${user.fullName || 'Aarav Mehta'}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.55rem; color: #cbd5e1; text-transform: uppercase;">Valid Thru</div>
                <div style="font-weight: 700;">12/30</div>
              </div>
            </div>
          </div>
          <div style="margin-top: 12px; padding: 8px 12px; background: #fef8f2; border: 1px solid #f8dfc5; border-radius: 6px; width: 100%; font-size: 0.72rem; color: #783545;">
            <div><strong>Cardholder Privileges:</strong></div>
            <div style="margin-top: 2px;">• 5% cashback on leading e-commerce portals</div>
            <div>• Complimentary domestic airport lounge access</div>
            <div>• 1% fuel surcharge waiver across India</div>
          </div>
        </div>
      </div>
    </div>

    <!-- PANE 3: CHEQUE BOOK REQUEST -->
    <div id="pane-service-cheque" class="service-pane hidden">
      <div style="max-width: 520px; margin: 0 auto; padding: 14px 18px; border-radius: 10px; border: 1px solid #f8dfc5; background: #ffffff;" class="card">
        <h3 style="font-size: 0.95rem; font-weight: 800; color: #51061b; margin-bottom: 12px;">Order New Personal Cheque Book</h3>
        <form onsubmit="handleRequestChequeBook(event)" style="display: flex; flex-direction: column; gap: 10px;">
          <div class="form-group">
            <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Select Account</label>
            <select id="chq-acc" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
              ${accounts.map(a => `<option value="${a.accountNumber}">${(a.type || 'Savings').toUpperCase()} - ${a.accountNumber}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Number of Cheque Leaves</label>
            <select id="chq-leaves" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
              <option value="25 Leaves">25 Leaves (Standard - Free)</option>
              <option value="50 Leaves">50 Leaves (₹75 + GST)</option>
              <option value="100 Leaves">100 Leaves (₹140 + GST)</option>
            </select>
          </div>

          <div class="form-group">
            <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Delivery Method</label>
            <select id="chq-delivery" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
              <option value="Speed Post">Speed Post to Registered Residential Address</option>
              <option value="Branch Pickup">Collect in Person from Home Branch</option>
            </select>
          </div>

          <div style="padding: 8px 12px; background: #fef8f2; border: 1px solid #f8dfc5; border-radius: 6px; font-size: 0.72rem; color: #783545;">
            Delivered within 3-5 business days with live SMS tracking.
          </div>

          <button type="submit" class="btn btn-primary" style="padding: 7px 18px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; background: #51061b; color: #fff2e3; border: none; margin-top: 4px; cursor: pointer;">
            Submit Cheque Book Request
          </button>
        </form>
      </div>
    </div>

    <!-- PANE 4: UPI & PAYMENT CHANNELS -->
    <div id="pane-service-upi" class="service-pane hidden">
      <div style="max-width: 520px; margin: 0 auto; padding: 14px 18px; border-radius: 10px; border: 1px solid #f8dfc5; background: #ffffff;" class="card">
        <h3 style="font-size: 0.95rem; font-weight: 800; color: #51061b; margin-bottom: 12px;">UPI & Digital Payment Channels</h3>
        <form onsubmit="handleSaveUpiSettings(event)" style="display: flex; flex-direction: column; gap: 12px;">
          <div class="form-group">
            <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Your Custom UPI VPA Handle</label>
            <div style="display: flex; align-items: center;">
              <input type="text" id="upi-vpa" required value="${(user.fullName || 'aarav').toLowerCase().replace(/\s+/g, '.')}" style="flex: 1; padding: 6px 10px; border-radius: 6px 0 0 6px; border: 1px solid #cbd5e1; border-right: none; font-size: 0.78rem;">
              <span style="padding: 6px 12px; background: #fef8f2; border: 1px solid #cbd5e1; border-radius: 0 6px 6px 0; font-weight: 700; color: #51061b; font-size: 0.78rem;">@bsb</span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; background: #fef8f2; border-radius: 8px; border: 1px solid #f8dfc5;">
            <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 0.78rem; color: #1e293b;">
              <span><strong>Contactless Tap-to-Pay (NFC)</strong><br><small style="color: #783545;">Allow wave & pay up to ₹5,000 without PIN</small></span>
              <input type="checkbox" id="chan-nfc" checked style="accent-color: #51061b; width: 15px; height: 15px;">
            </label>
            <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 0.78rem; color: #1e293b; border-top: 1px solid #f8dfc5; padding-top: 8px;">
              <span><strong>International NetBanking & POS</strong><br><small style="color: #783545;">Allow global cross-border payments</small></span>
              <input type="checkbox" id="chan-intl" style="accent-color: #51061b; width: 15px; height: 15px;">
            </label>
            <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 0.78rem; color: #1e293b; border-top: 1px solid #f8dfc5; padding-top: 8px;">
              <span><strong>Instant UPI Auto-Pay Subscriptions</strong><br><small style="color: #783545;">Enable recurring OTT, utility, and bill mandates</small></span>
              <input type="checkbox" id="chan-autopay" checked style="accent-color: #51061b; width: 15px; height: 15px;">
            </label>
          </div>

          <button type="submit" class="btn btn-primary" style="padding: 7px 18px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; background: #51061b; color: #fff2e3; border: none; margin-top: 4px; cursor: pointer;">
            Save Payment Preferences
          </button>
        </form>
      </div>
    </div>

    <!-- PANE 5: DEMAND DRAFT (DD) -->
    <div id="pane-service-dd" class="service-pane hidden">
      <div style="max-width: 520px; margin: 0 auto; padding: 14px 18px; border-radius: 10px; border: 1px solid #f8dfc5; background: #ffffff;" class="card">
        <h3 style="font-size: 0.95rem; font-weight: 800; color: #51061b; margin-bottom: 12px;">Request Demand Draft (DD)</h3>
        <form onsubmit="handleRequestDD(event)" style="display: flex; flex-direction: column; gap: 10px;">
          <div class="form-group">
            <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">In Favour Of (Beneficiary / Institution Name)</label>
            <input type="text" id="dd-favour" required placeholder="e.g. University Admissions Office" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
          </div>
          <div class="form-group">
            <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">Payable At City</label>
            <input type="text" id="dd-city" required placeholder="e.g. Mumbai / New Delhi" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
          </div>
          <div class="form-group">
            <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 2px; display: block;">DD Amount (₹)</label>
            <input type="number" id="dd-amount" required min="500" max="500000" placeholder="10000" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem;">
          </div>
          <button type="submit" class="btn btn-primary" style="padding: 7px 18px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; background: #51061b; color: #fff2e3; border: none; margin-top: 4px; cursor: pointer;">
            Authorize & Generate Demand Draft
          </button>
        </form>
      </div>
    </div>

    <!-- PANE 6: TRACK SUBMITTED APPLICATIONS -->
    <div id="pane-service-track" class="service-pane hidden">
      <div class="card" style="padding: 14px 18px; border-radius: 10px; border: 1px solid #f8dfc5; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 0.95rem; font-weight: 800; color: #51061b; margin: 0;">My Service Applications History</h3>
          <span style="font-size: 0.76rem; font-weight: 700; color: #51061b;">Total Requests: ${apps.length}</span>
        </div>

        <div class="table-wrapper" style="border: 1px solid #f8dfc5; border-radius: 8px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
            <thead>
              <tr style="background: #fdf7ef; border-bottom: 1px solid #f8dfc5;">
                <th style="padding: 8px 10px; text-align: left; font-size: 0.7rem; color: #783545; text-transform: uppercase;">Reference ID</th>
                <th style="padding: 8px 10px; text-align: left; font-size: 0.7rem; color: #783545; text-transform: uppercase;">Service Type</th>
                <th style="padding: 8px 10px; text-align: left; font-size: 0.7rem; color: #783545; text-transform: uppercase;">Application Details</th>
                <th style="padding: 8px 10px; text-align: left; font-size: 0.7rem; color: #783545; text-transform: uppercase;">Date Applied</th>
                <th style="padding: 8px 10px; text-align: left; font-size: 0.7rem; color: #783545; text-transform: uppercase;">Status</th>
                <th style="padding: 8px 10px; text-align: left; font-size: 0.7rem; color: #783545; text-transform: uppercase;">Tracking Info</th>
              </tr>
            </thead>
            <tbody>
              ${apps.length === 0 ? `<tr><td colspan="6" class="text-center" style="padding: 16px; color: #783545;">No applications submitted yet. Apply above!</td></tr>` : ''}
              ${apps.map(a => `
                <tr style="border-bottom: 1px solid #fef3e7;">
                  <td style="padding: 7px 10px;"><code style="background: #fef8f2; border: 1px solid #f8dfc5; color: #51061b; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${a.id}</code></td>
                  <td style="padding: 7px 10px; color: #1e293b;"><b>${a.type}</b></td>
                  <td style="padding: 7px 10px; color: #475569;">${a.title}<br><small style="color: #783545;">${a.details || ''}</small></td>
                  <td style="padding: 7px 10px; color: #475569;">${a.date}</td>
                  <td style="padding: 7px 10px;"><span class="status-badge ${a.statusClass || 'active'}">${a.status}</span></td>
                  <td style="padding: 7px 10px;"><span style="font-family: monospace; font-size: 0.75rem; color: #0284c7;">${a.tracking || 'Processing'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

window.switchApplyServiceSubTab = function(tabName) {
  document.querySelectorAll('.service-pane').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.style.background = 'transparent';
    btn.style.color = '#783545';
    btn.style.fontWeight = '600';
  });

  const pane = document.getElementById(`pane-service-${tabName}`);
  const btn = document.getElementById(`subtab-btn-${tabName}`);

  if (pane) pane.classList.remove('hidden');
  if (btn) {
    btn.style.background = '#51061b';
    btn.style.color = '#fff2e3';
    btn.style.fontWeight = '700';
  }
};

window.updateDebitCardPreview = function(val) {
  const card = document.getElementById('debit-card-preview-box');
  const badge = document.getElementById('preview-card-network');
  if (!card) return;

  if (val.includes('RuPay')) {
    card.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0369a1 100%)';
    card.style.border = '1px solid #38bdf8';
    card.style.boxShadow = '0 8px 24px rgba(30, 58, 138, 0.4)';
    if (badge) {
      badge.innerText = 'RUPAY';
      badge.style.background = '#ffffff';
      badge.style.color = '#1e3a8a';
    }
  } else if (val.includes('Visa')) {
    card.style.background = 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #0f766e 100%)';
    card.style.border = '1px solid #34d399';
    card.style.boxShadow = '0 8px 24px rgba(4, 120, 87, 0.4)';
    if (badge) {
      badge.innerText = 'VISA';
      badge.style.background = '#ffffff';
      badge.style.color = '#047857';
    }
  } else if (val.includes('Mastercard')) {
    card.style.background = 'linear-gradient(135deg, #18181b 0%, #27272a 55%, #7c2d12 100%)';
    card.style.border = '1px solid #f97316';
    card.style.boxShadow = '0 8px 24px rgba(124, 45, 18, 0.4)';
    if (badge) {
      badge.innerText = 'MASTERCARD';
      badge.style.background = '#ffffff';
      badge.style.color = '#c2410c';
    }
  } else if (val.includes('Signature')) {
    card.style.background = 'linear-gradient(135deg, #000000 0%, #1c1917 60%, #44403c 100%)';
    card.style.border = '1px solid #eab308';
    card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6)';
    if (badge) {
      badge.innerText = 'SIGNATURE';
      badge.style.background = '#eab308';
      badge.style.color = '#000000';
    }
  }
};

window.updateCreditCardPreview = function(val) {
  const card = document.getElementById('credit-card-preview-box');
  const badge = document.getElementById('preview-cc-network');
  if (!card) return;

  if (val.includes('Millennia')) {
    card.style.background = 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #9333ea 100%)';
    card.style.border = '1px solid #c084fc';
    card.style.boxShadow = '0 8px 24px rgba(88, 28, 135, 0.4)';
    if (badge) {
      badge.innerText = 'MILLENNIA CASHBACK';
      badge.style.background = '#ffffff';
      badge.style.color = '#581c87';
    }
  } else if (val.includes('Regalia Gold')) {
    card.style.background = 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)';
    card.style.border = '1px solid #fde047';
    card.style.boxShadow = '0 8px 24px rgba(180, 83, 9, 0.4)';
    if (badge) {
      badge.innerText = 'REGALIA GOLD';
      badge.style.background = '#fef08a';
      badge.style.color = '#78350f';
    }
  } else if (val.includes('Infinia')) {
    card.style.background = 'linear-gradient(135deg, #09090b 0%, #18181b 60%, #27272a 100%)';
    card.style.border = '1px solid #cbd5e1';
    card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.65)';
    if (badge) {
      badge.innerText = 'INFINIA METAL';
      badge.style.background = '#e2e8f0';
      badge.style.color = '#09090b';
    }
  } else if (val.includes('SimplySave')) {
    card.style.background = 'linear-gradient(135deg, #51061b 0%, #831843 50%, #9f1239 100%)';
    card.style.border = '1px solid #f43f5e';
    card.style.boxShadow = '0 8px 24px rgba(81, 6, 27, 0.4)';
    if (badge) {
      badge.innerText = 'SIMPLYSAVE';
      badge.style.background = '#ffffff';
      badge.style.color = '#51061b';
    }
  }
};

window.handleApplyDebitCard = function(e) {
  e.preventDefault();
  const user = state.user || {};
  const acc = document.getElementById('dc-acc').value;
  const type = document.getElementById('dc-type').value;
  const name = document.getElementById('dc-name').value;
  const addr = document.getElementById('dc-address').value;

  const reqId = `REQ-DC-${Math.floor(10000 + Math.random() * 90000)}`;
  const newApp = {
    id: reqId,
    type: 'Debit Card',
    title: type,
    accountNumber: acc,
    date: new Date().toISOString().split('T')[0],
    status: 'Approved & Dispatched',
    statusClass: 'active',
    tracking: `Speed Post #IN${Math.floor(10000000 + Math.random() * 90000000)}`,
    details: `Name on card: ${name} • Delivery to ${addr}`
  };

  saveCustomerApplication(newApp);
  showToast(`Debit Card Application ${reqId} Approved! Dispatched via Speed Post.`, 'success');
  renderWorkspace('apply-services').then(() => {
    switchApplyServiceSubTab('track');
  });
};

window.handleApplyCreditCard = function(e) {
  e.preventDefault();
  const variant = document.getElementById('cc-variant').value;
  const limit = document.getElementById('cc-limit').value;

  const reqId = `REQ-CC-${Math.floor(10000 + Math.random() * 90000)}`;
  const newApp = {
    id: reqId,
    type: 'Credit Card',
    title: `${variant} (Limit: ₹${parseInt(limit).toLocaleString('en-IN')})`,
    accountNumber: state.user?.userId || 'Customer',
    date: new Date().toISOString().split('T')[0],
    status: 'Approved & Active',
    statusClass: 'active',
    tracking: `Courier #BLUEDART-${Math.floor(100000 + Math.random() * 900000)}`,
    details: `Pre-approved limit ₹${parseInt(limit).toLocaleString('en-IN')} granted.`
  };

  saveCustomerApplication(newApp);
  showToast(`Credit Card Approved! Your card reference is ${reqId}`, 'success');
  renderWorkspace('apply-services').then(() => {
    switchApplyServiceSubTab('track');
  });
};

window.handleRequestChequeBook = function(e) {
  e.preventDefault();
  const acc = document.getElementById('chq-acc').value;
  const leaves = document.getElementById('chq-leaves').value;
  const del = document.getElementById('chq-delivery').value;

  const reqId = `REQ-CHQ-${Math.floor(10000 + Math.random() * 90000)}`;
  const newApp = {
    id: reqId,
    type: 'Cheque Book',
    title: `Personal Cheque Book (${leaves})`,
    accountNumber: acc,
    date: new Date().toISOString().split('T')[0],
    status: 'In Transit',
    statusClass: 'frozen',
    tracking: `Speed Post #IN${Math.floor(10000000 + Math.random() * 90000000)}`,
    details: `${del} • Dispatched`
  };

  saveCustomerApplication(newApp);
  showToast(`Cheque Book ordered successfully! Ref: ${reqId}`, 'success');
  renderWorkspace('apply-services').then(() => {
    switchApplyServiceSubTab('track');
  });
};

window.handleSaveUpiSettings = function(e) {
  e.preventDefault();
  const vpa = document.getElementById('upi-vpa').value;
  showToast(`UPI ID ${vpa}@bsb and channel settings saved!`, 'success');
};

window.handleRequestDD = function(e) {
  e.preventDefault();
  const favour = document.getElementById('dd-favour').value;
  const city = document.getElementById('dd-city').value;
  const amount = document.getElementById('dd-amount').value;

  const reqId = `REQ-DD-${Math.floor(10000 + Math.random() * 90000)}`;
  const newApp = {
    id: reqId,
    type: 'Demand Draft',
    title: `DD for ${favour} (₹${parseInt(amount).toLocaleString('en-IN')})`,
    accountNumber: city,
    date: new Date().toISOString().split('T')[0],
    status: 'Ready at Branch',
    statusClass: 'active',
    tracking: `Code: DD-OTP-${Math.floor(1000 + Math.random() * 9000)}`,
    details: `Payable at ${city}`
  };

  saveCustomerApplication(newApp);
  showToast(`Demand Draft generated! Collect at Branch with Ref: ${reqId}`, 'success');
  renderWorkspace('apply-services').then(() => {
    switchApplyServiceSubTab('track');
  });
};

function saveCustomerApplication(appObj) {
  const user = state.user || {};
  const storageKey = `cust_applications_${user.userId || user.id || 'default'}`;
  try {
    let list = JSON.parse(localStorage.getItem(storageKey) || '[]');
    list.unshift(appObj);
    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch(e) {}
}

// ==========================================
// RENDER CUSTOMER ACCOUNT STATEMENTS & PDF DOWNLOAD
// ==========================================

function computeStatementDataset(account, transactions, period = 'month', typeFilter = 'all') {
  const accNo = account.accountNumber;
  const accId = account.id;
  const currentBal = parseFloat(account.balance) || 0;

  // 1. Filter transactions strictly belonging to this account
  let accountTx = (transactions || []).filter(t => {
    return (t.toAccountId === accId ||
            t.fromAccountId === accId ||
            t.toAccountNumber === accNo ||
            t.fromAccountNumber === accNo ||
            t.accountId === accId ||
            t.accountNumber === accNo);
  });

  // Fallback demo transactions if account has no real transactions recorded
  if (accountTx.length === 0 && (!transactions || transactions.length === 0)) {
    accountTx = [
      { createdAt: '2026-08-20T10:30:00Z', type: 'deposit', category: 'Salary Transfer', description: 'NEFT/INW/AUG-SALARY/Tech Corp Ltd', amount: 65000, status: 'completed' },
      { createdAt: '2026-08-18T14:15:00Z', type: 'withdrawal', category: 'E-Commerce', description: 'POS/AMAZON INDIA/ORDER#89124', amount: 3499, status: 'completed' },
      { createdAt: '2026-08-16T18:45:00Z', type: 'withdrawal', category: 'Dining & Food', description: 'UPI/SWIGGY/BANGALORE/PAY892', amount: 850, status: 'completed' },
      { createdAt: '2026-08-14T09:20:00Z', type: 'withdrawal', category: 'Rent Payment', description: 'IMPS/P2P/AUG RENT/Rohan Kulkarni', amount: 18000, status: 'completed' },
      { createdAt: '2026-08-11T16:00:00Z', type: 'deposit', category: 'UPI Received', description: 'UPI/P2P/REFUND FROM DIALOGUE/CR', amount: 4500, status: 'completed' },
      { createdAt: '2026-08-08T11:10:00Z', type: 'withdrawal', category: 'ATM Cash', description: 'ATM WDL/CASH/CONNAUGHT PLACE BSB', amount: 5000, status: 'completed' },
      { createdAt: '2026-08-05T12:00:00Z', type: 'deposit', category: 'Interest Credit', description: 'SB INT CR Q1/AUTO CREDIT/BSB', amount: 1240, status: 'completed' },
      { createdAt: '2026-08-02T15:30:00Z', type: 'withdrawal', category: 'Utility Bill', description: 'BBPS/ELECTRICITY/BSES DELHI/9812', amount: 2450, status: 'completed' }
    ];
  }

  // 2. Separate completed transactions from blocked/failed/flagged
  const completedTx = accountTx.filter(t => {
    const isFailed = (t.status === 'flagged' || t.status === 'failed' || t.status === 'blocked' || t.status === 'rejected' || t.reconciliationStatus === 'failed');
    return !isFailed;
  });

  // Sort completed transactions chronologically (oldest first)
  completedTx.sort((a, b) => new Date(a.createdAt || a.postedAt || 0) - new Date(b.createdAt || b.postedAt || 0));

  // Determine Credit vs Debit relative to this account
  const parsedTx = completedTx.map(t => {
    let isCredit = false;
    if (t.toAccountId === accId || t.toAccountNumber === accNo) {
      isCredit = true;
    } else if (t.fromAccountId === accId || t.fromAccountNumber === accNo) {
      isCredit = false;
    } else if (t.type === 'deposit' || t.type === 'credit' || (t.category && t.category.toLowerCase().includes('interest'))) {
      isCredit = true;
    } else {
      isCredit = false;
    }

    const amount = Math.abs(parseFloat(t.amount) || 0);
    return {
      ...t,
      isCredit,
      drNum: isCredit ? 0 : amount,
      crNum: isCredit ? amount : 0,
      amountNum: amount,
      txDate: new Date(t.createdAt || t.postedAt || Date.now())
    };
  });

  // Calculate base initial opening balance before all completed transactions
  const totalLifetimeCr = parsedTx.reduce((sum, t) => sum + t.crNum, 0);
  const totalLifetimeDr = parsedTx.reduce((sum, t) => sum + t.drNum, 0);
  let initialOpeningBalance = Math.max(0, currentBal - totalLifetimeCr + totalLifetimeDr);
  initialOpeningBalance = Math.round(initialOpeningBalance * 100) / 100;

  // Filter transactions within selected period
  const now = new Date();
  let startDate = new Date(0);
  let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  let periodLabel = 'All Transactions (Full History)';

  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    periodLabel = 'Current Month (' + now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) + ')';
  } else if (period === '3months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    periodLabel = 'Last 3 Months (Q' + Math.ceil((now.getMonth() + 1) / 3) + ' ' + now.getFullYear() + ')';
  } else if (period === '6months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
    periodLabel = 'Last 6 Months';
  } else if (period === 'fy') {
    const fyStartYear = (now.getMonth() >= 3) ? now.getFullYear() : now.getFullYear() - 1;
    startDate = new Date(fyStartYear, 3, 1, 0, 0, 0, 0);
    periodLabel = `Financial Year (${fyStartYear}-${fyStartYear + 1})`;
  }

  // Calculate opening balance at start of period
  let periodOpeningBalance = initialOpeningBalance;
  const periodTx = [];

  for (const t of parsedTx) {
    if (t.txDate < startDate) {
      periodOpeningBalance += (t.crNum - t.drNum);
    } else if (t.txDate <= endDate) {
      periodTx.push(t);
    }
  }
  periodOpeningBalance = Math.round(periodOpeningBalance * 100) / 100;

  let totalPeriodDr = 0;
  let totalPeriodCr = 0;
  let runningBal = periodOpeningBalance;
  const statementRows = [];

  // 1. Explicit Opening Deposit / Balance Row
  const openDateStr = (account.createdAt && new Date(account.createdAt) > startDate)
    ? new Date(account.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : startDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  statementRows.push({
    isOpening: true,
    date: openDateStr,
    rawDate: startDate,
    particulars: 'Opening Deposit / Balance B/F',
    dr: '-',
    cr: '-',
    drNum: 0,
    crNum: 0,
    balance: `₹${periodOpeningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    balanceNum: periodOpeningBalance,
    badge: 'Opening Balance'
  });

  // 2. Transaction rows with running balance
  for (const t of periodTx) {
    totalPeriodDr += t.drNum;
    totalPeriodCr += t.crNum;
    runningBal = Math.round((runningBal + t.crNum - t.drNum) * 100) / 100;

    const dateStr = t.txDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const particulars = t.description || `${t.category || (t.isCredit ? 'Credit Deposit' : 'Debit Payment')} - Ref #${t.id || Math.floor(100000 + Math.random() * 900000)}`;

    statementRows.push({
      isOpening: false,
      date: dateStr,
      rawDate: t.txDate,
      particulars: particulars,
      dr: t.drNum > 0 ? `₹${t.drNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
      cr: t.crNum > 0 ? `₹${t.crNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
      drNum: t.drNum,
      crNum: t.crNum,
      balance: `₹${runningBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      balanceNum: runningBal,
      category: t.category,
      type: t.type,
      status: t.status || 'completed'
    });
  }

  // Filter display rows if requested
  let displayRows = statementRows;
  if (typeFilter === 'debit') {
    displayRows = statementRows.filter(r => r.drNum > 0);
  } else if (typeFilter === 'credit') {
    displayRows = statementRows.filter(r => r.crNum > 0 || r.isOpening);
  }

  return {
    account,
    openingBalance: periodOpeningBalance,
    totalDebits: totalPeriodDr,
    totalCredits: totalPeriodCr,
    closingBalance: runningBal,
    allRows: statementRows,
    displayRows: displayRows,
    period,
    periodLabel,
    typeFilter
  };
}

async function renderCustomerStatements(container, sum) {
  let user = state.user || {};
  try {
    const authMe = await apiCall('/api/auth/me');
    if (authMe && authMe.user) {
      user = { ...user, ...authMe.user };
      state.user = user;
    }
  } catch(e) {}

  window._customerDashboardSummary = sum;

  const accounts = (sum.accounts && sum.accounts.length > 0) ? [sum.accounts[0]] : [
    { id: 'acc-cust-1', accountNumber: '1000987654', balance: 155387.50, type: 'savings', status: 'active', createdAt: '2026-08-01T00:00:00Z' }
  ];
  const primaryAcc = accounts[0];
  const allTx = sum.allTransactions || sum.recentTransactions || [];

  const dataset = computeStatementDataset(primaryAcc, allTx, 'month', 'all');

  // Save current statement cache for PDF generation
  window._currentStatementData = {
    user,
    account: primaryAcc,
    openingBalance: dataset.openingBalance,
    totalCredits: dataset.totalCredits,
    totalDebits: dataset.totalDebits,
    closingBalance: dataset.closingBalance,
    rows: dataset.displayRows,
    allRows: dataset.allRows,
    periodLabel: dataset.periodLabel,
    generatedAt: new Date().toLocaleString('en-IN')
  };

  container.innerHTML = `
    <!-- Top Statements Header (Compact) -->
    <div class="card" style="background: #ffffff; border: 1px solid #f8dfc5; padding: 14px 18px; margin-bottom: 12px; border-radius: 10px; box-shadow: 0 2px 8px rgba(81, 6, 27, 0.04);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
            <h2 style="font-size: 1.05rem; font-weight: 800; color: #51061b; margin: 0;">Official Account Statements</h2>
            <span style="background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; font-weight: 700; font-size: 0.68rem; padding: 1px 6px; border-radius: 4px;">RBI Compliant</span>
          </div>
          <p style="color: #783545; font-size: 0.76rem; margin: 0;">
            Download and view detailed itemized ledger statement with opening deposit and running balance in official bank format.
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" onclick="downloadCustomerStatementPDF()" class="btn btn-primary" style="padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; background: #51061b; color: #fff2e3; border: none; cursor: pointer; box-shadow: 0 2px 8px rgba(81, 6, 27, 0.2);">
            Download PDF Statement
          </button>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #f8dfc5;">
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 3px; display: block;">Select Account</label>
          <select id="stmt-acc-select" onchange="filterCustomerStatement()" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem; font-weight: 600; background: #fff;">
            ${accounts.map(a => `<option value="${a.accountNumber}">${(a.type || 'Savings').toUpperCase()} - ${a.accountNumber} (₹${(parseFloat(a.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</option>`).join('')}
          </select>
        </div>

        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 3px; display: block;">Statement Period</label>
          <select id="stmt-period-select" onchange="filterCustomerStatement()" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem; font-weight: 600; background: #fff;">
            <option value="month" selected>Current Month (August 2026)</option>
            <option value="3months">Last 3 Months (Q3 2026)</option>
            <option value="6months">Last 6 Months</option>
            <option value="fy">Current Financial Year (2026-2027)</option>
            <option value="all">All Available Transactions</option>
          </select>
        </div>

        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #783545; text-transform: uppercase; margin-bottom: 3px; display: block;">Transaction Type</label>
          <select id="stmt-type-select" onchange="filterCustomerStatement()" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem; font-weight: 600; background: #fff;">
            <option value="all" selected>All Transactions (Dr. & Cr.)</option>
            <option value="debit">Debits (Dr. / Withdrawals) Only</option>
            <option value="credit">Credits (Cr. / Deposits) Only</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Financial Metrics Ribbon (Compact) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 12px;">
      <div class="card" style="padding: 10px 14px; border-radius: 8px; border: 1px solid #f8dfc5; background: #ffffff;">
        <div style="font-size: 0.68rem; font-weight: 700; color: #783545; text-transform: uppercase;">Opening Balance</div>
        <div id="stmt-metric-opening" style="font-size: 1.15rem; font-weight: 800; color: #51061b; margin-top: 2px;">₹${dataset.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>

      <div class="card" style="padding: 10px 14px; border-radius: 8px; border: 1px solid #fee2e8; background: #fff5f5;">
        <div style="font-size: 0.68rem; font-weight: 700; color: #dc2626; text-transform: uppercase;">Total Debits (Dr.)</div>
        <div id="stmt-metric-dr" style="font-size: 1.15rem; font-weight: 800; color: #dc2626; margin-top: 2px;">-₹${dataset.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>

      <div class="card" style="padding: 10px 14px; border-radius: 8px; border: 1px solid #dcfce7; background: #f0fdf4;">
        <div style="font-size: 0.68rem; font-weight: 700; color: #16a34a; text-transform: uppercase;">Total Credits (Cr.)</div>
        <div id="stmt-metric-cr" style="font-size: 1.15rem; font-weight: 800; color: #16a34a; margin-top: 2px;">+₹${dataset.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>

      <div class="card" style="padding: 10px 14px; border-radius: 8px; border: 1px solid #f8dfc5; background: #fef8f2;">
        <div style="font-size: 0.68rem; font-weight: 700; color: #51061b; text-transform: uppercase;">Closing Balance</div>
        <div id="stmt-metric-closing" style="font-size: 1.15rem; font-weight: 900; color: #15803d; margin-top: 2px;">₹${dataset.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    <!-- Live Statement Table in requested format: Date | Particulars | Dr. | Cr. | Balance -->
    <div class="card" style="padding: 14px 18px; border-radius: 10px; border: 1px solid #f8dfc5; background: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h3 style="font-size: 0.92rem; font-weight: 800; color: #51061b; margin: 0;">Account Statement Ledger</h3>
          <span id="stmt-count-label" style="font-size: 0.72rem; color: #783545;">(Showing ${dataset.displayRows.length} entries including Opening Balance)</span>
        </div>
        <div style="font-size: 0.72rem; font-weight: 600; color: #783545;">
          Format: <code>Date | Particulars | Dr. | Cr. | Balance</code>
        </div>
      </div>

      <div class="table-wrapper" style="border: 1px solid #f8dfc5; border-radius: 8px; overflow: hidden;">
        <table id="customer-statement-table" style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
          <thead>
            <tr style="background: #fdf7ef; border-bottom: 1px solid #f8dfc5;">
              <th style="padding: 8px 10px; text-align: left; font-weight: 700; font-size: 0.7rem; color: #783545; width: 15%; text-transform: uppercase;">Date</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 700; font-size: 0.7rem; color: #783545; width: 45%; text-transform: uppercase;">Particulars</th>
              <th style="padding: 8px 10px; text-align: right; font-weight: 700; font-size: 0.7rem; color: #dc2626; width: 13%; text-transform: uppercase;">Dr. (₹)</th>
              <th style="padding: 8px 10px; text-align: right; font-weight: 700; font-size: 0.7rem; color: #16a34a; width: 13%; text-transform: uppercase;">Cr. (₹)</th>
              <th style="padding: 8px 10px; text-align: right; font-weight: 700; font-size: 0.7rem; color: #51061b; width: 14%; text-transform: uppercase;">Balance (₹)</th>
            </tr>
          </thead>
          <tbody id="customer-statement-tbody">
            ${dataset.displayRows.map(r => `
              <tr style="border-bottom: 1px solid #fef3e7; ${r.isOpening ? 'background: #fdfcff; font-weight: 600;' : ''}">
                <td style="padding: 7px 10px; color: #475569;">${r.date}</td>
                <td style="padding: 7px 10px; color: #1e293b;">
                  <strong>${r.particulars}</strong>
                  ${r.isOpening ? '<span style="font-size:0.62rem; margin-left:6px; padding:1px 5px; background:#f0fdf4; color:#16a34a; border-radius:4px; font-weight:700;">Opening Bal</span>' : ''}
                </td>
                <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #dc2626;">${r.dr || '-'}</td>
                <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #16a34a;">${r.cr || '-'}</td>
                <td style="padding: 7px 10px; text-align: right; font-weight: 800; color: #51061b;">${r.balance}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 12px; padding: 8px 12px; background: #fdf7ef; border: 1px solid #f8dfc5; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 0.72rem; color: #783545;">
        <span><strong>Bank Guarantee:</strong> This statement is authentic and recognized as valid financial proof.</span>
        <button type="button" onclick="downloadCustomerStatementPDF()" style="background: none; border: none; font-weight: 700; color: #51061b; cursor: pointer; text-decoration: underline;">
          Download Official PDF Copy →
        </button>
      </div>
    </div>
  `;
}

window.filterCustomerStatement = function() {
  const sum = window._customerDashboardSummary || {};
  const accounts = (sum.accounts && sum.accounts.length > 0) ? [sum.accounts[0]] : [
    { id: 'acc-cust-1', accountNumber: '1000987654', balance: 155387.50, type: 'savings', status: 'active', createdAt: '2026-08-01T00:00:00Z' }
  ];
  const allTx = sum.allTransactions || sum.recentTransactions || [];

  const selectedAccNo = document.getElementById('stmt-acc-select')?.value || accounts[0].accountNumber;
  const selectedPeriod = document.getElementById('stmt-period-select')?.value || 'month';
  const selectedType = document.getElementById('stmt-type-select')?.value || 'all';

  const currentAcc = accounts.find(a => a.accountNumber === selectedAccNo) || accounts[0];
  const dataset = computeStatementDataset(currentAcc, allTx, selectedPeriod, selectedType);

  // Update cached statement data for PDF download
  window._currentStatementData = {
    user: state.user || {},
    account: currentAcc,
    openingBalance: dataset.openingBalance,
    totalCredits: dataset.totalCredits,
    totalDebits: dataset.totalDebits,
    closingBalance: dataset.closingBalance,
    rows: dataset.displayRows,
    allRows: dataset.allRows,
    periodLabel: dataset.periodLabel,
    generatedAt: new Date().toLocaleString('en-IN')
  };

  // Update Metrics Ribbon elements
  const openElem = document.getElementById('stmt-metric-opening');
  const drElem = document.getElementById('stmt-metric-dr');
  const crElem = document.getElementById('stmt-metric-cr');
  const closeElem = document.getElementById('stmt-metric-closing');
  const countLabel = document.getElementById('stmt-count-label');

  if (openElem) openElem.innerText = `₹${dataset.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  if (drElem) drElem.innerText = `-₹${dataset.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  if (crElem) crElem.innerText = `+₹${dataset.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  if (closeElem) closeElem.innerText = `₹${dataset.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  if (countLabel) countLabel.innerText = `(Showing ${dataset.displayRows.length} entries including Opening Balance)`;

  // Update Table Body
  const tbody = document.getElementById('customer-statement-tbody');
  if (tbody) {
    tbody.innerHTML = dataset.displayRows.map(r => `
      <tr style="border-bottom: 1px solid #fef3e7; ${r.isOpening ? 'background: #fdfcff; font-weight: 600;' : ''}">
        <td style="padding: 7px 10px; color: #475569;">${r.date}</td>
        <td style="padding: 7px 10px; color: #1e293b;">
          <strong>${r.particulars}</strong>
          ${r.isOpening ? '<span style="font-size:0.62rem; margin-left:6px; padding:1px 5px; background:#f0fdf4; color:#16a34a; border-radius:4px; font-weight:700;">Opening Bal</span>' : ''}
        </td>
        <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #dc2626;">${r.dr || '-'}</td>
        <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #16a34a;">${r.cr || '-'}</td>
        <td style="padding: 7px 10px; text-align: right; font-weight: 800; color: #51061b;">${r.balance}</td>
      </tr>
    `).join('');
  }
};

window.downloadCustomerStatementPDF = function() {
  const data = window._currentStatementData;
  if (!data) {
    showToast('Unable to prepare PDF statement. Please refresh.', 'danger');
    return;
  }

  try {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      window.print();
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const user = data.user || {};
    const acc = data.account || {};
    const rawBranch = user.branchId === 'b-kolkata' ? 'Kolkata Park Street Branch' :
                      user.branchId === 'b-mumbai' ? 'Mumbai Fort Branch' :
                      'New Delhi Connaught Place Branch';
    const ifsc = user.branchId === 'b-kolkata' ? 'SBIN0007001' : user.branchId === 'b-mumbai' ? 'SBIN0002001' : 'SBIN0001001';

    // 1. Bank Top Header Bar (Deep Maroon #51061b: RGB [81, 6, 27])
    doc.setFillColor(81, 6, 27);
    doc.rect(0, 0, 210, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BHARATIYA SARVODAYA BANK', 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(248, 223, 197); // Cream #f8dfc5
    doc.text('CENTRAL RETAIL INTERNET BANKING DIVISION • RESERVE BANK OF INDIA (RBI) REGULATED', 14, 16.5);
    doc.text('ISO 27001:2022 CERTIFIED SECURE BANKING SYSTEM', 14, 21.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('STATEMENT OF ACCOUNT', 196, 15, { align: 'right' });

    // 2. Account & Customer Details Box (Cream background #fef8f2 with border #f8dfc5)
    doc.setFillColor(254, 248, 242);
    doc.setDrawColor(248, 223, 197);
    doc.roundedRect(14, 30, 182, 38, 2, 2, 'FD');

    // Left Column
    doc.setTextColor(81, 6, 27);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Name:', 18, 37);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(user.fullName || 'Aarav Mehta', 50, 37);

    doc.setTextColor(81, 6, 27);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer ID:', 18, 43);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(user.userId || user.id || 'NX@MEHTA001', 50, 43);

    doc.setTextColor(81, 6, 27);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Number:', 18, 49);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(acc.accountNumber || '1000987654', 50, 49);

    doc.setTextColor(81, 6, 27);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Scheme:', 18, 55);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(((acc.type || 'Savings') + ' Account').toUpperCase(), 50, 55);

    doc.setTextColor(81, 6, 27);
    doc.setFont('helvetica', 'bold');
    doc.text('Registered Mobile:', 18, 61);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(user.mobileNumber || '+91 9820123456', 50, 61);

    // Right Column
    doc.setTextColor(81, 6, 27);
    doc.setFont('helvetica', 'bold');
    doc.text('Home Branch:', 110, 37);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(rawBranch, 138, 37);

    doc.setTextColor(81, 6, 27);
    doc.setFont('helvetica', 'bold');
    doc.text('IFSC Code:', 110, 43);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(ifsc, 138, 43);

    doc.setTextColor(81, 6, 27);
    doc.setFont('helvetica', 'bold');
    doc.text('Statement Period:', 110, 49);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(data.periodLabel || 'Current Month (August 2026)', 138, 49);

    doc.setTextColor(81, 6, 27);
    doc.setFont('helvetica', 'bold');
    doc.text('Generated On:', 110, 55);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(data.generatedAt || new Date().toLocaleDateString('en-IN'), 138, 55);

    doc.setTextColor(81, 6, 27);
    doc.setFont('helvetica', 'bold');
    doc.text('Currency:', 110, 61);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text('INR (Indian Rupee - Rs.)', 138, 61);

    // 3. Summary Metrics Ribbon
    doc.setFillColor(253, 247, 239);
    doc.setDrawColor(248, 223, 197);
    doc.rect(14, 71, 182, 11, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(81, 6, 27);
    doc.text(`Opening Balance: Rs. ${data.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 18, 78);
    doc.text(`Total Dr.: Rs. ${data.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 74, 78);
    doc.text(`Total Cr.: Rs. ${data.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 120, 78);
    doc.text(`Closing: Rs. ${data.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 160, 78);

    // 4. AutoTable in requested format: Date | Particulars | Dr. | Cr. | Balance
    const tableBody = data.rows.map(r => [
      r.date,
      r.particulars,
      r.dr ? r.dr.replace('₹', 'Rs. ') : '-',
      r.cr ? r.cr.replace('₹', 'Rs. ') : '-',
      r.balance.replace('₹', 'Rs. ')
    ]);

    doc.autoTable({
      startY: 85,
      head: [['Date', 'Particulars', 'Dr. (Rs.)', 'Cr. (Rs.)', 'Balance (Rs.)']],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.8,
        textColor: [30, 41, 59],
        lineColor: [248, 223, 197],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [81, 6, 27], // SBI Deep Maroon #51061b
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 26, halign: 'left' },
        1: { cellWidth: 80, halign: 'left' },
        2: { cellWidth: 24, halign: 'right', textColor: [220, 38, 38] }, // Red for Dr.
        3: { cellWidth: 24, halign: 'right', textColor: [22, 101, 52] }, // Green for Cr.
        4: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [81, 6, 27] }
      },
      alternateRowStyles: {
        fillColor: [254, 248, 242]
      },
      margin: { left: 14, right: 14 }
    });

    // 5. Official Bank Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    if (finalY < 270) {
      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 53, 69);
      doc.text('This is a system-generated electronic account statement from Bharatiya Sarvodaya Bank Core Banking Server.', 14, finalY);
      doc.text('No physical signature is required under the Information Technology Act, 2000. For queries, contact your home branch.', 14, finalY + 4);

      doc.setDrawColor(248, 223, 197);
      doc.line(14, finalY + 7, 196, finalY + 7);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(81, 6, 27);
      doc.text(`Verification Ref: SBI-STMT-${acc.accountNumber || '1000987654'}-${Date.now().toString(36).toUpperCase()}`, 14, finalY + 12);
      doc.text('Page 1 of 1', 196, finalY + 12, { align: 'right' });
    }

    // Trigger instant download with requested SBI naming convention
    doc.save(`SBI_Statement_${acc.accountNumber || '1000987654'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('PDF Statement downloaded successfully.', 'success');
  } catch (err) {
    console.error('PDF Generation Error:', err);
    showToast('Failed to generate PDF. Opening print view...', 'warning');
    window.print();
  }
};

window.exportCustomerStatementCSV = function() {
  const data = window._currentStatementData;
  if (!data) return;
  let csv = 'Date,Particulars,Dr.,Cr.,Balance\n';
  data.rows.forEach(r => {
    const desc = (r.particulars || '').replace(/"/g, '""');
    const dr = r.drNum > 0 ? r.drNum.toFixed(2) : '';
    const cr = r.crNum > 0 ? r.crNum.toFixed(2) : '';
    const bal = r.balanceNum !== undefined ? r.balanceNum.toFixed(2) : (r.balance || '').replace('₹', '').replace(/,/g, '');
    csv += `"${r.date}","${desc}","${dr}","${cr}","${bal}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SBI_Statement_${data.account?.accountNumber || '1000987654'}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Statement CSV exported!', 'success');
};

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
              Branch Customer Database
            </h2>
            <p style="margin: 3px 0 0 0; color: var(--text-secondary); font-size: 0.84rem;">
              Scoped Customer Registry & Accounts for <strong>${branch.name || 'HQ Branch'} (${branch.code || ''})</strong>
            </p>
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            ${!isSuperAdmin ? `
              <!-- PROMINENT CREATE ACCOUNT BUTTON FOR BRANCH STAFF -->
              <button class="btn btn-primary" onclick="openBranchCustomerModal()" style="padding: 8px 16px; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.25); border: none; cursor: pointer;">
                + Create Account / Onboard Customer
              </button>
            ` : ''}

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
              Customers Managed by Branch
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
                  <th style="padding: 10px 12px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Actions</th>
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
                        <button style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; cursor: pointer;" onclick="viewCustomerProfile('${c.id}')">Profile</button>
                        <button style="padding: 4px 10px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; cursor: pointer;" onclick="viewCustomerAccounts('${c.id}')">Accounts</button>
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
      <div style="background: var(--bg-card, #ffffff); width: 90%; max-width: 650px; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); color: var(--text-primary);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
          <h2 style="margin: 0; font-size: 1.25rem;">Create Account / Onboard Branch Customer</h2>
          <button onclick="closeBranchCustomerModal()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer;">✕</button>
        </div>
        <form id="onboard-branch-customer-form" onsubmit="submitBranchCustomerForm(event)">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Full Name *</label>
              <input type="text" id="ob-fullname" required placeholder="e.g. Ramesh Kumar" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Email Address *</label>
              <input type="email" id="ob-email" required placeholder="ramesh@gmail.com" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Mobile Number *</label>
              <input type="text" id="ob-mobile" required placeholder="+91 9810012345" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Customer's PAN Number *</label>
              <input type="text" id="ob-pan" required placeholder="ABCDE1234F" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem; text-transform: uppercase;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Date of Birth (DOB) *</label>
              <input type="date" id="ob-dob" required value="1992-05-15" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">S/D/H/W/o *</label>
              <input type="text" id="ob-sdhwo" required placeholder="S/o Suresh Kumar" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;" />
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Mode of Operation (MOP) *</label>
              <select id="ob-mop" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                <option value="Self">Self</option>
                <option value="Either or Survivor">Either or Survivor</option>
                <option value="Former or Survivor">Former or Survivor</option>
                <option value="Jointly Operated">Jointly Operated</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Account Type *</label>
              <select id="ob-acctype" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Initial Deposit Amount (₹) *</label>
              <input type="number" id="ob-deposit" required value="2000" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;" />
            </div>
            <div style="grid-column: span 2;">
              <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">Residential Address</label>
              <input type="text" id="ob-address" placeholder="Full residential street address" style="width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;" />
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" onclick="closeBranchCustomerModal()" class="btn btn-secondary" style="padding: 8px 16px;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="padding: 8px 18px; font-weight: 700;">Open Account & Onboard</button>
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
            <h2 style="margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">Customer Profile - ${cust.fullName}</h2>
            <div style="display: flex; align-items: center; gap: 10px;">
              <button type="button" onclick="toggleInlineProfileEdit()" style="padding: 5px 12px; font-weight: 700; font-size: 0.78rem; border-radius: 6px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                Edit Profile
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
            <h4 style="margin: 0 0 10px 0; font-size: 0.88rem; font-weight: 700; color: #0f172a;">Edit Customer Profile (Email, Phone No & Address)</h4>
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
                <button type="submit" style="padding: 5px 16px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; border: none; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #fff; cursor: pointer;">Save Changes</button>
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
      <div id="branch-customer-modal-container" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(2px);" onclick="if(event.target===this) closeBranchCustomerModal()">
        <div style="background: var(--bg-card, #ffffff); width: 92%; max-width: 820px; border-radius: 12px; padding: 20px 24px; color: var(--text-primary); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 8px;">
            <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">Branch Accounts - ${cust.fullName}</h2>
            <button type="button" onclick="closeBranchCustomerModal()" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #64748b; font-weight: bold; line-height: 1;">✕</button>
          </div>

          <div style="margin-bottom: 12px; font-size: 0.75rem; color: #475569; background: #f0f9ff; padding: 6px 12px; border-radius: 6px; border: 1px solid #bae6fd; display: flex; align-items: center; gap: 6px;">
            <span>Click on any <strong>Account Number</strong> below to view its complete <strong>Transaction History & Statement Ledger</strong>.</span>
          </div>

          <div style="margin-bottom: 16px; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left;">
                  <th style="padding: 8px 10px; font-size: 0.7rem; font-weight: 700; color: #475569; white-space: nowrap; text-transform: uppercase;">ACCOUNT TYPE</th>
                  <th style="padding: 8px 10px; font-size: 0.7rem; font-weight: 700; color: #475569; white-space: nowrap; text-transform: uppercase;">ACCOUNT NUMBER</th>
                  <th style="padding: 8px 10px; font-size: 0.7rem; font-weight: 700; color: #475569; white-space: nowrap; text-transform: uppercase;">MOP</th>
                  <th style="padding: 8px 10px; font-size: 0.7rem; font-weight: 700; color: #475569; white-space: nowrap; text-transform: uppercase;">BALANCE</th>
                  <th style="padding: 8px 10px; font-size: 0.7rem; font-weight: 700; color: #475569; white-space: nowrap; text-transform: uppercase;">ACCOUNT ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                ${(cust.accounts && cust.accounts.length > 0) ? cust.accounts.map(a => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 10px; white-space: nowrap; vertical-align: middle;"><span style="font-weight: 700; color: #0284c7; text-transform: uppercase; font-size: 0.78rem;">${a.type}</span></td>
                    <td style="padding: 8px 10px; white-space: nowrap; vertical-align: middle;">
                      <button type="button" onclick="openAccountTransactionHistory('${a.accountNumber}', '${cust.id}')" title="Click to view full transaction ledger & statement" style="background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.25); color: #1d4ed8; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; transition: all 0.15s ease;" onmouseover="this.style.background='#dbeafe'; this.style.borderColor='#93c5fd';" onmouseout="this.style.background='rgba(37,99,235,0.08)'; this.style.borderColor='rgba(37,99,235,0.25)';">
                        <span>${a.accountNumber}</span>
                        <span style="font-size: 0.68rem; color: #2563eb; font-weight: 600; background: #ffffff; padding: 1px 5px; border-radius: 4px; border: 1px solid #bfdbfe; white-space: nowrap;">View History</span>
                      </button>
                    </td>
                    <td style="padding: 8px 10px; white-space: nowrap; vertical-align: middle;"><span style="background: #e0e7ff; color: #4338ca; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 0.72rem; display: inline-block; white-space: nowrap;">${a.mopType || 'Self'}</span></td>
                    <td style="padding: 8px 10px; color: #059669; font-weight: 800; font-size: 0.85rem; white-space: nowrap; vertical-align: middle;">₹${parseFloat(a.balance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td style="padding: 8px 10px; white-space: nowrap; vertical-align: middle;">
                      <div style="display: flex; gap: 6px; align-items: center; flex-wrap: nowrap;">
                        ${cust.status === 'frozen' ? `
                          <button type="button" style="padding: 4px 8px; font-size: 0.72rem; font-weight: 600; border-radius: 6px; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; cursor: pointer; white-space: nowrap;" onclick="toggleCustomerFreezeAction('${cust.id}', 'frozen')">Unfreeze</button>
                        ` : `
                          <button type="button" style="padding: 4px 8px; font-size: 0.72rem; font-weight: 600; border-radius: 6px; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; cursor: pointer; white-space: nowrap;" onclick="toggleCustomerFreezeAction('${cust.id}', 'active')">Freeze</button>
                        `}
                        <button type="button" style="padding: 4px 8px; font-size: 0.72rem; font-weight: 600; border-radius: 6px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; cursor: pointer; white-space: nowrap;" onclick="deleteCustomerAction('${cust.id}', 'Account ${a.accountNumber} (${cust.fullName})')">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('') : `
                  <tr><td colSpan="5" style="text-align: center; padding: 18px; color: #64748b; font-size: 0.78rem;">No branch accounts linked to this customer.</td></tr>
                `}
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.76rem; font-weight: 600; color: #475569;">
              Account Status: <span style="color: ${cust.status === 'active' ? '#15803d' : '#b91c1c'}; font-weight: 700;">● ${(cust.status || 'active').toUpperCase()}</span>
            </div>
            <button type="button" onclick="closeBranchCustomerModal()" class="btn btn-secondary" style="padding: 5px 16px; font-size: 0.78rem; font-weight: 600; cursor: pointer;">Close</button>
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

window.openAccountTransactionHistory = async function(accountNumber, customerId) {
  try {
    let acc = {};
    let cust = {};
    let txList = [];

    try {
      const data = await apiCall(`/api/accounts/${accountNumber}/transactions`, 'GET', null, true);
      if (data && data.account) {
        acc = data.account;
        cust = data.customer || {};
        txList = data.transactions || [];
      }
    } catch (apiErr) {
      console.warn('Direct account transactions endpoint fallback:', apiErr.message);
      const activeBranchId = state.selectedBranchId || state.user?.branchId || 'b-delhi';
      const custData = await apiCall(`/api/branches/${activeBranchId}/customers`, 'GET', null, true).catch(() => apiCall('/api/branch-customers', 'GET', null, true)).catch(() => ({ customers: [] }));
      const foundCust = (custData.customers || []).find(c => (c.accounts || []).some(a => a.accountNumber === accountNumber || a.id === accountNumber) || c.id === customerId || c.userId === customerId);
      if (foundCust) {
        cust = foundCust;
        acc = (foundCust.accounts || []).find(a => a.accountNumber === accountNumber || a.id === accountNumber) || (foundCust.accounts && foundCust.accounts[0]) || { accountNumber, balance: foundCust.balance || 0, type: 'SAVINGS' };
      }
    }

    if (!acc.accountNumber) acc.accountNumber = accountNumber;
    if (!acc.branchName) acc.branchName = 'Connaught Place Branch';
    if (!acc.ifscCode) acc.ifscCode = 'BSB0000DEL1';
    if (!acc.micrCode) acc.micrCode = '110024001';

    window._currentAccountTransactionsCache = { acc, cust, txList };

    const modalHtml = `
      <div id="account-tx-modal-container" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px);" onclick="if(event.target===this) closeAccountTxModal()">
        <div style="background: var(--bg-card, #ffffff); width: 95%; max-width: 960px; max-height: 90vh; display: flex; flex-direction: column; border-radius: 12px; padding: 16px 20px; color: var(--text-primary); box-shadow: 0 20px 45px rgba(0,0,0,0.35); overflow: hidden;">
          
          <!-- Header Bar -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a;">
                  Transaction History & Statement Ledger
                </h2>
              </div>
              <p style="margin: 2px 0 0 0; color: #64748b; font-size: 0.74rem;">
                Account No: <strong style="font-family: monospace; color: #1d4ed8; font-size: 0.82rem;">${acc.accountNumber}</strong> &bull; Customer: <strong>${cust.fullName || 'Customer'}</strong> (${cust.userId || ''}) &bull; ${acc.branchName || 'Connaught Place Branch'}
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              ${customerId ? `
                <button type="button" onclick="closeAccountTxModal(); viewCustomerAccounts('${customerId}')" style="padding: 4px 10px; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; cursor: pointer; white-space: nowrap;">
                  ← Back to Accounts
                </button>
              ` : ''}
              <button type="button" onclick="closeAccountTxModal()" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #64748b; font-weight: bold; line-height: 1;">✕</button>
            </div>
          </div>

          <!-- Account Overview Cards (4 compact stats) -->
          <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px;">
            <div style="background: rgba(16, 185, 129, 0.06); padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.2);">
              <span style="font-size: 0.62rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;">Available Balance</span>
              <div style="font-size: 0.95rem; font-weight: 800; color: #047857; margin-top: 1px; white-space: nowrap;">
                ₹${(parseFloat(acc.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style="background: rgba(37, 99, 235, 0.06); padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(37, 99, 235, 0.2);">
              <span style="font-size: 0.62rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;">Account Type / MOP</span>
              <div style="font-size: 0.78rem; font-weight: 800; color: #1e40af; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${(acc.type || 'SAVINGS').toUpperCase()} • ${acc.mopType || 'Self'}">
                ${(acc.type || 'SAVINGS').toUpperCase()} &bull; ${acc.mopType || 'Self'}
              </div>
            </div>
            <div style="background: rgba(99, 102, 241, 0.06); padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(99, 102, 241, 0.2);">
              <span style="font-size: 0.62rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;">IFSC & MICR Code</span>
              <div style="font-size: 0.74rem; font-family: monospace; font-weight: 700; color: #4338ca; margin-top: 1px; white-space: nowrap;">
                ${acc.ifscCode || 'BSB0000DEL1'} / ${acc.micrCode || '110024001'}
              </div>
            </div>
            <div style="background: rgba(245, 158, 11, 0.06); padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.2);">
              <span style="font-size: 0.62rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;">Status & Activity</span>
              <div style="font-size: 0.76rem; font-weight: 800; color: #b45309; margin-top: 1px; white-space: nowrap;">
                ● ${(acc.status || 'ACTIVE').toUpperCase()} &bull; ${txList.length} Txns
              </div>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 200px;">
              <input type="text" id="acc-tx-search-input" placeholder="Search by description, reference ID or category..." oninput="filterAccountTxTable()" style="width: 100%; padding: 4px 8px; font-size: 0.74rem; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff;">
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <select id="acc-tx-type-filter" onchange="filterAccountTxTable()" style="padding: 4px 8px; font-size: 0.74rem; border-radius: 6px; border: 1px solid #cbd5e1; font-weight: 600; background: #ffffff; cursor: pointer;">
                <option value="ALL">All Entries</option>
                <option value="CR">Credits Only (Deposits)</option>
                <option value="DR">Debits Only (Withdrawals / Transfers)</option>
              </select>
              <button type="button" onclick="printAccountStatement()" style="padding: 4px 10px; font-size: 0.74rem; font-weight: 700; border-radius: 6px; background: #047857; color: #ffffff; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                Print Statement
              </button>
            </div>
          </div>

          <!-- Transaction Ledger Table Container -->
          <div style="flex: 1; overflow-y: auto; max-height: 380px; border: 1px solid #e2e8f0; border-radius: 6px;">
            <table id="acc-tx-table" style="width: 100%; border-collapse: collapse; font-size: 0.74rem;">
              <thead style="position: sticky; top: 0; z-index: 5;">
                <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; text-align: left;">
                  <th style="padding: 6px 8px; font-size: 0.68rem; font-weight: 700; color: #334155; text-transform: uppercase; white-space: nowrap;">DATE & TIME</th>
                  <th style="padding: 6px 8px; font-size: 0.68rem; font-weight: 700; color: #334155; text-transform: uppercase; white-space: nowrap;">TXN REF / ID</th>
                  <th style="padding: 6px 8px; font-size: 0.68rem; font-weight: 700; color: #334155; text-transform: uppercase; white-space: nowrap;">PARTICULARS / DESCRIPTION</th>
                  <th style="padding: 6px 8px; font-size: 0.68rem; font-weight: 700; color: #334155; text-transform: uppercase; white-space: nowrap;">TYPE</th>
                  <th style="padding: 6px 8px; font-size: 0.68rem; font-weight: 700; color: #b91c1c; text-transform: uppercase; text-align: right; white-space: nowrap;">DEBIT (DR)</th>
                  <th style="padding: 6px 8px; font-size: 0.68rem; font-weight: 700; color: #047857; text-transform: uppercase; text-align: right; white-space: nowrap;">CREDIT (CR)</th>
                  <th style="padding: 6px 8px; font-size: 0.68rem; font-weight: 700; color: #334155; text-transform: uppercase; text-align: center; white-space: nowrap;">STATUS</th>
                </tr>
              </thead>
              <tbody id="acc-tx-tbody">
                ${txList.length === 0 ? `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 6px 8px; color: #64748b; white-space: nowrap;">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style="padding: 6px 8px; white-space: nowrap;"><code style="font-size: 0.7rem; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">TXN-INIT-OPEN</code></td>
                    <td style="padding: 6px 8px; font-size: 0.74rem;"><b>Initial Core Account Deposit & Opening Ledger</b></td>
                    <td style="padding: 6px 8px; white-space: nowrap;"><span style="background: #f0fdf4; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 0.68rem;">Deposit</span></td>
                    <td style="padding: 6px 8px; text-align: right; color: #94a3b8; white-space: nowrap;">-</td>
                    <td style="padding: 6px 8px; text-align: right; color: #047857; font-weight: 800; font-size: 0.78rem; white-space: nowrap;">₹${(parseFloat(acc.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style="padding: 6px 8px; text-align: center; white-space: nowrap;"><span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;">Completed</span></td>
                  </tr>
                ` : txList.map(t => {
                  const isDebit = t.direction === 'DR';
                  const dStr = new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  return `
                    <tr style="border-bottom: 1px solid #f1f5f9;" data-type="${t.direction}" data-text="${(t.description + ' ' + t.referenceNumber + ' ' + t.category).toLowerCase()}">
                      <td style="padding: 6px 8px; color: #475569; white-space: nowrap;">${dStr}</td>
                      <td style="padding: 6px 8px; white-space: nowrap;"><code style="font-size: 0.7rem; color: #0284c7; background: #f0f9ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #bae6fd; white-space: nowrap;">${t.referenceNumber || t.id}</code></td>
                      <td style="padding: 6px 8px;">
                        <div style="font-weight: 600; color: #0f172a; font-size: 0.74rem;">${t.description}</div>
                        <div style="font-size: 0.68rem; color: #64748b;">Category: ${t.category}</div>
                      </td>
                      <td style="padding: 6px 8px; white-space: nowrap;"><span style="background: ${isDebit ? '#fef2f2' : '#f0fdf4'}; color: ${isDebit ? '#b91c1c' : '#15803d'}; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.68rem;">${isDebit ? 'DEBIT' : 'CREDIT'}</span></td>
                      <td style="padding: 6px 8px; text-align: right; color: #b91c1c; font-weight: 700; font-size: 0.76rem; white-space: nowrap;">${isDebit ? '₹' + t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                      <td style="padding: 8px 8px; text-align: right; color: #047857; font-weight: 800; font-size: 0.78rem; white-space: nowrap;">${!isDebit ? '₹' + t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                      <td style="padding: 6px 8px; text-align: center; white-space: nowrap;"><span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;">${t.status}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Bottom Footer Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            <span style="font-size: 0.72rem; color: #64748b;">
              Authenticated Core Banking (CBS) Statement Ledger &bull; Real-time audit logs synced.
            </span>
            <button type="button" onclick="closeAccountTxModal()" class="btn btn-secondary" style="padding: 4px 14px; font-size: 0.74rem; font-weight: 600; cursor: pointer;">
              Close Window
            </button>
          </div>

        </div>
      </div>
    `;

    let existing = document.getElementById('account-tx-modal-container');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (err) {
    showToast(err.message || 'Failed to retrieve account transactions', 'danger');
  }
};

window.closeAccountTxModal = function() {
  const modal = document.getElementById('account-tx-modal-container');
  if (modal) modal.remove();
};

window.filterAccountTxTable = function() {
  const query = (document.getElementById('acc-tx-search-input')?.value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('acc-tx-type-filter')?.value || 'ALL';
  const rows = document.querySelectorAll('#acc-tx-tbody tr');

  rows.forEach(r => {
    const rowType = r.getAttribute('data-type');
    const rowText = r.getAttribute('data-text') || '';
    const matchType = (typeFilter === 'ALL' || rowType === typeFilter);
    const matchQuery = !query || rowText.includes(query);
    if (matchType && matchQuery) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
};

window.printAccountStatement = function() {
  const cache = window._currentAccountTransactionsCache;
  if (!cache) return showToast('Statement data not loaded.', 'warning');
  window.print();
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
