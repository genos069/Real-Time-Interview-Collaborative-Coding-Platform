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

export interface CreateInterviewPayload {
  title: string;
  targetRole: string;
  interviewType: string;
  candidateEmail: string;
  candidateNotes?: string;
}

export const createInterviewRoom = async (
  payload: CreateInterviewPayload
): Promise<InterviewDetailsResponse> => {
  const { data } = await API.post("/interviews", payload);
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

export const finishInterviewRoom = async (roomId: string): Promise<InterviewDetailsResponse> => {
  const { data } = await API.post(`/interviews/${roomId}/finish`);
  return data;
};

export const endInterviewRoom = finishInterviewRoom;

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

export interface InterviewEventMessage {
  roomId: string;
  event: string;
  status: string;
  message?: string;
  initiatorRole?: string;
  initiatorId?: string;
  timestamp?: number;
}

export interface InterviewScoreRecord {
  id?: string;
  interviewId: string;
  roomId: string;
  scorerUserId?: string;
  scorerRole?: string;
  recipientUserId?: string;
  recipientRole?: string;
  score: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InterviewRoomScoresResponse {
  interviewId: string;
  roomId: string;
  candidateScore?: number | null;
  interviewerScore?: number | null;
  scores?: InterviewScoreRecord[];
}

export const submitInterviewScore = async (
  roomId: string,
  score: number
): Promise<InterviewScoreRecord> => {
  const { data } = await API.post(`/interviews/${roomId}/score`, { score });
  return data;
};

export const getInterviewScores = async (
  roomId: string
): Promise<InterviewRoomScoresResponse> => {
  const { data } = await API.get(`/interviews/${roomId}/scores`);
  return data;
};

export const getScoresGiven = async (): Promise<InterviewScoreRecord[]> => {
  const { data } = await API.get("/interviews/scores/given");
  return data;
};

export const getScoresReceived = async (): Promise<InterviewScoreRecord[]> => {
  const { data } = await API.get("/interviews/scores/received");
  return data;
};
