"use client";

import * as React from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

export function TimePicker({
    value,
    onChange,
    placeholder = "选择时间",
    className,
}: TimePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [selectedHour, setSelectedHour] = React.useState<number | null>(
        value ? value.getHours() : null,
    );
    const [selectedMinute, setSelectedMinute] = React.useState<number | null>(
        value ? value.getMinutes() : null,
    );

    const handleHourSelect = (hour: number) => {
        setSelectedHour(hour);
    };

    const handleMinuteSelect = (minute: number) => {
        setSelectedMinute(minute);
        const newDate = new Date();
        newDate.setHours(selectedHour ?? 0);
        newDate.setMinutes(minute);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        onChange(newDate);
        setOpen(false);
    };

    const displayValue = value ? format(value, "HH:mm") : placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className,
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {displayValue}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                    <ScrollArea className="h-[200px] w-[80px] border-r">
                        <div className="flex flex-col">
                            {hours.map((hour) => (
                                <Button
                                    key={hour}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 w-full justify-center font-normal",
                                        selectedHour === hour &&
                                            "bg-primary text-primary-foreground hover:bg-primary/75 hover:text-primary-foreground",
                                    )}
                                    onClick={() => handleHourSelect(hour)}
                                >
                                    {hour.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                    <ScrollArea className="h-[200px] w-[80px]">
                        <div className="flex flex-col">
                            {minutes.map((minute) => (
                                <Button
                                    key={minute}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 w-full justify-center font-normal",
                                        selectedMinute === minute &&
                                            "bg-primary text-primary-foreground hover:bg-primary/75 hover:text-primary-foreground",
                                    )}
                                    onClick={() => handleMinuteSelect(minute)}
                                >
                                    {minute.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
}
