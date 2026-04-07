"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Activity, CreateActivityDto } from "@/lib/api";

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateActivityDto) => void;
  initialData?: Activity;
  mode: "create" | "edit";
}

export function ActivityForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: ActivityFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreateActivityDto = {
      activityName: formData.get("activityName") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      applyEndDate: formData.get("applyEndDate") as string,
      budget: Number(formData.get("budget")),
    };
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "创建新活动" : "编辑活动"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? "填写以下信息来创建新活动" : "修改活动信息"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activityName" className="text-right">
                活动名称
              </Label>
              <Input
                id="activityName"
                name="activityName"
                defaultValue={initialData?.activityName}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                开始日期
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={initialData?.startDate?.split("T")[0]}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                结束日期
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={initialData?.endDate?.split("T")[0]}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="applyEndDate" className="text-right">
                报名截止日期
              </Label>
              <Input
                id="applyEndDate"
                name="applyEndDate"
                type="date"
                defaultValue={initialData?.applyEndDate?.split("T")[0]}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget" className="text-right">
                预算
              </Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                defaultValue={initialData?.budget}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">确认</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
