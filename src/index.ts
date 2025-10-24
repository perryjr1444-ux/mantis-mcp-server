#!/usr/bin/env node

/**
 * Mantis MCP Server
 * Model Context Protocol server for Mantis defensive framework
 * Provides tools for defending against LLM-driven cyberattacks
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  TextContent,
  ImageContent,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MantisController } from './mantisController';
import { DecoyManager } from './decoyManager';
import { TarpitGenerator } from './tarpitGenerator';
import { LLMDetector } from './llmDetector';
import { logger } from './logger';
import { DecoyType, DefenseMode, HiddenMethod } from './types';

// Tool parameter schemas
const DeployDecoySchema = z.object({
  type: z.enum(['ftp', 'ssh', 'http', 'smb', 'telnet']),
  port: z.number().optional(),
  mode: z.enum(['passive', 'active', 'tarpit']).default('passive'),
  injectionPayload: z.string().optional()
});

const ConfigureMantisSchema = z.object({
  mode: z.enum(['passive', 'active', 'tarpit', 'monitor']),
  injectionThreshold: z.number().min(0).max(1).optional(),
  callbackIp: z.string().optional(),
  callbackPort: z.number().optional(),
  enableTarpit: z.boolean().optional(),
  tarpitComplexity: z.number().min(1).max(10).optional()
});

const AnalyzeSessionSchema = z.object({
  sessionId: z.string(),
  commands: z.array(z.string()),
  timingData: z.array(z.number()).optional()
});

const GenerateInjectionSchema = z.object({
  targetType: z.enum(['command', 'response', 'file']),
  mode: z.enum(['passive', 'active', 'tarpit']),
  hiddenMethod: z.enum(['ansi', 'html_comment', 'unicode', 'css']).default('ansi'),
  customPayload: z.string().optional()
});

const MonitorAttacksSchema = z.object({
  duration: z.number().min(1).max(3600).default(60),
  includeMetrics: z.boolean().default(true)
});

const GenerateTarpitSchema = z.object({
  depth: z.number().min(1).max(100).default(10),
  breadth: z.number().min(2).max(1000).default(10),
  fileCount: z.number().min(0).max(10000).default(100),
  includeClues: z.boolean().default(true),
  complexity: z.enum(['low', 'medium', 'high', 'extreme']).default('medium')
});

// Initialize server components
const mantisController = new MantisController();
const decoyManager = new DecoyManager();
const tarpitGenerator = new TarpitGenerator();
const llmDetector = new LLMDetector();

// Create MCP server
const server = new Server(
  {
    name: 'mantis-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'deploy_decoy',
    description: 'Deploy a honeypot decoy service to attract and trap LLM-driven attackers',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['ftp', 'ssh', 'http', 'smb', 'telnet'],
          description: 'Type of decoy service to deploy'
        },
        port: {
          type: 'number',
          description: 'Port to run the decoy on (optional, uses default if not specified)'
        },
        mode: {
          type: 'string',
          enum: ['passive', 'active', 'tarpit'],
          description: 'Defense mode for the decoy',
          default: 'passive'
        },
        injectionPayload: {
          type: 'string',
          description: 'Custom prompt injection payload (optional)'
        }
      },
      required: ['type']
    }
  },
  {
    name: 'configure_mantis',
    description: 'Configure the Mantis defense framework settings',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['passive', 'active', 'tarpit', 'monitor'],
          description: 'Global defense mode'
        },
        injectionThreshold: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence threshold for injection (0-1)'
        },
        callbackIp: {
          type: 'string',
          description: 'IP for active defense callbacks'
        },
        callbackPort: {
          type: 'number',
          description: 'Port for active defense callbacks'
        },
        enableTarpit: {
          type: 'boolean',
          description: 'Enable tarpit functionality'
        },
        tarpitComplexity: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Complexity level for tarpit (1-10)'
        }
      },
      required: ['mode']
    }
  },
  {
    name: 'analyze_session',
    description: 'Analyze a session for LLM-driven attack patterns',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session identifier to analyze'
        },
        commands: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of commands executed in the session'
        },
        timingData: {
          type: 'array',
          items: { type: 'number' },
          description: 'Timing data between commands (in seconds)'
        }
      },
      required: ['sessionId', 'commands']
    }
  },
  {
    name: 'generate_injection',
    description: 'Generate a prompt injection payload for defensive purposes',
    inputSchema: {
      type: 'object',
      properties: {
        targetType: {
          type: 'string',
          enum: ['command', 'response', 'file'],
          description: 'Type of injection target'
        },
        mode: {
          type: 'string',
          enum: ['passive', 'active', 'tarpit'],
          description: 'Defense mode for the injection'
        },
        hiddenMethod: {
          type: 'string',
          enum: ['ansi', 'html_comment', 'unicode', 'css'],
          description: 'Method to hide the injection from humans',
          default: 'ansi'
        },
        customPayload: {
          type: 'string',
          description: 'Custom payload to inject (optional)'
        }
      },
      required: ['targetType', 'mode']
    }
  },
  {
    name: 'monitor_attacks',
    description: 'Monitor and report on ongoing attack attempts',
    inputSchema: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          minimum: 1,
          maximum: 3600,
          description: 'Monitoring duration in seconds',
          default: 60
        },
        includeMetrics: {
          type: 'boolean',
          description: 'Include detailed metrics in report',
          default: true
        }
      }
    }
  },
  {
    name: 'generate_tarpit',
    description: 'Generate a tarpit filesystem structure to exhaust LLM resources',
    inputSchema: {
      type: 'object',
      properties: {
        depth: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          description: 'Maximum directory depth',
          default: 10
        },
        breadth: {
          type: 'number',
          minimum: 2,
          maximum: 1000,
          description: 'Number of directories per level',
          default: 10
        },
        fileCount: {
          type: 'number',
          minimum: 0,
          maximum: 10000,
          description: 'Total number of fake files',
          default: 100
        },
        includeClues: {
          type: 'boolean',
          description: 'Include fake clues to keep LLMs engaged',
          default: true
        },
        complexity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'extreme'],
          description: 'Overall tarpit complexity',
          default: 'medium'
        }
      }
    }
  },
  {
    name: 'list_active_decoys',
    description: 'List all currently active decoy services',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'stop_decoy',
    description: 'Stop a specific decoy service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceId: {
          type: 'string',
          description: 'ID of the decoy service to stop'
        }
      },
      required: ['serviceId']
    }
  },
  {
    name: 'get_attack_stats',
    description: 'Get statistics about detected attacks and defenses',
    inputSchema: {
      type: 'object',
      properties: {
        timeRange: {
          type: 'string',
          enum: ['1h', '24h', '7d', '30d', 'all'],
          description: 'Time range for statistics',
          default: '24h'
        }
      }
    }
  },
  {
    name: 'test_injection',
    description: 'Test a prompt injection payload against a simulated LLM',
    inputSchema: {
      type: 'object',
      properties: {
        payload: {
          type: 'string',
          description: 'The injection payload to test'
        },
        targetModel: {
          type: 'string',
          enum: ['gpt4', 'gpt4o', 'claude', 'llama', 'generic'],
          description: 'Target LLM model to test against',
          default: 'generic'
        }
      },
      required: ['payload']
    }
  }
];

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'deploy_decoy': {
        const params = DeployDecoySchema.parse(args);
        const result = await decoyManager.deployDecoy({
          type: params.type as DecoyType,
          port: params.port,
          mode: params.mode as DefenseMode,
          injectionPayload: params.injectionPayload
        });
        return {
          content: [
            {
              type: 'text',
              text: `Deployed ${params.type} decoy service:\n${JSON.stringify(result, null, 2)}`
            } as TextContent
          ]
        };
      }

      case 'configure_mantis': {
        const params = ConfigureMantisSchema.parse(args);
        const result = await mantisController.configure({
          mode: params.mode as DefenseMode,
          injectionThreshold: params.injectionThreshold,
          callbackIp: params.callbackIp,
          callbackPort: params.callbackPort,
          enableTarpit: params.enableTarpit,
          tarpitComplexity: params.tarpitComplexity
        });
        return {
          content: [
            {
              type: 'text',
              text: `Mantis configuration updated:\n${JSON.stringify(result, null, 2)}`
            } as TextContent
          ]
        };
      }

      case 'analyze_session': {
        const params = AnalyzeSessionSchema.parse(args);
        const analysis = await llmDetector.analyzeSession(params);
        return {
          content: [
            {
              type: 'text',
              text: `Session Analysis Results:\n${JSON.stringify(analysis, null, 2)}`
            } as TextContent
          ]
        };
      }

      case 'generate_injection': {
        const params = GenerateInjectionSchema.parse(args);
        const injection = await mantisController.generateInjection({
          targetType: params.targetType,
          mode: params.mode as DefenseMode,
          hiddenMethod: params.hiddenMethod as HiddenMethod,
          customPayload: params.customPayload
        });
        return {
          content: [
            {
              type: 'text',
              text: `Generated Injection Payload:\n\n${injection.hiddenPayload}\n\nRaw: ${injection.rawPayload}\n\nDetails: ${JSON.stringify(injection.metadata, null, 2)}`
            } as TextContent
          ]
        };
      }

      case 'monitor_attacks': {
        const params = MonitorAttacksSchema.parse(args);
        const report = await mantisController.monitorAttacks(params);
        return {
          content: [
            {
              type: 'text',
              text: `Attack Monitoring Report:\n${JSON.stringify(report, null, 2)}`
            } as TextContent
          ]
        };
      }

      case 'generate_tarpit': {
        const params = GenerateTarpitSchema.parse(args);
        const tarpit = await tarpitGenerator.generate(params);
        return {
          content: [
            {
              type: 'text',
              text: `Generated Tarpit Structure:\n${JSON.stringify(tarpit, null, 2)}`
            } as TextContent
          ]
        };
      }

      case 'list_active_decoys': {
        const decoys = await decoyManager.listActiveDecoys();
        return {
          content: [
            {
              type: 'text',
              text: `Active Decoys:\n${JSON.stringify(decoys, null, 2)}`
            } as TextContent
          ]
        };
      }

      case 'stop_decoy': {
        const { serviceId } = args as { serviceId: string };
        const result = await decoyManager.stopDecoy(serviceId);
        return {
          content: [
            {
              type: 'text',
              text: `Stopped decoy service ${serviceId}: ${result.message}`
            } as TextContent
          ]
        };
      }

      case 'get_attack_stats': {
        const { timeRange = '24h' } = args as { timeRange?: string };
        const stats = await mantisController.getAttackStats(timeRange);
        return {
          content: [
            {
              type: 'text',
              text: `Attack Statistics (${timeRange}):\n${JSON.stringify(stats, null, 2)}`
            } as TextContent
          ]
        };
      }

      case 'test_injection': {
        const { payload, targetModel = 'generic' } = args as { payload: string; targetModel?: string };
        const testResult = await mantisController.testInjection(payload, targetModel);
        return {
          content: [
            {
              type: 'text',
              text: `Injection Test Results:\n${JSON.stringify(testResult, null, 2)}`
            } as TextContent
          ]
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool ${name} not found`
        );
    }
  } catch (error) {
    logger.error(`Error executing tool ${name}:`, error);

    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`
      );
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Failed to execute tool: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Start the server
async function main() {
  try {
    console.error('[MANTIS] Initializing MCP Server...');
    logger.info('Starting Mantis MCP Server...');

    // Initialize components
    console.error('[MANTIS] Initializing MantisController...');
    await mantisController.initialize();

    console.error('[MANTIS] Initializing DecoyManager...');
    await decoyManager.initialize();

    console.error('[MANTIS] Creating transport...');
    const transport = new StdioServerTransport();

    console.error('[MANTIS] Connecting server to transport...');
    await server.connect(transport);

    console.error('[MANTIS] Server connected successfully');
    logger.info('Mantis MCP Server started successfully');

    // Graceful shutdown handlers
    process.on('SIGINT', async () => {
      console.error('[MANTIS] Received SIGINT, shutting down...');
      logger.info('Shutting down Mantis MCP Server...');
      await decoyManager.shutdown();
      await mantisController.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('[MANTIS] Received SIGTERM, shutting down...');
      logger.info('Shutting down Mantis MCP Server...');
      await decoyManager.shutdown();
      await mantisController.shutdown();
      process.exit(0);
    });

    // Keep process alive - the transport handles stdin/stdout
    console.error('[MANTIS] Server is ready and waiting for messages...');

    // Don't exit - let the transport keep the process alive
    // The stdio transport will handle the event loop

  } catch (error) {
    console.error('[MANTIS FATAL ERROR]', error);
    logger.error('Failed to start Mantis MCP Server:', error);
    process.exit(1);
  }
}

main();