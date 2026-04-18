import { authClient } from "./client";
import { handleResponseWithAuth } from "./response";

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

export async function getActivities(): Promise<Activity[]> {
  const res = await authClient.get("activities");
  return (await handleResponseWithAuth<Activity[]>(res)) ?? [];
}

export async function createActivity(data: CreateActivityDto): Promise<void> {
  const res = await authClient.post("activities", { json: data });
  await handleResponseWithAuth<Activity>(res);
}

export async function updateActivity(
  id: number,
  data: UpdateActivityDto,
): Promise<void> {
  const res = await authClient.patch(`activities/${id}`, { json: data });
  await handleResponseWithAuth<Activity>(res);
}

export async function deleteActivity(id: number): Promise<void> {
  const res = await authClient.delete(`activities/${id}`);
  await handleResponseWithAuth<void>(res);
}

export async function finishActivity(id: number): Promise<void> {
  const res = await authClient.post(`activities/${id}/finish`);
  await handleResponseWithAuth<Activity>(res);
}

export async function getActiveActivities(): Promise<Activity[]> {
  const res = await authClient.get("activities/active");
  return (await handleResponseWithAuth<Activity[]>(res)) ?? [];
}

export async function getActivityParticipants(
  activityId: number,
): Promise<import("./participant-api").Participant[]> {
  const res = await authClient.get(`activities/${activityId}/participants`);
  return (await handleResponseWithAuth<import("./participant-api").Participant[]>(res)) ?? [];
}

export async function addParticipantToActivity(
  activityId: number,
  userId: string,
): Promise<void> {
  const res = await authClient.post(`activities/${activityId}/participants/${userId}`);
  await handleResponseWithAuth<void>(res);
}
