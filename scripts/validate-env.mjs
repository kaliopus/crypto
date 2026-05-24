const required = [
  'DATABASE_URL',
  'CRON_SECRET',
  'AUTH_SECRET',
  'APP_BASE_URL',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN'
];

const placeholderValues = new Set(['', 'change-me', 'change-me-minimum-32-random-bytes']);

const failures = [];

for (const key of required) {
  const value = process.env[key] ?? '';
  if (placeholderValues.has(value)) {
    failures.push(`${key} is missing or still uses a placeholder value.`);
  }
}

if (!process.env.ETHEREUM_RPC_URL && !process.env.BASE_RPC_URL && !process.env.ARBITRUM_RPC_URL && !process.env.OPTIMISM_RPC_URL) {
  failures.push('At least one RPC URL must be configured.');
}

if ((process.env.APP_BASE_URL ?? '').startsWith('http://localhost')) {
  failures.push('APP_BASE_URL must not point to localhost in production.');
}

if (process.env.ALLOW_MEMORY_DB === 'true') {
  failures.push('ALLOW_MEMORY_DB must not be true in production.');
}

if (process.env.RISK_SENTINEL_DEV_USER_ID) {
  failures.push('RISK_SENTINEL_DEV_USER_ID must not be set in production.');
}

if (failures.length > 0) {
  console.error('Production environment validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Production environment validation passed.');
