import { CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { copyErrorReport, describeError } from "@/common/lib/error-report";
import { Button } from "@/common/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/common/ui/empty";

import type { JSX } from "react";

type ErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
};

// What a screen shows in place of content that failed to load. The same words and the same report
// as the error toast, so a reader who copies either sends the same thing.
export function ErrorState({ error, onRetry }: ErrorStateProps): JSX.Element {
  const { t } = useTranslation();

  const [isCopied, setIsCopied] = useState(false);

  const { title, detail } = describeError(error);

  async function copyError(): Promise<void> {
    try {
      await copyErrorReport(error);
    } catch {
      // The browser refused the clipboard; the button keeps offering to copy.
      return;
    }

    setIsCopied(true);
  }

  return (
    <Empty role="alert">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon aria-hidden="true" />
        </EmptyMedia>

        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{detail}</EmptyDescription>
      </EmptyHeader>

      <EmptyContent className="flex-row justify-center">
        {onRetry && (
          <Button onClick={onRetry}>{t("actions.retry")}</Button>
        )}

        <Button
          variant="outline"
          disabled={isCopied}
          onClick={() => {
            void copyError();
          }}
        >
          {isCopied ? t("actions.error_copied") : t("actions.copy_error")}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
