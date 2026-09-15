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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
    ErrorBoundary: RouteError,
  },
  {
    path: "/auth",
    Component: Auth,
    ErrorBoundary: RouteError,
  },
  {
    path: "/candidate",
    Component: CandidateDashboard,
    ErrorBoundary: RouteError,
  },
  {
    path: "/interviewer",
    Component: InterviewerDashboard,
    ErrorBoundary: RouteError,
  },
  {
    path: "/codeeditor",
    Component: CodeEditor,
    ErrorBoundary: RouteError,
  },
  {
    path: "/codeeditor/:id",
    Component: CodeEditor,
    ErrorBoundary: RouteError,
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
    path: "/ai-mock",
    Component: BotHome,
    ErrorBoundary: RouteError,
  },
  {
    path: "/interview",
    Component: Interview,
    ErrorBoundary: RouteError,
  },
  {
    path: "/report/:id",
    Component: Report,
    ErrorBoundary: RouteError,
  },
  {
    path: "/history",
    Component: History,
    ErrorBoundary: RouteError,
  },
  {
    path: "/report",
    Component: Report,
    ErrorBoundary: RouteError,
  },
  {
    path: "/interview-room/:roomId",
    Component: InterviewRoom,
    ErrorBoundary: RouteError,
  },
  {
    path: "*",
    Component: RouteError,
  }
]);
