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

// Participant types
export interface Participant {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  weixinAccount: string;
  qqAccount: string;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantDto {
  name: string;
  email?: string;
  phoneNumber: string;
  weixinAccount?: string;
  qqAccount?: string;
}

export interface UpdateParticipantDto extends Partial<CreateParticipantDto> {}

export interface SearchParticipantDto {
  keyword?: string;
  email?: string;
  phoneNumber?: string;
  page?: number;
  size?: number;
}

export interface PaginatedParticipants {
  data: Participant[];
  total: number;
  page: number;
  size: number;
}

export async function searchParticipants(
  params: SearchParticipantDto,
): Promise<PaginatedParticipants> {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.set("keyword", params.keyword);
  if (params.email) searchParams.set("email", params.email);
  if (params.phoneNumber) searchParams.set("phoneNumber", params.phoneNumber);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("size", String(params.size ?? 10));

  const res = await fetch(`${API_BASE}/participants/search?${searchParams}`);
  return (
    (await handleResponse<PaginatedParticipants>(res)) ?? {
      data: [],
      total: 0,
      page: 1,
      size: 10,
    }
  );
}

export async function getParticipant(id: number): Promise<Participant> {
  const res = await fetch(`${API_BASE}/participants/${id}`);
  return (await handleResponse<Participant>(res)) as Participant;
}

export async function createParticipant(
  data: CreateParticipantDto,
): Promise<void> {
  const res = await fetch(`${API_BASE}/participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await handleResponse<Participant>(res);
}

export async function updateParticipant(
  id: number,
  data: UpdateParticipantDto,
): Promise<void> {
  const processedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    processedData[key] = value || null;
  }
  const res = await fetch(`${API_BASE}/participants/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(processedData),
  });
  await handleResponse<Participant>(res);
}

export async function deleteParticipant(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/participants/${id}`, {
    method: "DELETE",
  });
  await handleResponse<void>(res);
}
