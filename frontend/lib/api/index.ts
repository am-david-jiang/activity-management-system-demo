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
} from "./participant-api";
