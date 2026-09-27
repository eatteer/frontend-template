import { useEffect, useRef, useState } from "react";

// Long enough that a word typed at speed is one request, short enough that the list keeps up.
export const FILTER_DEBOUNCE_MS = 300;

type DebouncedFilter = {
  // What the input shows: what was typed, ahead of the URL until the pause.
  draft: string;
  change: (text: string) => void;
};

// Blank is no filter at all, so the URL drops the parameter instead of carrying an empty one.
function toFilterValue(text: string): string | undefined {
  const trimmed = text.trim();

  return trimmed === "" ? undefined : trimmed;
}

// A text filter whose value lives in the URL. The input answers every keystroke; the URL — and the
// request it drives — follows once typing pauses. `commit` is expected to navigate.
export function useDebouncedFilter(
  value: string | undefined,
  commit: (value: string | undefined) => void,
  delayMs: number = FILTER_DEBOUNCE_MS,
): DebouncedFilter {
  const [draft, setDraft] = useState(value ?? "");

  // The last value this input sent to the URL, and the last one it saw there.
  const [committed, setCommitted] = useState(value);
  const [seen, setSeen] = useState(value);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Adjusted while rendering, not synchronised in an effect. A new URL value that is not the echo
  // of this input's own commit came from somewhere else — Back, a link — and the input shows it.
  if (value !== seen) {
    setSeen(value);

    if (value !== committed) {
      setCommitted(value);
      setDraft(value ?? "");
    }
  }

  useEffect((): (() => void) => (): void => {
    clearTimeout(timer.current);
  }, []);

  function change(text: string): void {
    setDraft(text);
    clearTimeout(timer.current);

    timer.current = setTimeout((): void => {
      const next = toFilterValue(text);

      setCommitted(next);
      commit(next);
    }, delayMs);
  }

  return { draft, change };
}
