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
import { TextInputField } from "@/components/form/text-input-field";
import { Participant, CreateParticipantDto } from "@/lib/api";

const participantSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  email: z.string().optional(),
  phoneNumber: z.string().min(1, "手机号码不能为空"),
  weixinAccount: z.string().optional(),
  qqAccount: z.string().optional(),
});

type ParticipantFormValues = z.infer<typeof participantSchema>;

function toFormValues(participant: Participant): ParticipantFormValues {
  return {
    name: participant.name,
    email: participant.email || "",
    phoneNumber: participant.phoneNumber,
    weixinAccount: participant.weixinAccount || "",
    qqAccount: participant.qqAccount || "",
  };
}

function toSubmitValues(values: ParticipantFormValues): CreateParticipantDto {
  return {
    name: values.name,
    email: values.email || undefined,
    phoneNumber: values.phoneNumber,
    weixinAccount: values.weixinAccount || undefined,
    qqAccount: values.qqAccount || undefined,
  };
}

interface ParticipantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ParticipantFormValues) => void;
  initialData?: Participant;
  mode: "create" | "edit";
}

export function ParticipantForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: ParticipantFormProps) {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      weixinAccount: "",
      qqAccount: "",
    } as ParticipantFormValues,
    validators: {
      onSubmit: participantSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(toSubmitValues(value));
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
            {mode === "create" ? "添加参与者" : "编辑参与者"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "填写以下信息来添加新参与者"
              : "修改参与者信息"}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <form.Field name="name">
              {(field) => (
                <TextInputField
                  name={field.name}
                  label="姓名"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                />
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <TextInputField
                  name={field.name}
                  label="电子邮箱"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  required={false}
                />
              )}
            </form.Field>

            <form.Field name="phoneNumber">
              {(field) => (
                <TextInputField
                  name={field.name}
                  label="手机号码"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                />
              )}
            </form.Field>

            <form.Field name="weixinAccount">
              {(field) => (
                <TextInputField
                  name={field.name}
                  label="微信号"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  required={false}
                />
              )}
            </form.Field>

            <form.Field name="qqAccount">
              {(field) => (
                <TextInputField
                  name={field.name}
                  label="QQ号"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  errors={field.state.meta.errors}
                  required={false}
                />
              )}
            </form.Field>
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
