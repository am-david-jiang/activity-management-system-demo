"use client";

import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";

interface TextareaFieldProps {
  name: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  errors?: Array<{ message?: string } | undefined>;
  required?: boolean;
}

export function TextareaField({
  name,
  label,
  value,
  onChange,
  onBlur,
  errors,
  required = true,
}: TextareaFieldProps) {
  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <FieldContent>
        <Textarea
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        <FieldError errors={errors} />
      </FieldContent>
    </Field>
  );
}
