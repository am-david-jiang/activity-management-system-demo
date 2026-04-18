import { authClient } from "./client";
import { handleResponseWithAuth } from "./response";

export interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  address: string;
  activityId: number;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  address: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  address?: string;
}

export async function getActivityEvents(activityId: number): Promise<Event[]> {
  const res = await authClient.get(`activities/${activityId}/events`);
  const data = (await handleResponseWithAuth<Event[]>(res)) ?? [];
  return data.map((event) => ({
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
  }));
}

export async function createActivityEvent(
  activityId: number,
  data: CreateEventDto,
): Promise<Event> {
  const res = await authClient.post(`activities/${activityId}/events`, { json: data });
  const event = await handleResponseWithAuth<Event>(res);
  if (!event) throw new Error("Failed to create event");
  return {
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
  };
}

export async function updateActivityEvent(
  activityId: number,
  eventId: number,
  data: UpdateEventDto,
): Promise<Event> {
  const res = await authClient.patch(`activities/${activityId}/events/${eventId}`, { json: data });
  const event = await handleResponseWithAuth<Event>(res);
  if (!event) throw new Error("Failed to update event");
  return {
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
  };
}

export async function deleteActivityEvent(
  activityId: number,
  eventId: number,
): Promise<void> {
  const res = await authClient.delete(`activities/${activityId}/events/${eventId}`);
  await handleResponseWithAuth<void>(res);
}
