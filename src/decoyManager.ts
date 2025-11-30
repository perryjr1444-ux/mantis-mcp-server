/**
 * Manages deployment and lifecycle of decoy services
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  DecoyType,
  DefenseMode,
  DecoyService,
  DecoyConfig
} from './types';
import { logger } from './logger';

export class DecoyManager {
  private activeDecoys: Map<string, DecoyService>;
  private processes: Map<string, ChildProcess>;
  private mantisPath: string;

  constructor() {
    this.activeDecoys = new Map();
    this.processes = new Map();
    this.mantisPath = process.env.MANTIS_PATH || '/opt/mantis-defense';
  }

  async initialize(): Promise<void> {
    logger.info('DecoyManager initialized');
  }

  async deployDecoy(config: {
    type: DecoyType;
    port?: number;
    mode?: DefenseMode;
    injectionPayload?: string;
  }): Promise<DecoyService> {
    const id = this.generateId();
    const port = config.port || this.getDefaultPort(config.type);

    // Check if port is already in use
    if (this.isPortInUse(port)) {
      throw new Error(`Port ${port} is already in use`);
    }

    const decoyService: DecoyService = {
      id,
      type: config.type,
      port,
      status: 'running',
      startTime: new Date(),
      attacksDetected: 0,
      sessionsTrapped: 0,
      mode: config.mode || DefenseMode.PASSIVE
    };

    // Start the decoy process
    const process = await this.startDecoyProcess(decoyService, config.injectionPayload);

    this.processes.set(id, process);
    this.activeDecoys.set(id, decoyService);

    logger.info(`Deployed ${config.type} decoy on port ${port} with ID ${id}`);

    return decoyService;
  }

  private async startDecoyProcess(
    service: DecoyService,
    customPayload?: string
  ): Promise<ChildProcess> {
    const scriptMap = {
      [DecoyType.FTP]: 'ftp_decoy.py',
      [DecoyType.SSH]: 'ssh_decoy.py',
      [DecoyType.HTTP]: 'web_honeypot.py',
      [DecoyType.SMB]: 'smb_decoy.py',
      [DecoyType.TELNET]: 'telnet_decoy.py'
    };

    const scriptName = scriptMap[service.type];
    if (!scriptName) {
      throw new Error(`Unknown decoy type: ${service.type}`);
    }

    const scriptPath = path.join(this.mantisPath, scriptName);

    const args = [
      scriptPath,
      '--port', service.port.toString(),
      '--mode', service.mode
    ];

    if (customPayload) {
      args.push('--payload', customPayload);
    }

    const pythonPath = process.env.PYTHON_PATH || '/usr/bin/python3';
    const childProcess = spawn(pythonPath, args, {
      cwd: this.mantisPath,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    childProcess.stdout?.on('data', (data: Buffer) => {
      logger.debug(`Decoy ${service.id} stdout: ${data}`);
      // Parse for attack detection
      if (data.toString().includes('ATTACK_DETECTED')) {
        service.attacksDetected++;
      }
      if (data.toString().includes('SESSION_TRAPPED')) {
        service.sessionsTrapped++;
      }
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      logger.error(`Decoy ${service.id} stderr: ${data}`);
    });

    childProcess.on('close', (code: number | null) => {
      logger.info(`Decoy ${service.id} process exited with code ${code}`);
      service.status = 'stopped';
    });

    childProcess.on('error', (error: Error) => {
      logger.error(`Decoy ${service.id} process error:`, error);
      service.status = 'error';
    });

    return childProcess;
  }

  async stopDecoy(serviceId: string): Promise<{ success: boolean; message: string }> {
    const service = this.activeDecoys.get(serviceId);
    const process = this.processes.get(serviceId);

    if (!service || !process) {
      return {
        success: false,
        message: `Decoy service ${serviceId} not found`
      };
    }

    try {
      process.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          process.kill('SIGKILL');
          resolve(undefined);
        }, 5000);

        process.once('close', () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      });

      this.activeDecoys.delete(serviceId);
      this.processes.delete(serviceId);

      logger.info(`Stopped decoy service ${serviceId}`);

      return {
        success: true,
        message: `Decoy service ${serviceId} stopped successfully`
      };
    } catch (error) {
      logger.error(`Failed to stop decoy ${serviceId}:`, error);
      return {
        success: false,
        message: `Failed to stop decoy: ${error}`
      };
    }
  }

  async listActiveDecoys(): Promise<DecoyService[]> {
    return Array.from(this.activeDecoys.values());
  }

  private generateId(): string {
    return `decoy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultPort(type: DecoyType): number {
    const defaultPorts = {
      [DecoyType.FTP]: 2121,
      [DecoyType.SSH]: 2222,
      [DecoyType.HTTP]: 8080,
      [DecoyType.SMB]: 4445,
      [DecoyType.TELNET]: 2323
    };
    return defaultPorts[type];
  }

  private isPortInUse(port: number): boolean {
    for (const decoy of this.activeDecoys.values()) {
      if (decoy.port === port && decoy.status === 'running') {
        return true;
      }
    }
    return false;
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down all decoy services...');

    const stopPromises = Array.from(this.activeDecoys.keys()).map(id =>
      this.stopDecoy(id)
    );

    await Promise.all(stopPromises);

    logger.info('All decoy services shut down');
  }

  async restartDecoy(serviceId: string): Promise<DecoyService> {
    const service = this.activeDecoys.get(serviceId);
    if (!service) {
      throw new Error(`Decoy service ${serviceId} not found`);
    }

    const config = {
      type: service.type,
      port: service.port,
      mode: service.mode
    };

    await this.stopDecoy(serviceId);
    return await this.deployDecoy(config);
  }

  getDecoyStats(serviceId: string): DecoyService | undefined {
    return this.activeDecoys.get(serviceId);
  }

  getAllStats(): Map<string, DecoyService> {
    return new Map(this.activeDecoys);
  }
}