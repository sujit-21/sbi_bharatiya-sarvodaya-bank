const db = require('../db/database');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../db/backups');

// Core Health APIs
function getHealth(req, res) {
  return res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
}

function getStatus(req, res) {
  const accounts = db.find('accounts');
  const tx = db.find('transactions');
  const users = db.find('users');

  return res.status(200).json({
    status: 'online',
    version: '1.0.0-enterprise',
    uptime: process.uptime(),
    dbStats: {
      totalUsers: users.length,
      totalAccounts: accounts.length,
      totalTransactions: tx.length
    }
  });
}

function getVersion(req, res) {
  return res.status(200).json({ name: 'bsb-banking-core', version: '1.0.0-enterprise', engine: 'Node.js Express' });
}


// Backup & Disaster Recovery Implementation
function createBackup(req, res) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const filename = `db_backup_${Date.now()}.json`;
    const destPath = path.join(BACKUP_DIR, filename);
    const srcPath = path.join(__dirname, '../db/db.json');

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      const stats = fs.statSync(destPath);
      
      const backupRec = db.insert('backups', {
        filename,
        size: stats.size,
        type: req.body.type || 'manual',
        createdAt: new Date().toISOString()
      });

      return res.status(201).json({ message: 'Database backup file generated successfully.', backup: backupRec });
    } else {
      return res.status(500).json({ message: 'Source database file not found. Backup failed.' });
    }
  } catch (err) {
    console.error('Backup failed', err);
    return res.status(500).json({ message: 'Backup creation faulted.', error: err.message });
  }
}

function listBackups(req, res) {
  const backups = db.find('backups');
  return res.status(200).json(backups);
}

function restoreBackup(req, res) {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ message: 'Backup filename is required.' });
  }

  const backupFilePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(backupFilePath)) {
    return res.status(404).json({ message: 'Backup file not found on disk.' });
  }

  try {
    const srcPath = path.join(__dirname, '../db/db.json');
    // Overwrite database
    fs.copyFileSync(backupFilePath, srcPath);
    
    // Reload database in memory
    db.init();

    db.logAudit(req.user.id, 'DATABASE_RESTORE', { fileRestored: filename });
    return res.status(200).json({ message: 'Database restored successfully. State reloaded.' });
  } catch (err) {
    console.error('Restore failed', err);
    return res.status(500).json({ message: 'Disaster recovery restore failed.', error: err.message });
  }
}

module.exports = {
  getHealth,
  getStatus,
  getVersion,
  createBackup,
  listBackups,
  restoreBackup
};
