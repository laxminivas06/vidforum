
import fs from 'fs';
import path from 'path';
import { NAVIGATION_CONFIG } from '../frontend/config/navigation';

const APP_DIR = path.resolve(__dirname, '../frontend/app');

function routeToFilePath(route: string): string[] {
  const cleanRoute = route.split('?')[0]; // remove query params
  if (cleanRoute === '/' || cleanRoute === '') {
    return [path.join(APP_DIR, 'page.tsx'), path.join(APP_DIR, 'page.jsx')];
  }

  // Check direct path e.g. /dashboard -> frontend/app/dashboard/page.tsx
  const segments = cleanRoute.split('/').filter(Boolean);
  const directPath = path.join(APP_DIR, ...segments, 'page.tsx');
  
  // Also check if any segment is a route group like (auth)
  return [directPath];
}

function checkAllNav() {
  console.log('=== Checking Navigation Hrefs Against Filesystem ===\n');

  const allHrefs = new Set<string>();
  for (const [role, groups] of Object.entries(NAVIGATION_CONFIG)) {
    for (const group of groups) {
      for (const item of group.items) {
        allHrefs.add(item.href);
      }
    }
  }

  const missing: { href: string; expectedPath: string }[] = [];
  const found: { href: string; foundPath: string }[] = [];

  for (const href of allHrefs) {
    const cleanRoute = href.split('?')[0];
    const segments = cleanRoute.split('/').filter(Boolean);
    const directPath = path.join(APP_DIR, ...segments, 'page.tsx');

    if (fs.existsSync(directPath)) {
      found.push({ href, foundPath: directPath });
    } else {
      missing.push({ href, expectedPath: directPath });
    }
  }

  console.log(`Total Unique Hrefs: ${allHrefs.size}`);
  console.log(`Found: ${found.length}`);
  console.log(`Missing: ${missing.length}\n`);

  if (missing.length > 0) {
    console.log('--- MISSING ROUTES ---');
    for (const m of missing) {
      console.log(`❌ ${m.href} -> Expected: ${m.expectedPath}`);
    }
  }

  console.log('\n--- FOUND ROUTES ---');
  for (const f of found) {
    console.log(`✅ ${f.href}`);
  }
}

checkAllNav();
