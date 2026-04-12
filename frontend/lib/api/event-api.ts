const API_BASE = "http://localhost:8000/api";

interface ApiResponse<T> {
  code: number;
  success: boolean;
  data: T | null;
  message: string;
}

async function handleResponse<T>(
  res: globalThis.Response,
  method?: string,
): Promise<T | null> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (method === "DELETE" && res.ok) {
    return null;
  }

  if (!isJson) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return null;
  }

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message);
  return json.data;
}

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
  const res = await fetch(`${API_BASE}/activities/${activityId}/events`);
  const data = (await handleResponse<Event[]>(res)) ?? [];
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
  const res = await fetch(`${API_BASE}/activities/${activityId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const event = await handleResponse<Event>(res);
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
  const res = await fetch(
    `${API_BASE}/activities/${activityId}/events/${eventId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  const event = await handleResponse<Event>(res);
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
  const res = await fetch(
    `${API_BASE}/activities/${activityId}/events/${eventId}`,
    {
      method: "DELETE",
    },
  );
  await handleResponse<void>(res, "DELETE");
}
