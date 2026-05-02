export function isAuthenticationBypassed(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const rawValue = env.SELF_HOSTED_BYPASS_AUTH;

  if (rawValue === 'false' || rawValue === '0') {
    return false;
  }

  return true;
}
