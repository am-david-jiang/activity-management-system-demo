"use client";

import { useQuery } from "@tanstack/react-query";
import { getActiveActivities } from "@/lib/api/activity-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ActivitySelectorProps {
  value: number | null;
  onChange: (activityId: number | null) => void;
  disabled?: boolean;
}

export function ActivitySelector({
  value,
  onChange,
  disabled = false,
}: ActivitySelectorProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["active-activities"],
    queryFn: getActiveActivities,
  });

  return (
    <div className="space-y-2">
      <Label htmlFor="activity-select">
        选择活动 <span className="text-destructive">*</span>
      </Label>
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>加载中...</span>
        </div>
      ) : (
        <Select
          value={value?.toString() ?? ""}
          onValueChange={(val) => onChange(val ? Number(val) : null)}
          disabled={disabled}
        >
          <SelectTrigger id="activity-select" className="w-full">
            <SelectValue placeholder="请选择活动" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-full">
            {activities.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                暂无可用活动
              </div>
            ) : (
              activities.map((activity) => (
                <SelectItem
                  key={activity.id}
                  value={activity.id.toString()}
                >
                  {activity.activityName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
