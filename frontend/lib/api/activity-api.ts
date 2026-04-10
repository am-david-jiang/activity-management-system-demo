const API_BASE = "http://localhost:8000/api";

interface ApiResponse<T> {
  code: number;
  success: boolean;
  data: T | null;
  message: string;
}

export interface Activity {
  id: number;
  activityName: string;
  startDate: string;
  endDate: string;
  budget: number;
  applyEndDate: string;
  status: "active" | "finished";
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityDto {
  activityName: string;
  startDate: string;
  endDate: string;
  budget: number;
  applyEndDate: string;
}

export type UpdateActivityDto = Partial<CreateActivityDto>;

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

export async function getActivities(): Promise<Activity[]> {
  const res = await fetch(`${API_BASE}/activities`);
  const activities = (await handleResponse<Activity[]>(res)) ?? [];
  return activities;
}

export async function createActivity(data: CreateActivityDto): Promise<void> {
  const res = await fetch(`${API_BASE}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await handleResponse<Activity>(res);
}

export async function updateActivity(
  id: number,
  data: UpdateActivityDto,
): Promise<void> {
  const res = await fetch(`${API_BASE}/activities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await handleResponse<Activity>(res);
}

export async function deleteActivity(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/activities/${id}`, {
    method: "DELETE",
  });
  await handleResponse<void>(res, "DELETE");
}

export async function finishActivity(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/activities/${id}/finish`, {
    method: "POST",
  });
  await handleResponse<Activity>(res);
}

export async function getActiveActivities(): Promise<Activity[]> {
  const res = await fetch(`${API_BASE}/activities/active`);
  return (await handleResponse<Activity[]>(res)) ?? [];
}

export async function getActivityParticipants(
  activityId: number,
): Promise<import("./participant-api").Participant[]> {
  const res = await fetch(`${API_BASE}/activities/${activityId}/participants`);
  return (await handleResponse<import("./participant-api").Participant[]>(res)) ?? [];
}

export async function addParticipantToActivity(
  activityId: number,
  userId: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/activities/${activityId}/participants/${userId}`, {
    method: "POST",
  });
  await handleResponse<void>(res);
}
