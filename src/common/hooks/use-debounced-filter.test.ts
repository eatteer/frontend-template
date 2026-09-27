import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FILTER_DEBOUNCE_MS, useDebouncedFilter } from "@/common/hooks/use-debounced-filter";

type Props = { value: string | undefined };

function renderFilter(value: string | undefined): {
  result: { current: ReturnType<typeof useDebouncedFilter> };
  rerender: (props: Props) => void;
  commit: ReturnType<typeof vi.fn>;
  unmount: () => void;
} {
  const commit = vi.fn();

  const rendered = renderHook(({ value: current }: Props) => useDebouncedFilter(current, commit), {
    initialProps: { value },
  });

  return { ...rendered, commit };
}

describe("useDebouncedFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows every keystroke at once and commits only once typing pauses", () => {
    const { result, commit } = renderFilter(undefined);

    act(() => {
      result.current.change("a");
    });

    act(() => {
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS - 1);
      result.current.change("ad");
    });

    expect(result.current.draft).toBe("ad");

    expect(commit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);
    });

    expect(commit).toHaveBeenCalledExactlyOnceWith("ad");
  });

  it("commits blank as no filter at all, and trims what it sends", () => {
    const { result, commit } = renderFilter("ada");

    act(() => {
      result.current.change("   ");
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);
    });

    act(() => {
      result.current.change(" ada ");
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);
    });

    expect(commit.mock.calls).toEqual([[undefined], ["ada"]]);
  });

  it("keeps what is being typed when the URL catches up with its own commit", () => {
    const { result, rerender } = renderFilter(undefined);

    act(() => {
      result.current.change("ad");
      vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);
      result.current.change("ada");
    });

    rerender({ value: "ad" });

    expect(result.current.draft).toBe("ada");
  });

  it("shows a value the URL got from elsewhere", () => {
    const { result, rerender } = renderFilter("ada");

    rerender({ value: "grace" });

    expect(result.current.draft).toBe("grace");

    rerender({ value: undefined });

    expect(result.current.draft).toBe("");
  });

  it("drops a pending commit when it unmounts", () => {
    const { result, commit, unmount } = renderFilter(undefined);

    act(() => {
      result.current.change("ada");
    });

    unmount();

    vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

    expect(commit).not.toHaveBeenCalled();
  });
});
