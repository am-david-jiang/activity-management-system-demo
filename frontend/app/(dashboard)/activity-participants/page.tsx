"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/table/pagination";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  getParticipants,
  addParticipantToActivity,
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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
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

  const { data: allParticipantsForSelect = [] } = useQuery({
    queryKey: ["all-participants"],
    queryFn: getParticipants,
    enabled: addDialogOpen,
  });

  const addMutation = useMutation({
    mutationFn: ({ activityId, userId }: { activityId: number; userId: string }) =>
      addParticipantToActivity(activityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-participants"] });
      toast.success("参与者添加成功");
      setAddDialogOpen(false);
      setSelectedParticipant(null);
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
            <Button onClick={() => setAddDialogOpen(true)}>添加参与者</Button>
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加参与者</DialogTitle>
            <DialogDescription>选择一个参与者添加到当前活动</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>选择参与者</FieldLabel>
              <FieldContent>
                <Select
                  value={selectedParticipant?.userId ?? ""}
                  onValueChange={(userId) => {
                    const p = allParticipantsForSelect.find((p) => p.userId === userId);
                    setSelectedParticipant(p ?? null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择参与者" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {allParticipantsForSelect.map((p) => (
                      <SelectItem key={p.userId} value={p.userId}>
                        {p.name} ({p.email || p.phoneNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            {selectedParticipant && (
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>姓名</FieldLabel>
                  <Input value={selectedParticipant.name} readOnly />
                </Field>
                <Field>
                  <FieldLabel>电子邮箱</FieldLabel>
                  <Input value={selectedParticipant.email || "-"} readOnly />
                </Field>
                <Field>
                  <FieldLabel>手机号码</FieldLabel>
                  <Input value={selectedParticipant.phoneNumber} readOnly />
                </Field>
                <Field>
                  <FieldLabel>微信号</FieldLabel>
                  <Input value={selectedParticipant.weixinAccount || "-"} readOnly />
                </Field>
                <Field>
                  <FieldLabel>QQ号</FieldLabel>
                  <Input value={selectedParticipant.qqAccount || "-"} readOnly />
                </Field>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button
              disabled={!selectedParticipant}
              onClick={() => {
                if (selectedParticipant && selectedActivityId) {
                  addMutation.mutate({ activityId: selectedActivityId, userId: selectedParticipant.userId });
                }
              }}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
