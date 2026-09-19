import { Navigate, Outlet } from "react-router";

export default function AuthRedirect() {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");

  // Not logged in → show Auth page
  if (!token || !userString) {
    return <Outlet />;
  }

  try {
    const user = JSON.parse(userString);
    const role = user.role?.toUpperCase();

    if (role === "CANDIDATE") {
      return <Navigate to="/candidate" replace />;
    }

    if (role === "INTERVIEWER") {
      return <Navigate to="/interviewer" replace />;
    }

    // Invalid role
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/auth" replace />;
  } catch (error) {
    console.error("Invalid user:", error);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/auth" replace />;
  }
}
