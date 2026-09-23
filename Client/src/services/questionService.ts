import API from "./api";

// ----------------------
// Get Question Details
// ----------------------
export const getQuestion = async (questionId: string) => {
  const response = await API.get(
    `/code-editor/questions/${questionId}`
  );
  return response.data;
};

// ----------------------
// Get Starter Code
// ----------------------
export const getStarterCode = async (
  questionId: string,
  language: string
) => {
  const response = await API.get(
    `/code-editor/questions/${questionId}/starter-code`,
    {
      params: {
        language,
      },
    }
  );

  return response.data;
};

// ----------------------
// Get Test Cases
// ----------------------
export const getTestCases = async (questionId: string) => {
  const response = await API.get(
    `/code-editor/questions/${questionId}/testcases`
  );

  return response.data;
};

// ----------------------
// Run Code
// ----------------------
export const runCode = async (request: {
  questionId: string;
  language: string;
  code: string;
  input?: string;
}) => {
  const response = await API.post(
    "/code-editor/run",
    request
  );

  return response.data;
};

// ----------------------
// Submit Code
// ----------------------
export const submitCode = async (
    questionId: string,
    request: {
      language: string;
      code: string;
      codingTimeSeconds: number;
    }
) => {
  const response = await API.post(
      `/code-editor/questions/${questionId}/submit`,
      request
  );

  return response.data;
};