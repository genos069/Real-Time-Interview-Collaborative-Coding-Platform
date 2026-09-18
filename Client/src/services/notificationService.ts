import API from "./api";

export type NotificationType =
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEWER_WAITING"
  | "CANDIDATE_JOINED"
  | "INTERVIEW_COMPLETED"
  | "INTERVIEW_SCORE_RECEIVED"
  | "CANDIDATE_REVIEW_RECEIVED"
  | "EVALUATION_PENDING";

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedInterviewId?: string;
  roomId?: string;
  read: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<NotificationItem[]> => {
  const { data } = await API.get("/notifications");
  return data;
};

export const markNotificationAsRead = async (id: string): Promise<NotificationItem> => {
  const { data } = await API.put(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await API.put("/notifications/read-all");
};
