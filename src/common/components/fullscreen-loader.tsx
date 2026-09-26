import { useIsMutating } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/common/ui/spinner";

import type { Mutation } from "@tanstack/react-query";
import type { JSX } from "react";

// Blocks the screen while a write is in flight, so nobody submits twice or navigates away from a
// half-finished change. Reads never block: they show skeletons where their content goes.
export function FullscreenLoader(): JSX.Element | null {
  const { t } = useTranslation();

  const pendingMutations = useIsMutating({
    predicate: (mutation: Mutation): boolean => mutation.meta?.fullscreenLoader !== false,
  });

  if (pendingMutations === 0) {
    return null;
  }

  return (
    <div className="
      fixed inset-0 z-50 grid place-items-center bg-background/60
      backdrop-blur-sm
    "
    >
      <Spinner className="size-8" aria-label={t("loader.saving")} />
    </div>
  );
}
