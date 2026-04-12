"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format, addDays, subDays, addMinutes } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { useSchedulerEvent } from "./scheduler-event-context";
import { EventItem } from "./event-item";
import { AddEventForm } from "./add-event-form";
import { Event } from "./scheduler";

interface DailyViewProps {
  defaultVisibleDate?: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Overlap detection helpers
function eventsOverlap(a: Event, b: Event): boolean {
  return a.startDate < b.endDate && b.startDate < a.endDate;
}

function buildOverlapGraph(events: Event[]): Map<number, number[]> {
  const graph = new Map<number, number[]>();
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (eventsOverlap(events[i], events[j])) {
        if (!graph.has(events[i].id)) graph.set(events[i].id, []);
        if (!graph.has(events[j].id)) graph.set(events[j].id, []);
        graph.get(events[i].id)!.push(events[j].id);
        graph.get(events[j].id)!.push(events[i].id);
      }
    }
  }
  return graph;
}

function findEventGroups(events: Event[]): Event[][] {
  const graph = buildOverlapGraph(events);
  const visited = new Set<number>();
  const groups: Event[][] = [];
  const eventsMap = new Map(events.map((e) => [e.id, e]));

  function dfs(eventId: number, group: Event[]) {
    visited.add(eventId);
    const event = eventsMap.get(eventId);
    if (event) group.push(event);
    const neighbors = graph.get(eventId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        dfs(neighborId, group);
      }
    }
  }

  for (const event of events) {
    if (!visited.has(event.id)) {
      const group: Event[] = [];
      dfs(event.id, group);
      if (group.length > 0) groups.push(group);
    }
  }

  return groups;
}

function assignPositions(
  group: Event[],
): Map<number, { left: number; width: number }> {
  const positions = new Map<number, { left: number; width: number }>();
  const sorted = [...group].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );
  const columns = sorted.length;

  sorted.forEach((event, index) => {
    positions.set(event.id, {
      left: (index / columns) * 100,
      width: (1 / columns) * 100,
    });
  });

  return positions;
}

export function DailyView({ defaultVisibleDate = new Date() }: DailyViewProps) {
  const [currentDate, setCurrentDate] = useState(defaultVisibleDate);
  const [timelinePosition, setTimelinePosition] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [draftEvent, setDraftEvent] = useState<
    (Event & { top: number }) | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);

  const { getEventsForDate, addEvent } = useSchedulerEvent();
  const dayEvents = getEventsForDate(currentDate);

  const positionedEvents = useMemo(() => {
    const groups = findEventGroups(dayEvents);
    const result: Array<Event & { left: number; width: number }> = [];

    for (const group of groups) {
      const positions = assignPositions(group);
      for (const event of group) {
        const pos = positions.get(event.id);
        if (pos) {
          result.push({ ...event, left: pos.left, width: pos.width });
        }
      }
    }

    return result;
  }, [dayEvents]);

  // Draft event for click-to-create
  const draftTop = draftEvent ? (draftEvent.top / (24 * 60)) * 100 : 0;
  const draftHeightPercent = (30 / (24 * 60)) * 100;

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const target = e.target as HTMLElement;
    if (target !== gridRef.current) {
      return;
    }
    const rect = gridRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const percentage = relativeY / rect.height;
    const totalMinutes = Math.floor(percentage * 24 * 60);
    const snappedMinutes = Math.floor(totalMinutes / 30) * 30; // Snap to 30-min intervals (floor)
    const hours = Math.floor(snappedMinutes / 60);
    const minutes = snappedMinutes % 60;
    const startDate = new Date(currentDate);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMinutes(startDate, 30);
    const top = snappedMinutes;
    setDraftEvent({
      id: -Date.now(),
      title: "",
      startDate,
      endDate,
      address: "",
      top,
    });
    setIsCreating(true);
  };

  const handlePrevDay = () => setCurrentDate((d) => subDays(d, 1));
  const handleNextDay = () => setCurrentDate((d) => addDays(d, 1));

  // Update timeline position every minute
  useEffect(() => {
    const updateTimeline = () => {
      if (!gridRef.current) return;
      const now = new Date();
      const isToday =
        format(now, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");
      if (!isToday) {
        setTimelinePosition(null);
        return;
      }
      const totalMinutes = now.getHours() * 60 + now.getMinutes();
      const totalMinutesInDay = 24 * 60;
      const percentage = (totalMinutes / totalMinutesInDay) * 100;
      setTimelinePosition(percentage);
    };

    updateTimeline();
    const interval = setInterval(updateTimeline, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const formattedDate = format(currentDate, "yyyy年M月d日 EEE", {
    locale: zhCN,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Header with date title and navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{formattedDate}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevDay}>
            <ChevronLeft className="size-4 mr-1" />
            前一天
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextDay}>
            后一天
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Row 2: Time grid */}
      <div className="relative flex bg-background overflow-hidden">
        {/* Hour labels column */}
        <div className="flex flex-col w-12 shrink-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[4.5rem] flex items-start justify-end pr-1 pb-1 text-xs text-muted-foreground leading-none"
            >
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Hour grid column */}
        <div
          ref={gridRef}
          className="relative flex-1 border-b"
          onClick={handleGridClick}
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 4.5rem)`,
          }}
        >
          {/* Timeline indicator */}
          {timelinePosition !== null && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
              style={{ top: `${timelinePosition}%` }}
            >
              <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
            </div>
          )}

          {/* Draft event for click-to-create */}
          {draftEvent && (
            <Popover
              open={isCreating}
              onOpenChange={(open) => {
                if (!open) {
                  setIsCreating(false);
                  setDraftEvent(null);
                }
              }}
            >
              <PopoverAnchor asChild>
                <div
                  className="absolute left-0 w-full border-2 border-dashed border-muted-foreground/50 bg-muted/30 z-20 pointer-events-none"
                  style={{
                    top: `${draftTop}%`,
                    height: `${draftHeightPercent}%`,
                  }}
                />
              </PopoverAnchor>
              <PopoverContent
                data-add-event-form
                className="w-80"
                align="start"
              >
                <AddEventForm
                  isOpen={isCreating}
                  initialStartDate={draftEvent?.startDate}
                  initialEndDate={draftEvent?.endDate}
                  onSuccess={() => {
                    setIsCreating(false);
                    setDraftEvent(null);
                  }}
                  onCancel={() => {
                    setIsCreating(false);
                    setDraftEvent(null);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Event items */}
          {positionedEvents.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              left={event.left}
              width={event.width}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
