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
import { Event } from "./scheduler";

const eventUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  address: z.string().optional(),
});

type EventUpdateFormValues = z.infer<typeof eventUpdateSchema>;

interface EventUpdateFormProps {
  event: Event;
  onSubmit: (updates: Partial<Event>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function EventUpdateForm({
  event,
  onSubmit,
  onCancel,
  onDelete,
}: EventUpdateFormProps) {
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      address: "",
    } as EventUpdateFormValues,
    validators: {
      onSubmit: eventUpdateSchema,
    },
    onSubmit: ({ value }) => {
      const updates: Partial<Event> = {};
      if (value.title) updates.title = value.title;
      if (value.description !== undefined)
        updates.description = value.description || undefined;
      if (value.startDate) updates.startDate = new Date(value.startDate);
      if (value.endDate) updates.endDate = new Date(value.endDate);
      if (value.address !== undefined)
        updates.address = value.address || undefined;
      onSubmit(updates);
    },
  });

  React.useEffect(() => {
    form.reset({
      title: event.title,
      description: event.description || "",
      startDate: format(event.startDate, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(event.endDate, "yyyy-MM-dd'T'HH:mm"),
      address: event.address || "",
    });
  }, [event, form]);

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
              required={false}
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

      <div className="flex justify-between gap-2 mt-4">
        <div>
          {onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
            >
              删除
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit" disabled={!form.state.canSubmit}>
            保存
          </Button>
        </div>
      </div>
    </form>
  );
}
