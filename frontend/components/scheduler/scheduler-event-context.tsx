"use client";

import * as React from "react";
import { format } from "date-fns";
import { Event } from "./scheduler";

interface SchedulerEventContextValue {
  events: Event[];
  addEvent: (event: Omit<Event, "id">) => void;
  updateEvent: (id: number, updates: Partial<Event>) => void;
  removeEvent: (id: number) => void;
  getEventsForDate: (date: Date) => Event[];
}

const SchedulerEventContext =
  React.createContext<SchedulerEventContextValue | null>(null);

export function useSchedulerEvent() {
  const context = React.useContext(SchedulerEventContext);
  if (!context) {
    throw new Error(
      "useSchedulerEvent must be used within SchedulerEventProvider",
    );
  }
  return context;
}

interface SchedulerEventProviderProps {
  children: React.ReactNode;
  events: Event[];
  onAddEvent?: (event: Event) => void;
  onUpdateEvent?: (event: Event) => void;
  onRemoveEvent?: (id: number) => void;
}

export function SchedulerEventProvider({
  children,
  events,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
}: SchedulerEventProviderProps) {
  const addEvent = React.useCallback(
    (event: Omit<Event, "id">) => {
      const newEvent: Event = {
        ...event,
        id: Date.now(),
      };
      onAddEvent?.(newEvent);
    },
    [onAddEvent],
  );

  const updateEvent = React.useCallback(
    (id: number, updates: Partial<Event>) => {
      const changedEvent = { ...events.find((e) => e.id === id), ...updates } as Event;
      onUpdateEvent?.(changedEvent);
    },
    [events, onUpdateEvent],
  );

  const removeEvent = React.useCallback(
    (id: number) => {
      onRemoveEvent?.(id);
    },
    [onRemoveEvent],
  );

  const getEventsForDate = React.useCallback(
    (date: Date) => {
      const targetDate = format(date, "yyyy-MM-dd");
      return events.filter((event) => {
        const eventDate = format(event.startDate, "yyyy-MM-dd");
        return eventDate === targetDate;
      });
    },
    [events],
  );

  const contextValue = React.useMemo(
    () => ({
      events,
      addEvent,
      updateEvent,
      removeEvent,
      getEventsForDate,
    }),
    [events, addEvent, updateEvent, removeEvent, getEventsForDate],
  );

  return (
    <SchedulerEventContext.Provider value={contextValue}>
      {children}
    </SchedulerEventContext.Provider>
  );
}
