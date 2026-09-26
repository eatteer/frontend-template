const CHANNEL_NAME = "session";

// Why a session ended: the reader asked to leave, or the refresh token was refused — expired,
// revoked, or already used by a request that lost a race.
const SIGN_OUT_REASON_VALUES = ["sign-out", "expired"] as const;

export type SignOutReason = (typeof SIGN_OUT_REASON_VALUES)[number];

export type SessionEvent =
  | { type: "refreshed" }
  | { type: "signed-in" }
  | { type: "signed-out"; reason: SignOutReason };

// `isRemote` says whether the event happened in another tab: the cookies are shared, so a sign-in,
// a sign-out or a refresh in one tab changes the session of every other.
export type SessionEventListener = (event: SessionEvent, isRemote: boolean) => void;

const listeners = new Set<SessionEventListener>();

function isSessionEvent(value: unknown): value is SessionEvent {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  if (value.type === "signed-out") {
    return "reason" in value && SIGN_OUT_REASON_VALUES.some((reason: SignOutReason): boolean => reason === value.reason);
  }

  return value.type === "refreshed" || value.type === "signed-in";
}

function notify(event: SessionEvent, isRemote: boolean): void {
  listeners.forEach((listener: SessionEventListener): void => {
    listener(event, isRemote);
  });
}

// A browser without BroadcastChannel keeps every tab to itself: each finds out about a change in
// another on its next request, through a 401.
const channel = typeof BroadcastChannel === "undefined" ? undefined : new BroadcastChannel(CHANNEL_NAME);

channel?.addEventListener("message", (message: MessageEvent<unknown>): void => {
  if (isSessionEvent(message.data)) {
    notify(message.data, true);
  }
});

export function publishSessionEvent(event: SessionEvent): void {
  notify(event, false);
  channel?.postMessage(event);
}

export function subscribeToSessionEvents(listener: SessionEventListener): () => void {
  listeners.add(listener);

  return (): void => {
    listeners.delete(listener);
  };
}
