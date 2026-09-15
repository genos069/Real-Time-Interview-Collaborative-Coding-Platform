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

export interface InterviewDetailsResponse {
  id: string;
  roomId: string;
  title: string;
  targetRole: string;
  interviewType: string;
  interviewerId: string;
  candidateId: string;
  candidateEmail: string;
  observerId?: string | null;
  status: "CREATED" | "ACTIVE" | "COMPLETED";
  createdAt?: string;
  startedAt?: string;
  currentCode?: string;
  language?: string;
}

export const getInterviewRoom = async (roomId: string): Promise<InterviewDetailsResponse> => {
  const { data } = await API.get(`/interviews/${roomId}`);
  return data;
};

export const joinInterviewRoom = async (roomId: string): Promise<InterviewRoomRecord> => {
  const { data } = await API.post(`/interviews/${roomId}/join`);
  return data;
};

export interface CodeSnapshotResponse {
  roomId: string;
  currentCode: string;
  language: string;
}

export const getInterviewCodeSnapshot = async (roomId: string): Promise<CodeSnapshotResponse> => {
  const { data } = await API.get(`/interviews/${roomId}/code`);
  return data;
};

export interface CodeSyncMessage {
  roomId: string;
  senderUserId?: string;
  senderRole?: string;
  code?: string | null;
  language?: string;
  cursorPosition?: number | null;
}

export interface RunInterviewCodeRequest {
  language: string;
  code: string;
  input?: string;
}

export interface RunInterviewCodeResponse {
  status: string;
  output?: string;
  error?: string;
  exitCode?: number;
  executionTime?: string;
  memory?: string;
}

export const runInterviewCode = async (
  roomId: string,
  payload: RunInterviewCodeRequest
): Promise<RunInterviewCodeResponse> => {
  const { data } = await API.post(`/interviews/${roomId}/run`, payload);
  return data;
};

