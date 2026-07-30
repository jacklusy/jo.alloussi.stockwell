/**
 * Assert tokens never land in MMKV helpers via static source scan.
 * Companion to architecture review — CI can also grep these patterns.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe('token storage policy', () => {
  it('never writes accessToken/refreshToken via kvStorage.set', () => {
    const root = join(process.cwd(), 'src');
    const offenders: string[] = [];
    for (const file of walk(root)) {
      const text = readFileSync(file, 'utf8');
      if (/kvStorage\.set\([^)]*(accessToken|refreshToken|access_token|refresh_token)/.test(text)) {
        offenders.push(relative(root, file));
      }
      if (/INSERT INTO.*token/i.test(text) && /access|refresh/i.test(text)) {
        offenders.push(relative(root, file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
