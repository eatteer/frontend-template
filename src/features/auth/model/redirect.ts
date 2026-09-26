const HOME_PATH = "/";

// Where to go after signing in. The value arrives in the URL, which anyone can write, so only a path
// on this site is followed: `//evil.example` and `/\evil.example` are other sites to a browser.
export function resolveRedirect(redirect: string | undefined): string {
  if (redirect === undefined || !redirect.startsWith("/") || redirect.startsWith("//") || redirect.startsWith("/\\")) {
    return HOME_PATH;
  }

  return redirect;
}
