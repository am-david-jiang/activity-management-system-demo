"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSchedulerEvent } from "./scheduler-event-context";
import { EventUpdateForm } from "./event-update-form";
import { Event } from "./scheduler";

interface EventItemProps {
  event: Event;
  left: number;
  width: number;
  onClick?: () => void;
}

function timeToPercent(date: Date): number {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  return (totalMinutes / (24 * 60)) * 100;
}

function durationToPercent(startDate: Date, endDate: Date): number {
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMinutes = durationMs / (1000 * 60);
  return (durationMinutes / (24 * 60)) * 100;
}

const EVENT_COLORS = [
  "bg-lime-50",
  "bg-lime-50",
  "bg-lime-50",
  "bg-lime-50",
  "bg-lime-50",
];

function getEventColor(event: Event): string {
  if (event.id) {
    return EVENT_COLORS[event.id % EVENT_COLORS.length];
  }
  return EVENT_COLORS[0];
}

export function EventItem({ event, left, width, onClick }: EventItemProps) {
  const top = timeToPercent(event.startDate);
  const height = Math.max(durationToPercent(event.startDate, event.endDate), 2);
  const variant = height < 5 ? "compact" : "filled";
  const bgColor = getEventColor(event);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { updateEvent, removeEvent } = useSchedulerEvent();

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          data-scheduler-event="true"
          className={`absolute rounded-sm p-2 cursor-pointer transition-colors hover:opacity-90 overflow-hidden ${bgColor} border-l-4 border-l-lime-700`}
          style={{
            top: `${top}%`,
            height: `${height}%`,
            left: `${left}%`,
            width: `${width}%`,
          }}
          onClick={onClick}
        >
          {variant === "filled" ? (
            <>
              <div className="font-medium text-sm truncate text-foreground">
                {event.title}
              </div>
              <div className="text-xs opacity-80 text-foreground">
                {format(event.startDate, "HH:mm", { locale: zhCN })} -{" "}
                {format(event.endDate, "HH:mm", { locale: zhCN })}
              </div>
              {event.address && (
                <div className="text-xs truncate opacity-70 text-foreground">
                  {event.address}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs truncate text-foreground">
              {format(event.startDate, "HH:mm", { locale: zhCN })} {event.title}
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <EventUpdateForm
          event={event}
          onCancel={() => setPopoverOpen(false)}
          onDelete={() => {
            removeEvent(event.id);
            setPopoverOpen(false);
          }}
          onSubmit={(updates) => {
            updateEvent(event.id, updates);
            setPopoverOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
