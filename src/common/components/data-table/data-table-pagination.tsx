import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Pagination as PaginationState } from "@/common/api/pagination";
import { useFormatters } from "@/common/hooks/use-formatters";
import { Button } from "@/common/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/common/ui/pagination";
import { Skeleton } from "@/common/ui/skeleton";

import type { JSX } from "react";

type DataTablePaginationProps = {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
};

// The backend's pagination as it arrives: where the reader is, how much there is, and a way to the
// pages on either side. `next` and `previous` are the backend's word on whether those exist. A button
// that runs out of pages stays focusable, so the reader who pressed it is not dropped on the body.
export function DataTablePagination({ pagination, onPageChange }: DataTablePaginationProps): JSX.Element {
  const { t } = useTranslation();

  const format = useFormatters();

  const { page, pages, total, next, previous } = pagination;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {t("pagination.summary", {
          page: format.number(page),
          pages: format.number(Math.max(pages, 1)),
          total: format.number(total),
          count: total,
        })}
      </p>

      <Pagination aria-label={t("pagination.label")} className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              disabled={previous === null}
              focusableWhenDisabled
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
              focusableWhenDisabled
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

// The same row, so the page keeps its height when the first answer lands.
export function DataTablePaginationSkeleton(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Skeleton className="h-5 w-48" />

      <div className="flex gap-1">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}
