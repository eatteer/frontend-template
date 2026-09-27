export const PRELOAD_ERROR_EVENT = "vite:preloadError";
export const RELOAD_GUARD_STORAGE_KEY = "preload-error-reloaded-at";

// A reload that fails again within this window is not a stale deployment, and reloading once more
// would only loop.
export const RELOAD_GUARD_WINDOW_MS = 10_000;

// A chunk that fails to load almost always belongs to a deployment that has since been replaced: the
// page still references the old file names. Reloading picks up the current ones. The guard lets a
// chunk that is really broken reach the route's error screen instead of reloading forever.
export function handlePreloadError(
  event: Event,
  reload: () => void = (): void => {
    window.location.reload();
  },
  now: number = Date.now(),
): void {
  const lastReloadAt = Number(sessionStorage.getItem(RELOAD_GUARD_STORAGE_KEY) ?? 0);

  if (now - lastReloadAt < RELOAD_GUARD_WINDOW_MS) {
    return;
  }

  sessionStorage.setItem(RELOAD_GUARD_STORAGE_KEY, String(now));
  event.preventDefault();

  reload();
}

export function reloadOnPreloadError(): () => void {
  const onPreloadError = (event: Event): void => {
    handlePreloadError(event);
  };

  window.addEventListener(PRELOAD_ERROR_EVENT, onPreloadError);

  return (): void => {
    window.removeEventListener(PRELOAD_ERROR_EVENT, onPreloadError);
  };
}
