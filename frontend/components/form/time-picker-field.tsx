"use client";

import { TimePicker } from "@/components/ui/time-picker";

interface TimePickerFieldProps {
  id: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
}

export function TimePickerField({ id, value, onChange }: TimePickerFieldProps) {
  return (
    <TimePicker id={id} value={value} onChange={onChange} />
  );
}