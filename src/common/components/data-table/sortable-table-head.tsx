import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";

import type { SortOrder } from "@/common/api/pagination";
import { Button } from "@/common/ui/button";
import { TableHead } from "@/common/ui/table";

import type { JSX } from "react";

export type Sort<TField extends string> = {
  sortBy: TField;
  sortOrder: SortOrder;
};

const ARIA_SORT: Record<SortOrder, "ascending" | "descending"> = {
  asc: "ascending",
  desc: "descending",
};

const SORT_ICONS: Record<SortOrder, typeof ArrowUpIcon> = {
  asc: ArrowUpIcon,
  desc: ArrowDownIcon,
};

type SortableTableHeadProps<TField extends string> = {
  field: TField;
  label: string;
  // The order the list is in now, the backend's default included.
  sort: Sort<TField>;
  onSort: (sort: Sort<TField>) => void;
};

// A column header that sorts by its column: ascending first, then the other way on each click. The
// order is announced on the header cell (`aria-sort`), so the button's name stays the column's.
export function SortableTableHead<TField extends string>({ field, label, sort, onSort }: SortableTableHeadProps<TField>): JSX.Element {
  const isActive = sort.sortBy === field;
  const nextOrder: SortOrder = isActive && sort.sortOrder === "asc" ? "desc" : "asc";
  const Icon = isActive ? SORT_ICONS[sort.sortOrder] : ArrowUpDownIcon;

  return (
    <TableHead aria-sort={isActive ? ARIA_SORT[sort.sortOrder] : undefined}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => {
          onSort({ sortBy: field, sortOrder: nextOrder });
        }}
      >
        {label}
        <Icon aria-hidden="true" />
      </Button>
    </TableHead>
  );
}
