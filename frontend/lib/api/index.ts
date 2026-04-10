// Re-export all APIs for backwards compatibility
export {
  type Activity,
  type CreateActivityDto,
  type UpdateActivityDto,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  finishActivity,
  getActiveActivities,
  getActivityParticipants,
  addParticipantToActivity,
} from "./activity-api";

export {
  type Participant,
  type CreateParticipantDto,
  type UpdateParticipantDto,
  type SearchParticipantDto,
  type PaginatedParticipants,
  searchParticipants,
  getParticipant,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getParticipants,
} from "./participant-api";
