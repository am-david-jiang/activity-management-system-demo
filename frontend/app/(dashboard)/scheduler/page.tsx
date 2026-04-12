"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Scheduler } from "@/components/scheduler";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getActiveActivities } from "@/lib/api/activity-api";
import {
  getActivityEvents,
  createActivityEvent,
  updateActivityEvent,
  deleteActivityEvent,
  type CreateEventDto,
  type UpdateEventDto,
} from "@/lib/api/event-api";
import { toast } from "sonner";

export default function SchedulerPage() {
  const queryClient = useQueryClient();
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

  const { data: activeActivities = [] } = useQuery({
    queryKey: ["active-activities"],
    queryFn: getActiveActivities,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["activity-events", selectedActivityId],
    queryFn: () => getActivityEvents(selectedActivityId!),
    enabled: selectedActivityId !== null,
  });

  const addMutation = useMutation({
    mutationFn: (data: CreateEventDto) =>
      createActivityEvent(selectedActivityId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activity-events", selectedActivityId],
      });
      toast.success("日程添加成功");
    },
    onError: () => {
      toast.error("日程添加失败");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      eventId,
      data,
    }: {
      eventId: number;
      data: UpdateEventDto;
    }) => updateActivityEvent(selectedActivityId!, eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activity-events", selectedActivityId],
      });
      toast.success("日程更新成功");
    },
    onError: () => {
      toast.error("日程更新失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: number) =>
      deleteActivityEvent(selectedActivityId!, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activity-events", selectedActivityId],
      });
      toast.success("日程删除成功");
    },
    onError: () => {
      toast.error("日程删除失败");
    },
  });

  const handleActivityChange = (value: string) => {
    const id = Number(value);
    setSelectedActivityId(id);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">活动日程安排</h1>
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
                <SelectItem
                  key={activity.id}
                  value={activity.id.toString()}
                >
                  {activity.activityName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      {selectedActivityId !== null && (
        <Scheduler
          events={events}
          onAddEvent={(event) => {
            addMutation.mutate({
              title: event.title,
              description: event.description,
              startDate: event.startDate.toISOString(),
              endDate: event.endDate.toISOString(),
              address: event.address,
            });
          }}
          onUpdateEvent={(event) => {
            updateMutation.mutate({
              eventId: event.id,
              data: {
                title: event.title,
                description: event.description,
                startDate: event.startDate.toISOString(),
                endDate: event.endDate.toISOString(),
                address: event.address,
              },
            });
          }}
          onRemoveEvent={(id) => {
            deleteMutation.mutate(id);
          }}
        />
      )}
    </div>
  );
}
