import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { MutationMeta } from "@/common/query/query-client";

import { renderWithProviders } from "@test/render";

import type { QueryClient } from "@tanstack/react-query";

// A mutation that stays in flight until the test lets it go.
function startMutation(queryClient: QueryClient, meta?: MutationMeta): () => void {
  let settle = (): void => {};

  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationFn: () => new Promise<void>((resolve: () => void) => {
      settle = resolve;
    }),
    meta,
  });

  void mutation.execute(undefined);

  return (): void => {
    settle();
  };
}

// The providers mount the loader beside whatever is rendered, as the application root does.
describe("FullscreenLoader", () => {
  it("blocks the screen while a write is in flight", async () => {
    const { queryClient } = renderWithProviders(null);

    const settle = startMutation(queryClient);

    expect(await screen.findByRole("status", { name: "Saving…" })).toBeInTheDocument();

    settle();

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  it("ignores a mutation the reader should not wait on", async () => {
    const { queryClient } = renderWithProviders(null);

    const settle = startMutation(queryClient, { fullscreenLoader: false });

    await waitFor(() => {
      expect(queryClient.isMutating()).toBe(1);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    settle();
  });
});
