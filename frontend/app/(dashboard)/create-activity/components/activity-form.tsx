"use client";

import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { DatePickerField } from "@/components/form/date-picker-field";
import { TextInputField } from "@/components/form/text-input-field";
import { NumberInputField } from "@/components/form/number-input-field";
import { Activity, CreateActivityDto, UpdateActivityDto } from "@/lib/api";

const activitySchema = z
  .object({
    activityName: z.string().min(1, "活动名称不能为空"),
    startDate: z.date({ message: "开始日期不能为空" }),
    endDate: z.date({ message: "结束日期不能为空" }),
    applyEndDate: z.date({ message: "报名截止日期不能为空" }),
    budget: z.number({ message: "预算不能为空" }).positive("预算必须为正数"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "结束日期必须晚于开始日期",
    path: ["endDate"],
  })
  .refine((data) => data.applyEndDate <= data.startDate, {
    message: "报名截止日期必须不晚于开始日期",
    path: ["applyEndDate"],
  });

type ActivityFormValues = z.infer<typeof activitySchema>;

function toFormValues(activity: Activity): ActivityFormValues {
  return {
    activityName: activity.activityName,
    startDate: new Date(activity.startDate),
    endDate: new Date(activity.endDate),
    applyEndDate: new Date(activity.applyEndDate),
    budget: activity.budget,
  };
}

function toCreateActivityDto(values: ActivityFormValues): CreateActivityDto {
  return {
    activityName: values.activityName,
    startDate: values.startDate?.toISOString() ?? "",
    endDate: values.endDate?.toISOString() ?? "",
    applyEndDate: values.applyEndDate?.toISOString() ?? "",
    budget: values.budget,
  };
}

function toUpdateActivityDto(
  values: ActivityFormValues,
  id: number,
): UpdateActivityDto {
  return {
    ...toCreateActivityDto(values),
    id,
  };
}

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateActivityDto | UpdateActivityDto) => void;
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
  const form = useForm({
    defaultValues: {
      activityName: "",
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined,
      applyEndDate: undefined as Date | undefined,
      budget: 0,
    },
    validators: {
      onSubmit: activitySchema,
    },
    onSubmit: ({ value }) => {
      if (mode === "edit" && initialData) {
        onSubmit(toUpdateActivityDto(value, initialData.id));
      } else {
        onSubmit(toCreateActivityDto(value));
      }
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset(toFormValues(initialData));
      } else {
        form.reset();
      }
    }
  }, [open, initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "创建新活动" : "编辑活动"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? "填写以下信息来创建新活动" : "修改活动信息"}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <form.Field
              name="activityName"
              /* eslint-disable-next-line react/no-children-prop */
              children={(field) => (
                <TextInputField
                  name={field.name}
                  label="活动名称"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                />
              )}
            />

            <form.Field
              name="startDate"
              /* eslint-disable-next-line react/no-children-prop */
              children={(field) => (
                <Field orientation="vertical">
                  <FieldLabel htmlFor={field.name}>
                    开始日期
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <DatePickerField
                      id={field.name}
                      value={field.state.value}
                      onChange={field.handleChange}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            />

            <form.Field
              name="endDate"
              /* eslint-disable-next-line react/no-children-prop */
              children={(field) => (
                <Field orientation="vertical">
                  <FieldLabel htmlFor={field.name}>
                    结束日期
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <DatePickerField
                      id={field.name}
                      value={field.state.value}
                      onChange={field.handleChange}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            />

            <form.Field
              name="applyEndDate"
              /* eslint-disable-next-line react/no-children-prop */
              children={(field) => (
                <Field orientation="vertical">
                  <FieldLabel htmlFor={field.name}>
                    报名截止日期
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <DatePickerField
                      id={field.name}
                      value={field.state.value}
                      onChange={field.handleChange}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            />

            <form.Field
              name="budget"
              /* eslint-disable-next-line react/no-children-prop */
              children={(field) => (
                <NumberInputField
                  name={field.name}
                  label="预算"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  step={0.01}
                />
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!form.state.canSubmit}>
              确认
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
