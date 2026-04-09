"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Participant,
  CreateParticipantDto,
  createParticipant,
  deleteParticipant,
  searchParticipants,
  updateParticipant,
} from "@/lib/api";
import { ParticipantForm } from "./components/participant-form";
import { PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

interface TableMeta {
  onEdit: (participant: Participant) => void;
  onDelete: (userId: string) => void;
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
    accessorKey: "activities",
    header: "参与活动",
    cell: ({ getValue }) => {
      const activities = getValue() as Participant["activities"];
      return activities?.length
        ? activities.map((a) => a.activityName).join(", ")
        : "-";
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row, table }) => {
      const participant = row.original;
      const meta = table.options.meta as TableMeta;
      return (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => meta.onEdit(participant)}
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => meta.onDelete(participant.userId)}
            disabled={!!participant.activities?.length}
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      );
    },
  },
];

export default function ParticipantsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<
    Participant | undefined
  >();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 10 });
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteErrorAlertOpen, setDeleteErrorAlertOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["participants", pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      searchParticipants({
        page: pagination.pageIndex,
        size: pagination.pageSize,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      toast.success("参与者创建成功");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      data: updateData,
    }: {
      userId: string;
      data: Partial<CreateParticipantDto>;
    }) => updateParticipant(userId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      toast.success("参与者更新成功");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      toast.success("参与者删除成功");
    },
  });

  const handleCreate = () => {
    setEditingParticipant(undefined);
    setFormMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setFormMode("edit");
    setDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (formData: any) => {
    if (formMode === "create") {
      createMutation.mutate(formData, {
        onSuccess: () => setDialogOpen(false),
      });
    } else if (editingParticipant) {
      updateMutation.mutate(
        { userId: editingParticipant.userId, data: formData },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const handleDelete = (userId: string) => {
    const participant = data?.data.find((p) => p.userId === userId);
    if (participant?.activities?.length) {
      setDeleteErrorMessage("该参与者有参与中的活动，无法删除");
      setDeleteErrorAlertOpen(true);
      return;
    }
    setDeleteTargetId(userId);
    setDeleteAlertOpen(true);
  };

  const handlePaginationChange = (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPagination(newPagination);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">参与者管理</h1>
      </div>

      <div className="mb-4 flex items-center justify-end">
        <Button onClick={handleCreate}>添加参与者</Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        emptyMessage="暂无参与者"
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete,
        }}
      />

      {(data?.data.length ?? 0) > 0 && (
        <Pagination
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          totalCount={data?.total ?? 0}
          totalPages={Math.ceil((data?.total ?? 0) / pagination.pageSize)}
          onPageChange={(pageIndex) =>
            handlePaginationChange({ pageIndex, pageSize: pagination.pageSize })
          }
        />
      )}

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个参与者吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant={"destructive"}
              onClick={() => {
                if (deleteTargetId !== null) {
                  deleteMutation.mutate(deleteTargetId);
                }
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteErrorAlertOpen}
        onOpenChange={setDeleteErrorAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>无法删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteErrorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>确定</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ParticipantForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingParticipant}
        mode={formMode}
      />
    </div>
  );
}
