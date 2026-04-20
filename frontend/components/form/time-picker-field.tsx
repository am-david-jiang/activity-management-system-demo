"use client";

import { TimePicker } from "@/components/ui/time-picker";

interface TimePickerFieldProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
}

export function TimePickerField({ value, onChange }: TimePickerFieldProps) {
  return <TimePicker value={value} onChange={onChange} />;
}
