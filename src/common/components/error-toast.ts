import { i18n } from "@/common/i18n/i18n";
import { copyErrorReport, describeError } from "@/common/lib/error-report";
import { toast } from "@/common/ui/toast";

// Long enough to read a sentence and reach for the copy button, short enough not to pile up.
export const ERROR_TOAST_TIMEOUT_MS = 8000;

// No id or trace id on screen — they mean nothing to the reader. "Copy error" puts the whole report
// on the clipboard instead, for whoever the reader sends it to.
export function showErrorToast(error: unknown): void {
  const { title, detail } = describeError(error);

  async function copyAndConfirm(): Promise<void> {
    try {
      await copyErrorReport(error);
    } catch {
      // The browser refused the clipboard. The label stays "Copy error", which is the truth.
      return;
    }

    toast.update(toastId, { actionProps: { children: i18n.t("actions.errorCopied"), disabled: true } });
  }

  const toastId = toast.add({
    type: "error",
    // Announced assertively: an error is what the reader has to know about now.
    priority: "high",
    title,
    description: detail,
    timeout: ERROR_TOAST_TIMEOUT_MS,
    actionProps: {
      children: i18n.t("actions.copyError"),
      onClick: (): void => {
        void copyAndConfirm();
      },
    },
  });
}
