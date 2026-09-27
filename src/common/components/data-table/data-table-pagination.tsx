import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Pagination as PaginationState } from "@/common/api/pagination";
import { Button } from "@/common/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/common/ui/pagination";

import type { JSX } from "react";

type DataTablePaginationProps = {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
};

// The backend's pagination as it arrives: where the reader is, how much there is, and a way to the
// pages on either side. `next` and `previous` are the backend's word on whether those exist.
export function DataTablePagination({ pagination, onPageChange }: DataTablePaginationProps): JSX.Element {
  const { t } = useTranslation();

  const { page, pages, total, next, previous } = pagination;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {t("pagination.summary", { page, pages: Math.max(pages, 1), count: total })}
      </p>

      <Pagination aria-label={t("pagination.label")} className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              disabled={previous === null}
              onClick={() => {
                if (previous !== null) {
                  onPageChange(previous);
                }
              }}
            >
              <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
              {t("pagination.previous")}
            </Button>
          </PaginationItem>

          <PaginationItem>
            <Button
              variant="ghost"
              disabled={next === null}
              onClick={() => {
                if (next !== null) {
                  onPageChange(next);
                }
              }}
            >
              {t("pagination.next")}
              <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
