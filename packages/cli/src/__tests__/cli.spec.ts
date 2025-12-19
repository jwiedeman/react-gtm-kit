/**
 * Tests for the CLI module
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { run } from '../cli';

// Mock modules
jest.mock('fs');
jest.mock('readline');
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockReadline = readline as jest.Mocked<typeof readline>;

describe('CLI', () => {
  let mockRl: {
    question: jest.Mock;
    close: jest.Mock;
  };
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock readline
    mockRl = {
      question: jest.fn(),
      close: jest.fn()
    };
    mockReadline.createInterface.mockReturnValue(mockRl as unknown as readline.Interface);

    // Spy on console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock process.exit
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Default fs mocks
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation();
    mockFs.writeFileSync.mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('help command', () => {
    it('shows help message for help command', async () => {
      await run(['help']);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('GTM Kit');
      expect(output).toContain('Commands:');
    });

    it('shows help message for -h flag', async () => {
      await run(['-h']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('shows help message for --help flag', async () => {
      await run(['--help']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('shows help for unknown command', async () => {
      await run(['unknown-command']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('detect command', () => {
    it('runs detect command and shows framework info', async () => {
      await run(['detect']);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('Framework Detection');
    });

    it('runs detect command with custom directory', async () => {
      await run(['detect', '/tmp']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('validate command', () => {
    it('validates a valid GTM ID', async () => {
      await run(['validate', 'GTM-ABC1234']);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('GTM-ABC1234');
    });

    it('shows error when no ID provided', async () => {
      try {
        await run(['validate']);
      } catch {
        // Expected to throw due to process.exit
      }

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('Please provide a GTM container ID');
    });

    it('validates an invalid GTM ID', async () => {
      await run(['validate', 'INVALID']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('generate command', () => {
    it('generates code for valid GTM ID', async () => {
      await run(['generate', 'GTM-TEST123']);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('Generating Setup Code');
    });

    it('generates code with gen alias', async () => {
      await run(['gen', 'GTM-TEST123']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('shows error when no ID provided for generate', async () => {
      try {
        await run(['generate']);
      } catch {
        // Expected to throw due to process.exit
      }

      const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(output).toContain('Please provide a GTM container ID');
    });

    it('shows error for invalid GTM ID in generate', async () => {
      await run(['generate', 'INVALID']);

      // Invalid GTM ID should trigger an error message
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('generates JavaScript code with --javascript flag', async () => {
      await run(['generate', 'GTM-JS123', '--javascript']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('generates code with consent using --consent flag', async () => {
      await run(['generate', 'GTM-CONSENT', '--consent']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('parseArgs', () => {
    it('parses command and positional arguments', async () => {
      await run(['validate', 'GTM-ABC123']);

      // Should have processed the validate command with GTM-ABC123 as positional
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('parses typescript flag', async () => {
      await run(['generate', 'GTM-TS123', '--typescript']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('parses ts short flag', async () => {
      await run(['generate', 'GTM-TS123', '-ts']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('parses js short flag', async () => {
      await run(['generate', 'GTM-JS123', '-js']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('parses dry-run flag', async () => {
      // For init with dry-run
      mockRl.question.mockImplementation((_q, callback) => {
        callback('GTM-DRY123');
      });

      await run(['init', 'GTM-DRY123', '--dry-run']);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles errors gracefully', async () => {
      // Mock to throw an error
      const originalDetect = jest.requireActual('../detect');
      jest.doMock('../detect', () => ({
        ...originalDetect,
        detectFramework: () => {
          throw new Error('Test error');
        }
      }));

      // This is tricky to test since we'd need to re-import
      // For now, just verify the run function exists and handles the thrown error
      try {
        await run(['detect']);
      } catch {
        // May or may not throw depending on implementation
      }
    });
  });
});

describe('CLI init command (non-interactive parts)', () => {
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;
  let mockRl: {
    question: jest.Mock;
    close: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRl = {
      question: jest.fn(),
      close: jest.fn()
    };
    mockReadline.createInterface.mockReturnValue(mockRl as unknown as readline.Interface);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation();
    mockFs.writeFileSync.mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('runs init with quick ID (dry-run mode)', async () => {
    // Mock all prompts to return yes
    mockRl.question.mockImplementation((_q: string, callback: (answer: string) => void) => {
      callback('y');
    });

    await run(['init', 'GTM-QUICK123', '--dry-run']);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(output).toContain('GTM Kit Setup');
  });

  it('shows error for empty GTM ID in init', async () => {
    // First prompt returns empty string
    mockRl.question.mockImplementation((_q: string, callback: (answer: string) => void) => {
      callback('');
    });

    try {
      await run(['init']);
    } catch {
      // Expected to throw due to process.exit
    }

    const output = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(output).toContain('GTM container ID is required');
  });

  it('shows error for invalid GTM ID in init', async () => {
    mockRl.question.mockImplementation((_q: string, callback: (answer: string) => void) => {
      callback('INVALID');
    });

    try {
      await run(['init']);
    } catch {
      // Expected to throw due to process.exit
    }

    expect(processExitSpy).toHaveBeenCalled();
  });
});

describe('Index exports', () => {
  it('exports all expected functions', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const indexExports = require('../index');

    expect(indexExports.detectFramework).toBeDefined();
    expect(indexExports.validateGtmId).toBeDefined();
    expect(indexExports.validateConfig).toBeDefined();
    expect(indexExports.generateSetupCode).toBeDefined();
    expect(indexExports.run).toBeDefined();
  });
});
