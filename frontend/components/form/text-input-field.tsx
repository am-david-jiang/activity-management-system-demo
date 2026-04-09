"use client";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";

interface TextInputFieldProps {
  name: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  errors?: Array<{ message?: string } | undefined>;
  required?: boolean;
}

export function TextInputField({
  name,
  label,
  value,
  onChange,
  onBlur,
  errors,
  required = true,
}: TextInputFieldProps) {
  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <FieldContent>
        <Input
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
