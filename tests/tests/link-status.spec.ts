import { test, expect } from '@playwright/test';

/**
 * Test Case 2
 * As a tester, I want to check if a page is returning the expected status code.
 * Fetch each <a href> link on the homepage and verify each linked page:
 *   - returns 200 or a 30x status code
 *   - never returns a 40x status code
 */

// Schemes/fragments that aren't real navigable HTTP resources.
const SKIP_PATTERNS = [/^mailto:/i, /^tel:/i, /^javascript:/i, /^#/];

function shouldSkip(href: string): boolean {
  return SKIP_PATTERNS.some((re) => re.test(href.trim()));
}

test.describe('Link status codes', () => {
  test('every link on the homepage resolves to 200 or 30x, never 40x', async ({ page, baseURL, request }) => {
    await page.goto('/');

    const hrefs = await page.$$eval('a[href]', (anchors) =>
      anchors.map((a) => a.getAttribute('href')).filter((h): h is string => !!h)
    );

    const uniqueHrefs = Array.from(new Set(hrefs)).filter((h) => !shouldSkip(h));
    expect(uniqueHrefs.length, 'Expected the homepage to contain at least one crawlable link').toBeGreaterThan(0);

    const results: { href: string; resolved: string; status: number | null; error?: string }[] = [];

    for (const href of uniqueHrefs) {
      const resolved = new URL(href, baseURL ?? page.url()).toString();
      try {
        const response = await request.get(resolved, { maxRedirects: 0, failOnStatusCode: false });
        results.push({ href, resolved, status: response.status() });
      } catch (err) {
        results.push({ href, resolved, status: null, error: (err as Error).message });
      }
    }

    const failures = results.filter((r) => r.status === null || r.status >= 400 && r.status < 500);

    const report = results
      .map((r) => `  ${r.href.padEnd(30)} -> ${r.resolved}  [${r.status ?? `ERROR: ${r.error}`}]`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.log(`Link status report:\n${report}`);

    expect(
      failures,
      `Found ${failures.length} link(s) with a 40x status or request error:\n${failures
        .map((f) => `  ${f.href} -> ${f.status ?? f.error}`)
        .join('\n')}`
    ).toHaveLength(0);

    for (const r of results) {
      expect(
        r.status,
        `${r.href} (${r.resolved}) returned an unexpected status`
      ).not.toBeNull();
      if (r.status !== null) {
        const isOk = r.status === 200 || (r.status >= 300 && r.status < 400);
        expect(isOk, `${r.href} (${r.resolved}) returned status ${r.status}, expected 200 or 30x`).toBeTruthy();
      }
    }
  });
});
