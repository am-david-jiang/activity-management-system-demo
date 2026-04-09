import type { Activity } from "./activity-api";

const API_BASE = "http://localhost:8000/api";

interface ApiResponse<T> {
  code: number;
  success: boolean;
  data: T | null;
  message: string;
}

export interface Participant {
  userId: string;
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

export async function getParticipant(userId: string): Promise<Participant> {
  const res = await fetch(`${API_BASE}/participants/${userId}`);
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
  userId: string,
  data: UpdateParticipantDto,
): Promise<void> {
  const processedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    processedData[key] = value || null;
  }
  const res = await fetch(`${API_BASE}/participants/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(processedData),
  });
  await handleResponse<Participant>(res);
}

export async function deleteParticipant(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/participants/${userId}`, {
    method: "DELETE",
  });
  await handleResponse<void>(res, "DELETE");
}
