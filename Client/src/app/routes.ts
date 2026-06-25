import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import CandidateDashboard from "./pages/CandidateDashboard";
import InterviewerDashboard from "./pages/InterviewerDashboard";
import CodeEditor from "./pages/CodeEditor";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/auth",
    Component: Auth,
  },
  {
    path: "/candidate",
    Component: CandidateDashboard,
  },
  {
    path: "/interviewer",
    Component: InterviewerDashboard,
  },
  {
    path: "/CodeEditor",
    Component: CodeEditor,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password/:token",
    Component: ResetPassword,
  },
]);
