import { Navigate, Outlet, useLocation } from "react-router";

export default function AuthenticatedRoute() {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");

  console.log("AuthenticatedRoute:", {
    token: !!token,
    userString,
  });

  if (!token || !userString) {
    console.log("AuthenticatedRoute: NOT AUTHENTICATED");

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

    console.log("AuthenticatedRoute role:", role);

    if (role !== "CANDIDATE" && role !== "INTERVIEWER") {
      console.log("AuthenticatedRoute: INVALID ROLE");

      return <Navigate to="/auth" replace />;
    }

    console.log("AuthenticatedRoute: ALLOWED");

    return <Outlet />;
  } catch (error) {
    console.error("Invalid user data:", error);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/auth" replace />;
  }
}
