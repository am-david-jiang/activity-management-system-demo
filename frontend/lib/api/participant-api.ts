import { authClient } from "./client";
import { handleResponseWithAuth } from "./response";
import type { Activity } from "./activity-api";

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

export type UpdateParticipantDto = Partial<CreateParticipantDto>;

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

  const res = await authClient.get(`participants/search?${searchParams}`);
  return (
    (await handleResponseWithAuth<PaginatedParticipants>(res)) ?? {
      data: [],
      total: 0,
      page: 1,
      size: 10,
    }
  );
}

export async function getParticipant(userId: string): Promise<Participant> {
  const res = await authClient.get(`participants/${userId}`);
  return (await handleResponseWithAuth<Participant>(res)) as Participant;
}

export async function createParticipant(
  data: CreateParticipantDto,
): Promise<void> {
  const res = await authClient.post("participants", { json: data });
  await handleResponseWithAuth<Participant>(res);
}

export async function updateParticipant(
  userId: string,
  data: UpdateParticipantDto,
): Promise<void> {
  const processedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    processedData[key] = value || null;
  }
  const res = await authClient.patch(`participants/${userId}`, { json: processedData });
  await handleResponseWithAuth<Participant>(res);
}

export async function deleteParticipant(userId: string): Promise<void> {
  const res = await authClient.delete(`participants/${userId}`);
  await handleResponseWithAuth<void>(res);
}

export async function getParticipants(): Promise<Participant[]> {
  const res = await authClient.get("participants");
  return (await handleResponseWithAuth<Participant[]>(res)) ?? [];
}
