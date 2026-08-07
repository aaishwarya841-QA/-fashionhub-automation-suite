import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves which base URL the test suite should run against.
 *
 * Resolution order (highest priority first). The first source that
 * provides a value wins; if it is absent, we fall through to the next:
 *
 *   1. CLI flag / env var  --base-url=<url>   or  BASE_URL=<url>
 *      -> explicit full URL override, used as-is.
 *   2. CLI flag / env var  --env=<name>        or  TEST_ENV=<name>
 *      -> named environment, looked up in config/environments.json.
 *   3. config/environments.json "default" key
 *      -> used when neither of the above was supplied at all.
 *
 * "Command line" here covers both a `--flag=value` passed to the test
 * runner and an environment variable set before the command (the
 * conventional way to parameterise Playwright/CI runs, e.g.
 * `TEST_ENV=staging npx playwright test` or `npx playwright test -- --env=staging`),
 * since Playwright's own CLI does not forward unknown flags into config.
 */

export interface EnvironmentConfig {
  baseUrl: string;
  description?: string;
}

interface EnvironmentsFile {
  default: string;
  environments: Record<string, EnvironmentConfig>;
}

const CONFIG_PATH = path.resolve(__dirname, '..', 'config', 'environments.json');

function readConfigFile(): EnvironmentsFile {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw) as EnvironmentsFile;
}

function getCliArg(flag: string): string | undefined {
  // Supports:  --env=staging   and   --env staging
  const withEquals = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (withEquals) return withEquals.split('=').slice(1).join('=');

  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1];
  }
  return undefined;
}

export function resolveBaseUrl(): { baseUrl: string; source: string; envName?: string } {
  // 1. Explicit full URL override (highest priority)
  const explicitUrl = getCliArg('--base-url') || process.env.BASE_URL;
  if (explicitUrl) {
    return { baseUrl: explicitUrl, source: 'explicit BASE_URL (CLI/env)' };
  }

  const config = readConfigFile();

  // 2. Named environment, from CLI flag or env var
  const envName = getCliArg('--env') || process.env.TEST_ENV;
  if (envName) {
    const match = config.environments[envName];
    if (!match) {
      const known = Object.keys(config.environments).join(', ');
      throw new Error(
        `Unknown environment "${envName}". Available environments in config/environments.json: ${known}`
      );
    }
    return { baseUrl: match.baseUrl, source: `config/environments.json via TEST_ENV="${envName}"`, envName };
  }

  // 3. Fall back to the config file's declared default
  const fallback = config.environments[config.default];
  if (!fallback) {
    throw new Error(`config/environments.json "default" points to an undefined environment: ${config.default}`);
  }
  return { baseUrl: fallback.baseUrl, source: `config/environments.json default ("${config.default}")`, envName: config.default };
}
