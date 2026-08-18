/**
 * Vercel Serverless Function Entrypoint
 * Bridges incoming requests to the Express Application
 */
const app = require('../src/server.js');

module.exports = app;
