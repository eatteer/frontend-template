import { ApiError } from "@/common/api/api-error";
import type { ErrorReport } from "@/common/api/api-error";
import { i18n } from "@/common/i18n/i18n";


// What a failure that never reached the network carries: a bug, not an answer from the server.
type UnexpectedErrorReport = {
  name: string;
  message: string;
  timestamp: string;
};

type DescribedError = {
  title: string;
  detail: string;
};

const REPORT_INDENT = 2;

// The server's own words when it gave them, already translated; a generic message otherwise, since
// an unexpected error's message is written for developers.
export function describeError(error: unknown): DescribedError {
  if (error instanceof ApiError) {
    return { title: error.title, detail: error.detail };
  }

  return { title: i18n.t("errors.generic.title"), detail: i18n.t("errors.generic.detail") };
}

export function buildErrorReport(error: unknown): ErrorReport | UnexpectedErrorReport {
  if (error instanceof ApiError) {
    return error.toReport();
  }

  return {
    name: error instanceof Error ? error.name : typeof error,
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  };
}

export async function copyErrorReport(error: unknown): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(buildErrorReport(error), null, REPORT_INDENT));
}
