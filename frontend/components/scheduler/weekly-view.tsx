"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addDays, addMinutes, startOfWeek } from "date-fns";
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

interface WeeklyViewProps {
  defaultVisibleDay?: Date;
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

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 });
}

export function WeeklyView({
  defaultVisibleDay = new Date(),
}: WeeklyViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getWeekStart(defaultVisibleDay),
  );
  const [timelinePosition, setTimelinePosition] = useState<number | null>(null);
  const [draftEvent, setDraftEvent] = useState<
    (Event & { top: number }) | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creatingDate, setCreatingDate] = useState<Date | null>(null);

  const { getEventsForDate } = useSchedulerEvent();

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart],
  );

  const dayEventsMap = useMemo(() => {
    const map = new Map<number, Event[]>();
    for (const day of weekDays) {
      map.set(day.getTime(), getEventsForDate(day));
    }
    return map;
  }, [weekDays, getEventsForDate]);

  const positionedEventsMap = useMemo(() => {
    const result = new Map<
      number,
      Array<Event & { left: number; width: number }>
    >();

    for (const day of weekDays) {
      const dayEvents = dayEventsMap.get(day.getTime()) || [];
      const groups = findEventGroups(dayEvents);
      const positioned: Array<Event & { left: number; width: number }> = [];

      for (const group of groups) {
        const positions = assignPositions(group);
        for (const event of group) {
          const pos = positions.get(event.id);
          if (pos) {
            positioned.push({ ...event, left: pos.left, width: pos.width });
          }
        }
      }

      result.set(day.getTime(), positioned);
    }

    return result;
  }, [weekDays, dayEventsMap]);

  const draftTop = draftEvent ? (draftEvent.top / (24 * 60)) * 100 : 0;
  const draftHeightPercent = (30 / (24 * 60)) * 100;

  const handleGridClick =
    (day: Date) => (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const grid = target.closest(".day-grid");
      if (!grid) return;

      const rect = grid.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const percentage = relativeY / rect.height;
      const totalMinutes = Math.floor(percentage * 24 * 60);
      const snappedMinutes = Math.floor(totalMinutes / 30) * 30;
      const hours = Math.floor(snappedMinutes / 60);
      const minutes = snappedMinutes % 60;
      const startDate = new Date(day);
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
      setCreatingDate(day);
      setIsCreating(true);
    };

  const handlePrevWeek = () => setCurrentWeekStart((d) => addDays(d, -7));
  const handleNextWeek = () => setCurrentWeekStart((d) => addDays(d, 7));
  const handleToday = () => setCurrentWeekStart(getWeekStart(new Date()));

  // Update timeline position every minute
  useEffect(() => {
    const updateTimeline = () => {
      const now = new Date();
      const isThisWeek = weekDays.some(
        (day) => format(day, "yyyy-MM-dd") === format(now, "yyyy-MM-dd"),
      );
      if (!isThisWeek) {
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
  }, [weekDays]);

  const formattedWeekRange = useMemo(() => {
    const year = format(currentWeekStart, "yyyy年", { locale: zhCN });
    const start = format(currentWeekStart, "M月d日", { locale: zhCN });
    const end = format(addDays(currentWeekStart, 6), "M月d日", {
      locale: zhCN,
    });
    return `${year}${start} - ${end}`;
  }, [currentWeekStart]);

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Header with week range and navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{formattedWeekRange}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            今天
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <ChevronLeft className="size-4 mr-1" />
            上一周
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            下一周
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="flex bg-background overflow-hidden">
        <div className="w-12 shrink-0" />
        <div className="flex flex-1">
          {weekDays.map((day) => {
            const isToday =
              format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <div
                key={day.getTime()}
                className={`flex-1 text-center py-2 text-sm ${
                  isToday ? "font-bold text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="font-medium">
                  {format(day, "EEE", { locale: zhCN })}
                </div>
                <div
                  className={`text-lg ${
                    isToday
                      ? "bg-primary text-primary-foreground rounded-full w-8 h-8 inline-flex items-center justify-center"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid with 7 day columns */}
      <div className="relative flex bg-background overflow-hidden">
        {/* Hour labels column */}
        <div className="flex flex-col w-12 shrink-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-18 flex items-start justify-end pr-1 pb-1 text-xs text-muted-foreground leading-none"
            >
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex flex-1">
          {weekDays.map((day) => {
            const isToday =
              format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            const dayEvents = positionedEventsMap.get(day.getTime()) || [];

            return (
              <div
                key={day.getTime()}
                className="day-grid relative flex-1 border-b border-r last:border-r-0"
                onClick={handleGridClick(day)}
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 4.5rem)`,
                }}
              >
                {/* Timeline indicator */}
                {isToday && timelinePosition !== null && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                    style={{ top: `${timelinePosition}%` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Draft event for click-to-create */}
                {isCreating &&
                  creatingDate &&
                  format(creatingDate, "yyyy-MM-dd") ===
                    format(day, "yyyy-MM-dd") &&
                  draftEvent && (
                    <Popover
                      open={isCreating}
                      onOpenChange={(open) => {
                        if (!open) {
                          setIsCreating(false);
                          setDraftEvent(null);
                          setCreatingDate(null);
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
                            setCreatingDate(null);
                          }}
                          onCancel={() => {
                            setIsCreating(false);
                            setDraftEvent(null);
                            setCreatingDate(null);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                {/* Event items */}
                {dayEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    left={event.left}
                    width={event.width}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
