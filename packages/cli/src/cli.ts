#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * GTM Kit CLI - Zero-config setup for Google Tag Manager
 *
 * Usage:
 *   npx @jwiedeman/gtm-kit-cli init          # Interactive setup
 *   npx @jwiedeman/gtm-kit-cli init GTM-XXX  # Quick setup with container ID
 *   npx @jwiedeman/gtm-kit-cli detect        # Just detect framework
 *   npx @jwiedeman/gtm-kit-cli validate      # Validate existing setup
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { detectFramework, getDetectionSummary, getInstallCommand } from './detect';
import { validateGtmId } from './validate';
import { generateSetupCode, formatGeneratedCode } from './codegen';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const c = (color: keyof typeof colors, text: string): string => `${colors[color]}${text}${colors.reset}`;

/**
 * Print styled output
 */
const print = {
  header: (text: string) => console.log(`\n${c('bold', c('cyan', text))}\n`),
  success: (text: string) => console.log(`${c('green', '✓')} ${text}`),
  error: (text: string) => console.log(`${c('red', '✗')} ${text}`),
  warning: (text: string) => console.log(`${c('yellow', '⚠')} ${text}`),
  info: (text: string) => console.log(`${c('blue', 'ℹ')} ${text}`),
  step: (n: number, text: string) => console.log(`\n${c('bold', `Step ${n}:`)} ${text}`),
  code: (text: string) => console.log(`  ${c('dim', '$')} ${c('cyan', text)}`),
  box: (lines: string[]) => {
    const maxLen = Math.max(...lines.map((l) => l.length));
    const border = '─'.repeat(maxLen + 2);
    console.log(`┌${border}┐`);
    lines.forEach((line) => console.log(`│ ${line.padEnd(maxLen)} │`));
    console.log(`└${border}┘`);
  }
};

/**
 * Simple readline prompt
 */
const prompt = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

/**
 * Yes/No prompt with default
 */
const confirm = async (question: string, defaultYes = true): Promise<boolean> => {
  const suffix = defaultYes ? '[Y/n]' : '[y/N]';
  const answer = await prompt(`${question} ${suffix} `);

  if (!answer) return defaultYes;
  return answer.toLowerCase().startsWith('y');
};

/**
 * Show banner
 */
const showBanner = () => {
  console.log(`
${c('cyan', '╔═══════════════════════════════════════════╗')}
${c('cyan', '║')}  ${c('bold', 'GTM Kit')} - Easy Google Tag Manager Setup  ${c('cyan', '║')}
${c('cyan', '╚═══════════════════════════════════════════╝')}
`);
};

/**
 * Show help
 */
const showHelp = () => {
  showBanner();
  console.log(`${c('bold', 'Usage:')}
  npx @jwiedeman/gtm-kit-cli <command> [options]

${c('bold', 'Commands:')}
  ${c('cyan', 'init')} [GTM-ID]     Interactive setup (or quick setup with ID)
  ${c('cyan', 'detect')}            Detect framework and show install command
  ${c('cyan', 'validate')} <ID>     Validate a GTM container ID
  ${c('cyan', 'generate')} <ID>     Generate setup code for your framework
  ${c('cyan', 'help')}              Show this help message

${c('bold', 'Examples:')}
  ${c('dim', '$')} npx @jwiedeman/gtm-kit-cli init
  ${c('dim', '$')} npx @jwiedeman/gtm-kit-cli init GTM-ABC1234
  ${c('dim', '$')} npx @jwiedeman/gtm-kit-cli detect
  ${c('dim', '$')} npx @jwiedeman/gtm-kit-cli validate GTM-ABC1234

${c('bold', 'Options:')}
  --typescript, -ts    Generate TypeScript code (default)
  --javascript, -js    Generate JavaScript code
  --consent            Include consent mode setup
  --dry-run            Show what would be done without doing it

${c('bold', 'More info:')} https://github.com/react-gtm-kit/react-gtm-kit
`);
};

/**
 * Detect command - show framework detection
 */
const runDetect = (dir: string = process.cwd()) => {
  showBanner();
  print.header('Framework Detection');

  const info = detectFramework(dir);
  console.log(getDetectionSummary(info));

  console.log('\n' + c('bold', 'Install command:'));
  print.code(getInstallCommand(info.packageManager, info.packages));

  return info;
};

/**
 * Validate command - validate GTM ID
 */
const runValidate = (id: string) => {
  showBanner();
  print.header('GTM ID Validation');

  const result = validateGtmId(id);

  console.log(`ID: ${c('cyan', id)}`);

  if (result.valid) {
    print.success('Valid GTM container ID');
    if (result.warning) {
      print.warning(result.warning);
    }
  } else {
    print.error(result.error ?? 'Invalid');
    if (result.suggestion) {
      print.info(`Suggestion: ${result.suggestion}`);
    }
  }

  return result;
};

/**
 * Generate command - generate setup code
 */
const runGenerate = (containerId: string, options: { typescript?: boolean; consent?: boolean } = {}) => {
  showBanner();
  print.header('Generating Setup Code');

  const info = detectFramework();
  const validation = validateGtmId(containerId);

  if (!validation.valid) {
    print.error(validation.error ?? 'Invalid GTM ID');
    if (validation.suggestion) {
      print.info(`Suggestion: ${validation.suggestion}`);
    }
    return null;
  }

  print.success(`Framework: ${info.displayName}`);
  print.success(`Container: ${containerId}`);

  const files = generateSetupCode({
    framework: info.framework,
    containers: containerId,
    typescript: options.typescript ?? true,
    includeConsent: options.consent ?? false
  });

  console.log('\n' + formatGeneratedCode(files));

  return files;
};

/**
 * Init command - interactive setup
 */
const runInit = async (
  quickId?: string,
  options: { typescript?: boolean; consent?: boolean; dryRun?: boolean } = {}
) => {
  showBanner();
  print.header('GTM Kit Setup');

  const info = detectFramework();

  // Step 1: Show detection
  print.step(1, 'Detecting your project...');
  console.log(`\n  Framework: ${c('green', info.displayName)}`);
  console.log(`  Package Manager: ${c('green', info.packageManager)}`);
  console.log(`  Confidence: ${info.confidence}%`);

  // Step 2: Get GTM ID
  print.step(2, 'GTM Container ID');

  let containerId = quickId ?? '';

  if (!containerId) {
    containerId = await prompt(`\n  Enter your GTM container ID (e.g., GTM-ABC1234): `);
  }

  if (!containerId) {
    print.error('GTM container ID is required');
    console.log(`\n  ${c('dim', 'Tip: Get your GTM ID from https://tagmanager.google.com')}\n`);
    process.exit(1);
  }

  const validation = validateGtmId(containerId);
  if (!validation.valid) {
    print.error(validation.error ?? 'Invalid GTM ID');
    if (validation.suggestion) {
      print.info(validation.suggestion);
    }
    process.exit(1);
  }

  print.success(`Valid container ID: ${containerId}`);

  // Step 3: Options
  print.step(3, 'Configuration');

  const useConsent = options.consent ?? (await confirm('\n  Include Consent Mode v2 setup (GDPR)?', true));
  const useTypescript = options.typescript ?? (await confirm('  Use TypeScript?', true));

  // Step 4: Install packages
  print.step(4, 'Installing packages...');

  const installCmd = getInstallCommand(info.packageManager, info.packages);
  console.log(`\n  Command: ${c('cyan', installCmd)}`);

  if (options.dryRun) {
    print.warning('Dry run - skipping installation');
  } else {
    const shouldInstall = await confirm('\n  Run installation now?', true);

    if (shouldInstall) {
      const { execSync } = await import('child_process');
      try {
        console.log('');
        execSync(installCmd, { stdio: 'inherit' });
        print.success('Packages installed successfully');
      } catch (error) {
        print.error('Installation failed');
        console.log(`\n  ${c('dim', 'Try running manually:')} ${c('cyan', installCmd)}\n`);
      }
    } else {
      print.info('Skipped installation. Run manually:');
      print.code(installCmd);
    }
  }

  // Step 5: Generate code
  print.step(5, 'Generating setup code...');

  const files = generateSetupCode({
    framework: info.framework,
    containers: containerId,
    typescript: useTypescript,
    includeConsent: useConsent
  });

  console.log('\n' + formatGeneratedCode(files));

  // Step 6: Write files
  print.step(6, 'Creating files...');

  if (options.dryRun) {
    print.warning('Dry run - skipping file creation');
    files.forEach((file) => {
      console.log(`  Would create: ${c('cyan', file.filename)}`);
    });
  } else {
    const shouldWrite = await confirm('\n  Create these files in your project?', false);

    if (shouldWrite) {
      for (const file of files) {
        const filePath = path.join(process.cwd(), file.filename);
        const dir = path.dirname(filePath);

        // Create directory if needed
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Check if file exists
        if (fs.existsSync(filePath)) {
          const overwrite = await confirm(`  ${file.filename} exists. Overwrite?`, false);
          if (!overwrite) {
            print.info(`Skipped: ${file.filename}`);
            continue;
          }
        }

        fs.writeFileSync(filePath, file.content);
        print.success(`Created: ${file.filename}`);
      }
    } else {
      print.info('Files not created. Copy the code above manually.');
    }
  }

  // Done!
  print.header('Setup Complete!');

  print.box([
    `GTM Kit is ready to use with ${info.displayName}!`,
    '',
    `Container: ${containerId}`,
    useConsent ? 'Consent Mode: Enabled' : 'Consent Mode: Disabled',
    '',
    'Next steps:',
    '1. Review the generated code',
    '2. Add your routes/pages',
    '3. Test with GTM Preview mode',
    '',
    'Docs: https://github.com/react-gtm-kit/react-gtm-kit'
  ]);

  return { info, containerId, files };
};

/**
 * Parse CLI arguments
 */
const parseArgs = (args: string[]): { command: string; positional: string[]; flags: Record<string, boolean> } => {
  const command = args[0] ?? 'help';
  const positional: string[] = [];
  const flags: Record<string, boolean> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      flags[arg.slice(2)] = true;
    } else if (arg.startsWith('-')) {
      flags[arg.slice(1)] = true;
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags };
};

/**
 * Main entry point
 */
export const run = async (args: string[] = process.argv.slice(2)): Promise<void> => {
  const { command, positional, flags } = parseArgs(args);

  const options = {
    typescript: flags.typescript || flags.ts ? true : flags.javascript || flags.js ? false : undefined,
    consent: flags.consent ?? undefined,
    dryRun: flags['dry-run'] ?? false
  };

  try {
    switch (command) {
      case 'init':
        await runInit(positional[0], options);
        break;

      case 'detect':
        runDetect(positional[0]);
        break;

      case 'validate':
        if (!positional[0]) {
          print.error('Please provide a GTM container ID to validate');
          console.log(`\n  ${c('dim', 'Usage:')} npx @jwiedeman/gtm-kit-cli validate GTM-ABC1234\n`);
          process.exit(1);
        }
        runValidate(positional[0]);
        break;

      case 'generate':
      case 'gen':
        if (!positional[0]) {
          print.error('Please provide a GTM container ID');
          console.log(`\n  ${c('dim', 'Usage:')} npx @jwiedeman/gtm-kit-cli generate GTM-ABC1234\n`);
          process.exit(1);
        }
        runGenerate(positional[0], options);
        break;

      case 'help':
      case '-h':
      case '--help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    if (error instanceof Error) {
      print.error(error.message);
    } else {
      print.error('An unexpected error occurred');
    }
    process.exit(1);
  }
};

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  run();
}
