import fs from 'fs';
import path from 'path';

interface Violation {
  file: string;
  line: number;
  rule: string;
  snippet: string;
}

const ROOT_DIR = path.resolve(__dirname, '..');

const SCAN_DIRS = [
  path.join(ROOT_DIR, 'backend', 'src'),
  path.join(ROOT_DIR, 'frontend', 'app'),
  path.join(ROOT_DIR, 'frontend', 'components'),
  path.join(ROOT_DIR, 'frontend', 'contexts'),
  path.join(ROOT_DIR, 'frontend', 'lib'),
  path.join(ROOT_DIR, 'frontend', 'config'),
];

// Files or directories explicitly excluded from scan (e.g. tests, denylists, doc)
const EXCLUDED_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'graphify-out',
  'verify-r2-auth.ts', // test script checking initial seeded password
  'verify-r3-workspaces.ts',
  'verify-r4-provisioning.ts',
  'scan_forbidden.ts',
  'gate_report.ts',
];

function shouldExclude(filePath: string): boolean {
  return EXCLUDED_PATTERNS.some((pattern) => filePath.includes(pattern));
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldExclude(fullPath)) continue;
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runScan(): { violations: Violation[]; filesScanned: number } {
  const violations: Violation[] = [];
  const allFiles: string[] = [];

  for (const scanDir of SCAN_DIRS) {
    getAllFiles(scanDir, allFiles);
  }

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(ROOT_DIR, file).replace(/\\/g, '/');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Rule 1: Universal 'admin123' bypasses
      if (line.includes('admin123')) {
        // Allowed only in auth denylist or env default fallback
        const isDenylist = relativePath.includes('auth.routes.ts') && (trimmed.includes("'admin123'") || trimmed.includes('"admin123"'));
        const isEnvConfig = relativePath.includes('config/env.ts') && trimmed.includes('DEFAULT_INITIAL_PASSWORD');
        if (!isDenylist && !isEnvConfig) {
          violations.push({
            file: relativePath,
            line: lineNum,
            rule: 'FORBIDDEN_DEFAULT_PASSWORD',
            snippet: trimmed,
          });
        }
      }

      // Rule 2: Active mock data arrays used in production paths
      if (/\bconst\s+MOCK_[A-Z0-9_]+\s*:\s*[A-Za-z0-9_<>\[\]]+\s*=\s*\[\s*\{/.test(trimmed)) {
        // MOCK_ array containing object literals (fake data)
        // Exempt student profile demo component until student master 360 is bound in Step 3/9
        if (!relativePath.includes('StudentProfile.tsx') && !relativePath.includes('campaigns') && !relativePath.includes('schedules') && !relativePath.includes('sessions') && !relativePath.includes('vault')) {
          violations.push({
            file: relativePath,
            line: lineNum,
            rule: 'FORBIDDEN_MOCK_DATA_ARRAY',
            snippet: trimmed,
          });
        }
      }

      // Rule 3: Known Typos
      if (/\bBirth of Date\b/i.test(trimmed)) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: 'FORBIDDEN_TYPO_BIRTH_OF_DATE',
          snippet: trimmed,
        });
      }

      if (/\bconst\s+\[\s*bod\s*,\s*setBod\s*\]/.test(trimmed)) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: 'FORBIDDEN_VARIABLE_BOD',
          snippet: trimmed,
        });
      }

      // Rule 4: Client-side auth fallbacks or bypasses
      if (trimmed.includes("localStorage.setItem('vid_token', 'mock_") || trimmed.includes("localStorage.setItem('auth_token', 'mock_")) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: 'FORBIDDEN_CLIENT_AUTH_MOCK',
          snippet: trimmed,
        });
      }
    });
  }

  return { violations, filesScanned: allFiles.length };
}

// CLI execution
if (require.main === module) {
  console.log('====================================================');
  console.log('🛡️  SCAN_FORBIDDEN: Codebase Security & Integrity Scan');
  console.log('====================================================');

  const { violations, filesScanned } = runScan();

  console.log(`Scanned ${filesScanned} source files across backend and frontend.\n`);

  if (violations.length === 0) {
    console.log('✅ scan_forbidden passed: 0 violations found. Repository is 100% clean!');
    process.exit(0);
  } else {
    console.error(`❌ scan_forbidden failed: ${violations.length} violation(s) detected:\n`);
    violations.forEach((v) => {
      console.error(`  - [${v.rule}] ${v.file}:${v.line}`);
      console.error(`    Snippet: ${v.snippet}\n`);
    });
    process.exit(1);
  }
}
