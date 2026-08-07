import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fetchAllOpenPRs, toCsv } from '../utils/github-api';

/**
 * Test Case 4
 * As a product owner, I want to see how many open pull requests there are
 * for our product (example: appwrite/appwrite). Output is a CSV of
 * PR name, created date, and author.
 *
 * This runs independently of the browser projects (no page needed) — it's
 * still included in the suite so `npm test` produces all 4 deliverables
 * in one run. It can also be run standalone via `npm run fetch-prs`.
 */
test.describe('GitHub open pull requests report', () => {
  test('generates a CSV of open PRs for the target repository', async () => {
    const repo = process.env.REPO || 'appwrite/appwrite';

    const prs = await fetchAllOpenPRs(repo);
    console.log(`Found ${prs.length} open pull request(s) for ${repo}.`);

    const csvContent = toCsv(prs);
    const outDir = path.resolve(__dirname, '..', 'reports');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `open-prs-${repo.replace('/', '_')}.csv`);
    fs.writeFileSync(outFile, csvContent, 'utf-8');

    expect(fs.existsSync(outFile)).toBeTruthy();
    // Header row + one row per PR (>=1 line even with zero PRs, for the header).
    const lineCount = csvContent.split('\n').length;
    expect(lineCount).toBe(prs.length + 1);
  });
});
