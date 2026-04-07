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

export interface UpdateActivityDto extends Partial<CreateActivityDto> {}

async function handleResponse<T>(res: globalThis.Response): Promise<T | null> {
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
  await handleResponse<void>(res);
}

export async function finishActivity(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/activities/${id}/finish`, {
    method: "POST",
  });
  await handleResponse<Activity>(res);
}
