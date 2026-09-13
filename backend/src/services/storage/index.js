const LocalStorageService = require('./localStorage.service');
const config = require('../../config/env');

let storageService;

// Configurable storage driver (defaults to 'local')
const driver = process.env.STORAGE_DRIVER || 'local';

switch (driver.toLowerCase()) {
  case 'local':
  default:
    storageService = new LocalStorageService();
    break;
}

module.exports = storageService;

