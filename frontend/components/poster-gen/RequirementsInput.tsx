"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RequirementsInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export function RequirementsInput({
  value,
  onChange,
  disabled = false,
  maxLength = 500,
}: RequirementsInputProps) {
  const characterCount = value.length;
  const isNearLimit = characterCount >= maxLength * 0.9;
  const isAtLimit = characterCount >= maxLength;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="requirements-input">
          海报需求描述 <span className="text-destructive">*</span>
        </Label>
        <span
          className={cn(
            "text-xs",
            isAtLimit
              ? "text-destructive font-medium"
              : isNearLimit
                ? "text-yellow-600"
                : "text-muted-foreground"
          )}
        >
          {characterCount}/{maxLength}
        </span>
      </div>
      <Textarea
        id="requirements-input"
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            onChange(e.target.value);
          }
        }}
        disabled={disabled}
        placeholder="请描述您对海报的需求，例如：设计风格、颜色偏好、必须包含的信息等..."
        className="min-h-[120px] resize-none"
      />
      {value.length > 0 && value.length < 10 && (
        <p className="text-xs text-muted-foreground">
          需求描述至少需要 10 个字符
        </p>
      )}
    </div>
  );
}
