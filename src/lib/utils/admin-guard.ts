export function isAdminEnabled(): boolean {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : ({} as any);
  const flag = env.ENABLE_ADMIN_PAGES;
  if (typeof flag === 'string') {
    return flag.toLowerCase() !== 'false' && flag !== '0';
  }
  // Default: enabled in non-production to aid development
  return env.NODE_ENV !== 'production';
}

