import { ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaginationProps {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  pageIndex,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: PaginationProps) {
  const start = (pageIndex - 1) * pageSize + 1;
  const end = Math.min(pageIndex * pageSize, totalCount);

  // Build page number items with ellipsis logic
  const getPageItems = () => {
    const items: (number | "ellipsis")[] = [];
    const total = totalPages;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) items.push(i);
    } else {
      items.push(1);
      if (pageIndex > 3) items.push("ellipsis");
      const start = Math.max(2, pageIndex - 1);
      const end = Math.min(total - 1, pageIndex + 1);
      for (let i = start; i <= end; i++) items.push(i);
      if (pageIndex < total - 2) items.push("ellipsis");
      items.push(total);
    }
    return items;
  };

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="w-auto flex items-center gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">每页</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">条</span>
          </div>
        )}
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">
            显示 {start}-{end}，共 {totalCount} 条
          </span>
        )}
      </div>
      <ShadcnPagination className="justify-end w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(1)}
              disabled={pageIndex === 1}
              aria-label="第一页"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              text="上一页"
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={pageIndex === 1}
            />
          </PaginationItem>
          {getPageItems().map((item, idx) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  isActive={item === pageIndex}
                  onClick={() => item !== pageIndex && onPageChange(item)}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              text="下一页"
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={pageIndex >= totalPages}
            />
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(totalPages)}
              disabled={pageIndex >= totalPages}
              aria-label="最后一页"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </ShadcnPagination>
    </div>
  );
}
