/**
 * BSB Banking Ecosystem - Unified Startup Engine
 * Starts all 3 independent Banking Portals (Frontends & Backends) cleanly.
 */

console.log('=================================================================');
console.log('🏛️  BHARATIYA SARVODAYA BANK (BSB) - COMPLETE ECOSYSTEM LAUNCHER');
console.log('=================================================================');

// Load all 3 Frontend & Backend Portals
require('./headquarter/frontend/server.js');
require('./branches_and_employees/frontend/server.js');
require('./customers/frontend/server.js');

setTimeout(() => {
  console.log('\n-----------------------------------------------------------------');
  console.log('✨ ALL 3 BANKING PORTALS ARE READY IN YOUR BROWSER:');
  console.log('👉 Headquarter Core Console  : http://localhost:3001');
  console.log('👉 Branch CBS Staff Terminal : http://localhost:3002');
  console.log('👉 Retail NetBanking Portal  : http://localhost:3003');
  console.log('-----------------------------------------------------------------\n');
}, 1000);
