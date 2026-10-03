import { spawnSync } from 'child_process';
import path from 'path';

interface SuiteResult {
  suite: string;
  name: string;
  command: string;
  passed: boolean;
  exitCode: number;
  durationMs: number;
  output: string;
}

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

const SUITES = [
  {
    suite: 'R2',
    name: 'Unified Authentication & Password Security',
    script: 'src/scripts/verify-r2-auth.ts',
  },
  {
    suite: 'R3',
    name: 'Server-Side Workspace Enforcement & RBAC',
    script: 'src/scripts/verify-r3-workspaces.ts',
  },
  {
    suite: 'R4',
    name: 'Account Provisioning Engine & Role Templates',
    script: 'src/scripts/verify-r4-provisioning.ts',
  },
];

export function runAllSuites(): { results: SuiteResult[]; totalPassed: number; totalFailed: number } {
  console.log('====================================================');
  console.log('🧪 VERIFY_ACTIONS: Unified Automated Test Runner');
  console.log('====================================================\n');

  const results: SuiteResult[] = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const item of SUITES) {
    console.log(`▶ Executing Step ${item.suite} Suite: ${item.name}...`);
    const startTime = Date.now();

    // Use tsx or ts-node to execute the suite
    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const proc = spawnSync(cmd, ['tsx', item.script], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
      env: { ...process.env },
      shell: true,
      timeout: 120000,
    });

    const durationMs = Date.now() - startTime;
    const passed = proc.status === 0;

    if (passed) {
      totalPassed++;
      console.log(`✅ [${item.suite}] PASSED in ${(durationMs / 1000).toFixed(2)}s\n`);
    } else {
      totalFailed++;
      console.error(`❌ [${item.suite}] FAILED with exit code ${proc.status} in ${(durationMs / 1000).toFixed(2)}s\n`);
      if (proc.stderr) console.error(proc.stderr);
    }

    results.push({
      suite: item.suite,
      name: item.name,
      command: `npx tsx ${item.script}`,
      passed,
      exitCode: proc.status ?? 1,
      durationMs,
      output: (proc.stdout || '') + (proc.stderr || ''),
    });
  }

  console.log('====================================================');
  console.log(`📊 EXECUTION SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed (${SUITES.length} Total Suites)`);
  console.log('====================================================\n');

  return { results, totalPassed, totalFailed };
}

if (require.main === module) {
  const { totalFailed } = runAllSuites();
  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}
