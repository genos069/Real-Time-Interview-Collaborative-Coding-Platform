import API from "./api";

export interface InterviewRoomRecord {
  roomId: string;
  title: string;
  targetRole: string;
  interviewType: string;
  candidateEmail: string;
  status: "CREATED" | "ACTIVE" | "COMPLETED";
  createdAt: string;
  startedAt?: string;
}

export const getCurrentInterviewRooms = async (): Promise<InterviewRoomRecord[]> => {
  const { data } = await API.get("/interviews/current");
  return data;
};

export const startInterviewRoom = async (roomId: string): Promise<InterviewRoomRecord> => {
  const { data } = await API.post(`/interviews/${roomId}/start`);
  return data;
};

export const joinInterviewRoom = async (roomId: string): Promise<InterviewRoomRecord> => {
  const { data } = await API.post(`/interviews/${roomId}/join`);
  return data;
};
