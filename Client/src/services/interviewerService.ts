import API from "./api";

export interface CandidateReviewItem {
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  targetRole?: string;
  score: number;
  interviewId?: string;
  roomId?: string;
  interviewTitle?: string;
  decision?: string;
  initials?: string;
  color?: string;
  createdAt?: string;
}

export interface InterviewerDashboardData {
  interviewsConducted: number;
  candidatesReviewed: number;
  averageScoreGiven?: number | null;
  recentCandidateReviews: CandidateReviewItem[];
}

export const getInterviewerDashboard = async (): Promise<InterviewerDashboardData> => {
  const response = await API.get("/interviewer/dashboard");
  return response.data;
};

export interface InterviewerProfile {
  id?: string;
  name: string;
  email: string;
  role?: string;
  title?: string;
  location?: string;
  avatar?: string;
  about?: string;
}

export const getInterviewerProfile = async (): Promise<InterviewerProfile> => {
  const response = await API.get("/user/me");
  return response.data;
};

export const updateInterviewerProfile = async (
  data: Partial<InterviewerProfile>
): Promise<InterviewerProfile> => {
  const response = await API.put("/user/me", data);
  return response.data;
};

export const getInterviewRooms = async () => {
  const response = await API.get("/interviewer/rooms");
  return response.data;
};

export const createInterviewRoom = async (data: any) => {
  const response = await API.post("/interviewer/rooms", data);
  return response.data;
};