"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { TextInputField } from "@/components/form/text-input-field";
import { TextareaField } from "@/components/form/textarea-field";
import { useSchedulerEvent } from "./scheduler-event-context";
import type { Event } from "./scheduler";

const addEventSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().optional(),
  startDate: z.string().min(1, "开始时间不能为空"),
  endDate: z.string().min(1, "结束时间不能为空"),
  address: z.string().optional(),
});

type AddEventFormValues = z.infer<typeof addEventSchema>;

interface AddEventFormProps {
  isOpen?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function AddEventForm({ isOpen, onSuccess, onCancel, initialStartDate, initialEndDate }: AddEventFormProps) {
  const { addEvent } = useSchedulerEvent();

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      address: "",
    } as AddEventFormValues,
    validators: {
      onSubmit: addEventSchema,
    },
    onSubmit: ({ value }) => {
      const newEvent = {
        title: value.title,
        description: value.description || undefined,
        startDate: new Date(value.startDate),
        endDate: new Date(value.endDate),
        address: value.address || "",
      };
      addEvent(newEvent);
      form.reset();
      onSuccess?.();
    },
  });

  React.useEffect(() => {
    if (initialStartDate && initialEndDate) {
      form.reset({
        title: "",
        description: "",
        startDate: format(initialStartDate, "yyyy-MM-dd'T'HH:mm"),
        endDate: format(initialEndDate, "yyyy-MM-dd'T'HH:mm"),
        address: "",
      });
    }
  }, [initialStartDate, initialEndDate, form]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="grid gap-4">
        <form.Field
          name="title"
          /* eslint-disable-next-line react/no-children-prop */
          children={(field) => (
            <TextInputField
              name={field.name}
              label="标题"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              errors={field.state.meta.errors}
              required={true}
            />
          )}
        />

        <form.Field
          name="description"
          /* eslint-disable-next-line react/no-children-prop */
          children={(field) => (
            <TextareaField
              name={field.name}
              label="描述"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              errors={field.state.meta.errors}
              required={false}
            />
          )}
        />

        <form.Field
          name="startDate"
          /* eslint-disable-next-line react/no-children-prop */
          children={(field) => (
            <Field orientation="vertical">
              <FieldLabel htmlFor={field.name}>开始时间</FieldLabel>
              <FieldContent>
                <input
                  type="datetime-local"
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
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
              <FieldLabel htmlFor={field.name}>结束时间</FieldLabel>
              <FieldContent>
                <input
                  type="datetime-local"
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                />
                <FieldError errors={field.state.meta.errors} />
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="address"
          /* eslint-disable-next-line react/no-children-prop */
          children={(field) => (
            <TextInputField
              name={field.name}
              label="地址"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              errors={field.state.meta.errors}
              required={false}
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={!form.state.canSubmit}>
          创建
        </Button>
      </div>
    </form>
  );
}
