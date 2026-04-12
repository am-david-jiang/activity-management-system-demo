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
  onEventsChange: (events: Event[]) => void;
}

export function SchedulerEventProvider({
  children,
  events: initialEvents,
  onEventsChange,
}: SchedulerEventProviderProps) {
  const [events, setEvents] = React.useState(initialEvents);

  React.useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const addEvent = React.useCallback(
    (event: Omit<Event, "id">) => {
      const newEvent: Event = {
        ...event,
        id: Date.now(),
      };
      const updated = [...events, newEvent];
      setEvents(updated);
      onEventsChange?.(updated);
    },
    [events, onEventsChange],
  );

  const updateEvent = React.useCallback(
    (id: number, updates: Partial<Event>) => {
      const updated = events.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      );
      setEvents(updated);
      onEventsChange?.(updated);
    },
    [events, onEventsChange],
  );

  const removeEvent = React.useCallback(
    (id: number) => {
      const updated = events.filter((e) => e.id !== id);
      setEvents(updated);
      onEventsChange?.(updated);
    },
    [events, onEventsChange],
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
