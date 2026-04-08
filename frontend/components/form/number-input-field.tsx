"use client";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";

interface NumberInputFieldProps {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
  errors?: Array<{ message?: string } | undefined>;
  step?: number;
}

export function NumberInputField({
  name,
  label,
  value,
  onChange,
  onBlur,
  errors,
  step,
}: NumberInputFieldProps) {
  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor={name}>
        {label}
        <span className="text-destructive">*</span>
      </FieldLabel>
      <FieldContent>
        <Input
          id={name}
          type="number"
          step={step}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={onBlur}
        />
        <FieldError errors={errors} />
      </FieldContent>
    </Field>
  );
}
