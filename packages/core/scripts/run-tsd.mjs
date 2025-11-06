import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { rm, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import tsdPkg from 'tsd';

const tsd = tsdPkg.default ?? tsdPkg;
const formatter = tsdPkg.formatter ?? ((diagnostics) => JSON.stringify(diagnostics, null, 2));

const here = dirname(fileURLToPath(import.meta.url));
const cwd = resolve(here, '..');

const runCommand = (command, args) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise(undefined);
      } else {
        rejectPromise(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
    child.on('error', rejectPromise);
  });

await rm(resolve(cwd, 'dist'), { recursive: true, force: true });
await rm(resolve(cwd, 'tsconfig.tsbuildinfo'), { force: true });

await runCommand('pnpm', ['exec', 'tsc', '--project', 'tsconfig.json', '--declaration', '--emitDeclarationOnly']);

try {
  await access(resolve(cwd, 'dist/index.d.ts'));
} catch (error) {
  console.error('Failed to locate generated dist/index.d.ts for tsd checks.');
  throw error;
}

const diagnostics = await tsd({
  cwd,
  typingsFile: 'dist/index.d.ts',
  testFiles: ['tsd/**/*.test-d.ts']
});

if (diagnostics.length > 0) {
  console.error(formatter(diagnostics));
  process.exitCode = 1;
}

await rm(resolve(cwd, 'dist'), { recursive: true, force: true });
