import API from "./api";

interface AuthData {
  email: string;
  password: string;
}

interface RegisterCandidateData extends AuthData {
  name: string;
}

interface RegisterInterviewerData extends AuthData {
  name: string;
  company?: string;
}

export const loginUser = (data: AuthData) =>
  API.post("/auth/login-candidate", data);

export const registerUser = (data: RegisterCandidateData) =>
  API.post("/auth/register-candidate", data);

export const loginInterviewer = (data: AuthData) =>
  API.post("/auth/login-interviewer", data);

export const registerInterviewer = (data: RegisterInterviewerData) =>
  API.post("/auth/register-interviewer", data);

export const forgotPassword = (data: { email: string }) =>
  API.post("/auth/forgot-password", data);

export const resetPassword = (
  token: string,
  data: { password: string }
) => API.put(`/auth/reset-password/${token}`, data);