"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import {
  Activity,
  CreateActivityDto,
  createActivity,
  deleteActivity,
  finishActivity,
  getActivities,
  updateActivity,
} from "@/lib/api";
import { ActivityForm } from "./components/activity-form";
import { PencilIcon, TrashIcon, CheckIcon } from "lucide-react";

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN");
}

interface TableMeta {
  onEdit: (activity: Activity) => void;
  onDelete: (id: number) => void;
  onFinish: (id: number) => void;
}

const columns: ColumnDef<Activity, unknown>[] = [
  {
    accessorKey: "activityName",
    header: "名称",
  },
  {
    accessorKey: "startDate",
    header: "开始日期",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "endDate",
    header: "结束日期",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "applyEndDate",
    header: "报名截止日期",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <span
          className={`inline-block px-2 py-1 text-xs rounded ${
            status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status === "active" ? "进行中" : "已结束"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row, table }) => {
      const activity = row.original;
      const meta = table.options.meta as TableMeta;
      return (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => meta.onEdit(activity)}
            disabled={activity.status === "finished"}
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => meta.onDelete(activity.id)}
            disabled={activity.status === "finished"}
          >
            <TrashIcon className="size-4" />
          </Button>
          {activity.status === "active" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => meta.onFinish(activity.id)}
            >
              <CheckIcon className="size-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];

export default function CreateActivityPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<
    Activity | undefined
  >();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
  });

  const createMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateActivityDto }) =>
      updateActivity(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });

  const finishMutation = useMutation({
    mutationFn: finishActivity,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });

  const handleCreate = () => {
    setEditingActivity(undefined);
    setFormMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormMode("edit");
    setDialogOpen(true);
  };

  const handleSubmit = (data: CreateActivityDto) => {
    if (formMode === "create") {
      createMutation.mutate(data, {
        onSuccess: () => setDialogOpen(false),
      });
    } else if (editingActivity) {
      updateMutation.mutate(
        { id: editingActivity.id, data },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("确定要删除这个活动吗？")) return;
    deleteMutation.mutate(id);
  };

  const handleFinish = (id: number) => {
    if (!confirm("确定要结束这个活动吗？")) return;
    finishMutation.mutate(id);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">活动管理</h1>
        <Button onClick={handleCreate}>创建新活动</Button>
      </div>

      <DataTable
        columns={columns}
        data={activities}
        loading={isLoading}
        emptyMessage="暂无活动"
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete,
          onFinish: handleFinish,
        }}
      />

      <ActivityForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingActivity}
        mode={formMode}
      />
    </div>
  );
}
