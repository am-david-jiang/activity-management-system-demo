"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/table/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import {
  Participant,
  getActiveActivities,
  getActivityParticipants,
  deleteParticipant,
} from "@/lib/api";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

interface TableMeta {
  selectedActivityId: number | null;
  onDelete: (userId: string, name: string) => void;
}

const columns: ColumnDef<Participant, unknown>[] = [
  {
    accessorKey: "name",
    header: "参与者姓名",
    cell: ({ getValue }) => getValue() || "-",
  },
  {
    accessorKey: "email",
    header: "电子邮箱",
    cell: ({ getValue }) => getValue() || "-",
  },
  {
    accessorKey: "phoneNumber",
    header: "手机号码",
    cell: ({ getValue }) => getValue() || "-",
  },
  {
    accessorKey: "weixinAccount",
    header: "微信号",
    cell: ({ getValue }) => getValue() || "-",
  },
  {
    accessorKey: "qqAccount",
    header: "QQ号",
    cell: ({ getValue }) => getValue() || "-",
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row, table }) => {
      const participant = row.original;
      const meta = table.options.meta as TableMeta;
      const isParticipating = participant.activities?.some(
        (a) => a.id === meta.selectedActivityId,
      );
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => meta.onDelete(participant.userId, participant.name)}
          disabled={isParticipating}
        >
          <TrashIcon className="size-4" />
        </Button>
      );
    },
  },
];

export default function ActivityParticipantsPage() {
  const queryClient = useQueryClient();
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null,
  );
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 10 });
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  const { data: activeActivities = [] } = useQuery({
    queryKey: ["active-activities"],
    queryFn: getActiveActivities,
  });

  const { data: allParticipants = [], isLoading } = useQuery({
    queryKey: ["activity-participants", selectedActivityId],
    queryFn: () => getActivityParticipants(selectedActivityId!),
    enabled: selectedActivityId !== null,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-participants"] });
      toast.success("参与者删除成功");
      setDeleteAlertOpen(false);
    },
  });

  const paginatedData = useMemo(() => {
    const start = (pagination.pageIndex - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return allParticipants.slice(start, end);
  }, [allParticipants, pagination]);

  const handleDelete = (userId: string, name: string) => {
    setDeleteTarget({ userId, name });
    setDeleteAlertOpen(true);
  };

  const handleActivityChange = (value: string) => {
    const id = Number(value);
    setSelectedActivityId(id);
    setPagination((p) => ({ ...p, pageIndex: 1 }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">活动参与者管理</h1>
      </div>

      <Field className="mb-4">
        <FieldLabel>选择活动</FieldLabel>
        <FieldContent>
          <Select
            value={selectedActivityId?.toString() ?? ""}
            onValueChange={handleActivityChange}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="请选择活动" />
            </SelectTrigger>
            <SelectContent position="popper">
              {activeActivities.map((activity) => (
                <SelectItem key={activity.id} value={activity.id.toString()}>
                  {activity.activityName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      {selectedActivityId !== null && (
        <>
          <div className="mb-4 flex items-center justify-end">
            <Button>添加参与者</Button>
          </div>

          <DataTable
            columns={columns}
            data={paginatedData}
            loading={isLoading}
            emptyMessage="该活动暂无参与者"
            meta={{
              selectedActivityId,
              onDelete: handleDelete,
            }}
          />

          {allParticipants.length > 0 && (
            <Pagination
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              totalCount={allParticipants.length}
              totalPages={Math.ceil(allParticipants.length / pagination.pageSize)}
              onPageChange={(pageIndex) =>
                setPagination((p) => ({ ...p, pageIndex }))
              }
            />
          )}
        </>
      )}

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除参与者 &quot;{deleteTarget?.name}&quot;
              吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant={"destructive"}
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.userId);
                }
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
