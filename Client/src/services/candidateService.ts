import API from "./api";
import type {
  DashboardResponse,
  UserProfile,
} from "../app/pages/CandidateDashboard";

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  const res = await API.get("/candidate/dashboard");

  const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

  return {
    ...data,

    user: {
      id: data.user?.id ?? "",
      name: data.user?.name ?? "",
      email: data.user?.email ?? "",
      title: data.user?.title ?? "",
      location: data.user?.location ?? "",
      about: data.user?.about ?? "",
      readinessScore: data.user?.readinessScore ?? 0,
    },

    stats: {
      questionsSolved: data.stats?.questionsSolved ?? 0,
      codingTimeSeconds: data.stats?.codingTimeSeconds ?? 0,
      mockSessions: data.stats?.mockSessions ?? 0,
      weeklyImprovement: data.stats?.weeklyImprovement ?? 0,
      totalCompletedRealInterviews: data.stats?.totalCompletedRealInterviews ?? data.totalCompletedRealInterviews ?? 0,
      totalCompletedMockInterviews: data.stats?.totalCompletedMockInterviews ?? data.totalCompletedMockInterviews ?? 0,
      averageRealInterviewScore: data.stats?.averageRealInterviewScore ?? data.averageRealInterviewScore ?? null,
    },

    totalCompletedRealInterviews: data.totalCompletedRealInterviews ?? data.stats?.totalCompletedRealInterviews ?? 0,
    totalCompletedMockInterviews: data.totalCompletedMockInterviews ?? data.stats?.totalCompletedMockInterviews ?? 0,
    averageRealInterviewScore: data.averageRealInterviewScore ?? data.stats?.averageRealInterviewScore ?? null,

    skillBreakdown: data.skillBreakdown ?? {
      confidence: 0,
      technical: 0,
      readiness: 0,
      problemSolving: 0,
      communication: 0,
    },

    progressHistory: Array.isArray(data.progressHistory)
      ? data.progressHistory
      : [],

    practiceQuestions: Array.isArray(data.practiceQuestions)
      ? data.practiceQuestions
      : [],

    mockSessions: Array.isArray(data.mockSessions) ? data.mockSessions : [],

    rooms: Array.isArray(data.rooms) ? data.rooms : [],

    skills: Array.isArray(data.skills) ? data.skills : [],

    targets: Array.isArray(data.targets) ? data.targets : [],

    experience: Array.isArray(data.experience) ? data.experience : [],

    lastMockResult: {
      session: data.lastMockResult?.session ?? "",
      overall: data.lastMockResult?.overall ?? 0,
      technical: data.lastMockResult?.technical ?? 0,
      readiness: data.lastMockResult?.readiness ?? 0,
      confidence: data.lastMockResult?.confidence ?? 0,
      communication: data.lastMockResult?.communication ?? 0,
      problemSolving: data.lastMockResult?.problemSolving ?? 0,
      strengths: Array.isArray(data.lastMockResult?.strengths)
        ? data.lastMockResult.strengths
        : [],
      weaknesses: Array.isArray(data.lastMockResult?.weaknesses)
        ? data.lastMockResult.weaknesses
        : [],
    },
  };
};

export const updateProfile = async (
  payload: Partial<UserProfile>,
): Promise<UserProfile> => {
  const { data } = await API.put("/candidate/profile", payload);
  return data;
};

export const addSkillApi = async (skill: string) => {
  const { data } = await API.post("/candidate/skills", {
    skill,
  });

  return data;
};

export const deleteSkillApi = async (id: string) => {
  await API.delete(`/candidate/skills/${id}`);
};

export const addTargetApi = async (target: string) => {
  const { data } = await API.post("/candidate/targets", {
    target,
  });

  return data;
};

export const deleteTargetApi = async (id: string) => {
  await API.delete(`/candidate/targets/${id}`);
};

export const getQuestionById = async (id: string) => {
  const { data } = await API.get(`/code-editor/questions/${id}`);

  // console.log("Question Response:", data);

  return data;
};
