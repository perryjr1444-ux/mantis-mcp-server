/**
 * Logging utility for Mantis MCP Server
 */

import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Use absolute path to mantis-mcp-server directory
// When compiled, this file will be in dist/, so we go up one level to project root
const projectRoot = path.resolve(__dirname, '..');

// Use absolute path to project's logs directory
const logDir = process.env.LOG_DIR || path.join(projectRoot, 'logs');

// Debug output to stderr (visible in Claude Desktop logs)
console.error(`[MANTIS DEBUG] Attempting to create log directory at: ${logDir}`);
console.error(`[MANTIS DEBUG] __dirname: ${__dirname}`);
console.error(`[MANTIS DEBUG] projectRoot: ${projectRoot}`);
console.error(`[MANTIS DEBUG] process.cwd(): ${process.cwd()}`);

// Ensure log directory exists with error handling
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.error(`[MANTIS SUCCESS] Created log directory at: ${logDir}`);
  } else {
    console.error(`[MANTIS INFO] Log directory already exists at: ${logDir}`);
  }
} catch (error) {
  // If we can't create logs, write to stderr for Claude Desktop debugging
  console.error(`[MANTIS ERROR] Failed to create log directory at ${logDir}:`, error);
  throw new Error(`Cannot initialize logger: ${error}`);
}

const logFormat = winston.format.printf(({ timestamp, level, message, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'mantis-mcp.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'mantis-mcp-error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
    // NOTE: NO Console transport - MCP protocol requires clean JSON on stdout
    // All logging goes to files only. Use console.error() for stderr debugging.
  ]
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default logger;