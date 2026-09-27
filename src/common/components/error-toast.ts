import { ApiError, UNAUTHORIZED_STATUS } from "@/common/api/api-error";
import { i18n } from "@/common/i18n/i18n";
import { copyErrorReport, describeError } from "@/common/lib/error-report";
import { toast } from "@/common/ui/toast";

// Long enough to read a sentence and reach for the copy button, short enough not to pile up.
export const ERROR_TOAST_TIMEOUT_MS = 8000;

// No id or trace id on screen — they mean nothing to the reader. "Copy error" puts the whole report
// on the clipboard instead, for whoever the reader sends it to. A 401 never toasts, whoever asks: it
// arrives only once the refresh failed too, and the sign-in screen that follows is the explanation.
export function showErrorToast(error: unknown): void {
  if (error instanceof ApiError && error.status === UNAUTHORIZED_STATUS) {
    return;
  }

  const { title, detail } = describeError(error);

  async function copyAndConfirm(): Promise<void> {
    try {
      await copyErrorReport(error);
    } catch {
      // The browser refused the clipboard. The label stays "Copy error", which is the truth.
      return;
    }

    // `aria-disabled`, not `disabled`: a disabled button drops the focus of whoever just pressed it.
    toast.update(toastId, { actionProps: { children: i18n.t("actions.error_copied"), "aria-disabled": true } });
  }

  const toastId = toast.add({
    type: "error",
    // Announced assertively: an error is what the reader has to know about now.
    priority: "high",
    title,
    description: detail,
    timeout: ERROR_TOAST_TIMEOUT_MS,
    actionProps: {
      children: i18n.t("actions.copy_error"),
      onClick: (): void => {
        void copyAndConfirm();
      },
    },
  });
}
