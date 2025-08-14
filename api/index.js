// Proxy file for Vercel serverless functions
// This imports and exports the Express app from the backend directory

const app = require('../backend/src/index.js');

module.exports = app;
