const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Kill ports 3000, 5000, 5173
const ports = [3000, 5000, 5173];
ports.forEach(port => {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      if (result) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            } catch (e) {
              // Process might already be killed
            }
          }
        });
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch (e) {
    // Port not in use, continue
  }
});

// Check and install root dependencies first
if (!fs.existsSync(path.join(__dirname, '../node_modules'))) {
  console.log('Installing root dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
}

// Check if node_modules exist
if (!fs.existsSync(path.join(__dirname, '../backend/node_modules'))) {
  console.log('Installing backend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, '../backend'), stdio: 'inherit' });
}

if (!fs.existsSync(path.join(__dirname, '../frontend/node_modules'))) {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, '../frontend'), stdio: 'inherit' });
}

// Seed default users if they don't exist
try {
  execSync('npm run seed', { cwd: path.join(__dirname, '../backend'), stdio: 'ignore' });
} catch (e) {
  // Seed might fail if users exist, that's okay
}

// Start both servers
const concurrently = require('concurrently');
concurrently([
  { command: 'npm run dev', name: 'backend', prefixColor: 'blue', cwd: path.join(__dirname, '../backend') },
  { command: 'npm run dev', name: 'frontend', prefixColor: 'green', cwd: path.join(__dirname, '../frontend') }
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
  restartTries: 1
});
