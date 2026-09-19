import { createBrowserRouter } from "react-router";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import CandidateDashboard from "./pages/CandidateDashboard";
import InterviewerDashboard from "./pages/InterviewerDashboard";
import CodeEditor from "./pages/CodeEditor";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import InterviewRoom from "./pages/InterviewRoom";

import BotHome from "./bot/pages/BotHome";
import Interview from "./bot/pages/Interview";
import Report from "./bot/pages/Report";
import History from "./bot/pages/History";
import RouteError from "./components/RouteError";

import ProtectedRoute from "./components/ProtectedRoute";
import AuthenticatedRoute from "./components/AuthenticatedRoute";
import AuthRedirect from "./components/AuthRedirect";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
    ErrorBoundary: RouteError,
  },

  // Auth
  {
    element: <AuthRedirect />,
    children: [
      {
        path: "/auth",
        Component: Auth,
        ErrorBoundary: RouteError,
      },
    ],
  },

  // Candidate only
  {
    element: <ProtectedRoute allowedRole="CANDIDATE" />,
    children: [
      {
        path: "/candidate",
        Component: CandidateDashboard,
      },
      {
        path: "/history",
        Component: History,
      },
      {
        path: "/report",
        Component: Report,
      },
      {
        path: "/report/:id",
        Component: Report,
      },
      {
        path: "/interview",
        Component: Interview,
      },
      {
        path: "/ai-mock",
        Component: BotHome,
      },
      {
        path: "/codeeditor",
        Component: CodeEditor,
      },
      {
        path: "/codeeditor/:id",
        Component: CodeEditor,
      },
    ],
  },

  // Interviewer only
  {
    element: <ProtectedRoute allowedRole="INTERVIEWER" />,
    children: [
      {
        path: "/interviewer",
        Component: InterviewerDashboard,
      },
    ],
  },

  // Candidate OR Interviewer
  {
    element: <AuthenticatedRoute />,
    children: [
      {
        path: "/interview-room/:roomId",
        Component: InterviewRoom,
        ErrorBoundary: RouteError,
      },
    ],
  },

  {
    path: "/forgot-password",
    Component: ForgotPassword,
    ErrorBoundary: RouteError,
  },

  {
    path: "/reset-password/:token",
    Component: ResetPassword,
    ErrorBoundary: RouteError,
  },

  {
    path: "*",
    Component: RouteError,
  },
]);
