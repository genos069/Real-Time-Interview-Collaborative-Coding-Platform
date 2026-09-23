import { Navigate, Outlet, useLocation } from "react-router";

export default function AuthenticatedRoute() {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");

  if (!token || !userString) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  try {
    const user = JSON.parse(userString);
    const role = user.role?.toUpperCase();

    if (role !== "CANDIDATE" && role !== "INTERVIEWER") {
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
