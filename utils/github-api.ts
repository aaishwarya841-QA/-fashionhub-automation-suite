export interface GitHubPull {
  title: string;
  created_at: string;
  user: { login: string } | null;
  number: number;
}

export async function fetchAllOpenPRs(repo: string): Promise<GitHubPull[]> {
  const results: GitHubPull[] = [];
  let page = 1;
  const perPage = 100;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'fashionhub-automation-suite',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `https://api.github.com/repos/${repo}/pulls?state=open&per_page=${perPage}&page=${page}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API request failed (${response.status} ${response.statusText}): ${body}`);
    }

    const batch = (await response.json()) as GitHubPull[];
    results.push(...batch);

    if (batch.length < perPage) break;
    page += 1;
  }

  return results;
}

export function toCsv(prs: GitHubPull[]): string {
  const csvEscape = (value: string): string =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const header = ['PR Name', 'Created Date', 'Author'];
  const rows = prs.map((pr) => [csvEscape(pr.title), csvEscape(pr.created_at), csvEscape(pr.user?.login ?? 'unknown')]);
  return [header, ...rows].map((r) => r.join(',')).join('\n');
}
