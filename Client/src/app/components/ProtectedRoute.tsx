import { Navigate, Outlet } from "react-router";

type Role = "CANDIDATE" | "INTERVIEWER";

interface ProtectedRouteProps {
  allowedRole: Role;
}

export default function ProtectedRoute({
  allowedRole,
}: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");

  if (!token || !userString) {
    return (
      <Navigate
        to={`/auth?role=${
          allowedRole === "INTERVIEWER"
            ? "interviewer"
            : "candidate"
        }`}
        replace
      />
    );
  }

  try {
    const user = JSON.parse(userString);

    const role = user.role?.toUpperCase();

    if (role !== allowedRole) {
      if (role === "CANDIDATE") {
        return <Navigate to="/candidate" replace />;
      }

      if (role === "INTERVIEWER") {
        return <Navigate to="/interviewer" replace />;
      }

      return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
  } catch (error) {
    console.error("Invalid user data:", error);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/auth" replace />;
  }
}
