const { execSync } = require('child_process');

const ports = [3001, 3002, 3003, 5000, 5001, 5002, 5003];
console.log('Cleaning BSB banking ecosystem ports...');

ports.forEach(port => {
  try {
    const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { shell: 'cmd.exe' }).toString();
    const lines = output.split(/\r?\n/);
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1] ? parts[parts.length - 1].trim() : '';
      if (pid && pid !== '0' && pid !== process.pid.toString() && /^\d+$/.test(pid)) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { shell: 'cmd.exe', stdio: 'ignore' });
          console.log(`Freed port ${port} (PID ${pid})`);
        } catch (e) {}
      }
    });
  } catch (e) {}
});

console.log('All bank ports are free.');
