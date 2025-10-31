/**
 * Input Validator for Mantis MCP Server
 * Sanitizes and validates all input parameters
 */

import { logger } from '../logger';

export class InputValidator {
  /**
   * Sanitize string input
   */
  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > 10000) {
      logger.warn('Input truncated due to excessive length', {
        original: sanitized.length,
      });
      sanitized = sanitized.substring(0, 10000);
    }

    return sanitized;
  }

  /**
   * Validate port number
   */
  validatePort(port: number): number {
    if (typeof port !== 'number' || isNaN(port)) {
      throw new Error('Port must be a valid number');
    }

    if (port < 1 || port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }

    // Warn about privileged ports
    if (port < 1024) {
      logger.warn('Using privileged port', { port });
    }

    return port;
  }

  /**
   * Validate IP address
   */
  validateIp(ip: string): string {
    const sanitized = this.sanitizeString(ip);

    // Simple IPv4 validation
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!ipv4Regex.test(sanitized)) {
      throw new Error('Invalid IP address format');
    }

    return sanitized;
  }

  /**
   * Validate file path
   */
  validatePath(inputPath: string): string {
    const sanitized = this.sanitizeString(inputPath);

    // Check for path traversal attempts
    if (sanitized.includes('..') || sanitized.includes('~')) {
      throw new Error('Path traversal detected');
    }

    // Check for absolute paths in untrusted input
    if (sanitized.startsWith('/') || sanitized.match(/^[A-Za-z]:\\/)) {
      logger.warn('Absolute path detected in user input', { path: sanitized });
    }

    return sanitized;
  }

  /**
   * Validate command array
   */
  validateCommands(commands: string[]): string[] {
    if (!Array.isArray(commands)) {
      throw new Error('Commands must be an array');
    }

    if (commands.length === 0) {
      throw new Error('Commands array cannot be empty');
    }

    if (commands.length > 1000) {
      throw new Error('Too many commands (max 1000)');
    }

    return commands.map((cmd) => this.sanitizeString(cmd));
  }

  /**
   * Validate numeric range
   */
  validateRange(value: number, min: number, max: number, name: string = 'value'): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`${name} must be a valid number`);
    }

    if (value < min || value > max) {
      throw new Error(`${name} must be between ${min} and ${max}`);
    }

    return value;
  }

  /**
   * Validate enum value
   */
  validateEnum<T extends string>(
    value: string,
    allowedValues: readonly T[],
    name: string = 'value'
  ): T {
    const sanitized = this.sanitizeString(value) as T;

    if (!allowedValues.includes(sanitized)) {
      throw new Error(
        `Invalid ${name}. Must be one of: ${allowedValues.join(', ')}`
      );
    }

    return sanitized;
  }

  /**
   * Validate session ID
   */
  validateSessionId(sessionId: string): string {
    const sanitized = this.sanitizeString(sessionId);

    // Must be alphanumeric with optional dashes/underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      throw new Error('Session ID must be alphanumeric');
    }

    if (sanitized.length < 3 || sanitized.length > 100) {
      throw new Error('Session ID must be between 3 and 100 characters');
    }

    return sanitized;
  }

  /**
   * Validate timing data
   */
  validateTimingData(timingData?: number[]): number[] | undefined {
    if (!timingData) {
      return undefined;
    }

    if (!Array.isArray(timingData)) {
      throw new Error('Timing data must be an array');
    }

    if (timingData.length > 10000) {
      throw new Error('Too many timing data points (max 10000)');
    }

    // Validate each value
    for (const value of timingData) {
      if (typeof value !== 'number' || isNaN(value) || value < 0) {
        throw new Error('All timing values must be positive numbers');
      }
    }

    return timingData;
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj: any, depth: number = 0): any {
    if (depth > 10) {
      throw new Error('Object nesting too deep');
    }

    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item, depth + 1));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);

      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeObject(value, depth + 1);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }
}

export const inputValidator = new InputValidator();
export default inputValidator;
