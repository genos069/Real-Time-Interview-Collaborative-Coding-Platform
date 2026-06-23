import API from "./api.js";

// LOGIN-Candidate
export const loginUser = (data) => API.post("/auth/login-candidate", data);

// REGISTER-Candidate
export const registerUser = (data) => API.post("/auth/register-candidate", data);

// LOGIN-Interviewer
export const loginInterviewer = (data) => API.post("/auth/login-interviewer", data);

// REGISTER-Interviewer
export const registerInterviewer = (data) => API.post("/auth/register-interviewer", data);

// FORGOT PASSWORD
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);

// RESET PASSWORD
export const resetPassword = (token, data) => API.put(`/auth/reset-password/${token}`, data);