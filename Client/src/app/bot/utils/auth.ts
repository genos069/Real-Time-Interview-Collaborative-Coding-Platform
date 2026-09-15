import API from "../../../services/api";

const USER_KEY = "user";
const TOKEN_KEY = "token";

export type UserRole = "candidate" | "interviewer" | "observer";

export type User = {
  id?: string;
  _id?: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  [key: string]: any;
};

/* ---------------- USER ---------------- */

export const saveUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);

    if (raw && raw !== "undefined") {
      const parsed = JSON.parse(raw) as User;
      if (parsed && (parsed.id || parsed._id || parsed.userId || parsed.email)) {
        return {
          ...parsed,
          id: parsed.id || parsed._id || parsed.userId,
        };
      }
    }
  } catch {
    // fallback to token
  }

  const token = getToken();
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        const rawRole = String(payload?.role || "").toLowerCase().replace(/^role_/, "");
        const role = (rawRole === "candidate" || rawRole === "interviewer" || rawRole === "observer") ? (rawRole as UserRole) : undefined;
        const id = payload?.userId || payload?.id;
        return {
          id,
          userId: id,
          email: payload?.sub,
          role,
          name: payload?.name,
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const token = getToken();
    if (!token) return null;
    const { data } = await API.get("/user/me");
    if (data && data.id) {
      const rawRole = String(data.role || "").toLowerCase().replace(/^role_/, "");
      const role = (rawRole === "candidate" || rawRole === "interviewer" || rawRole === "observer") ? (rawRole as UserRole) : undefined;
      const u: User = {
        id: data.id,
        userId: data.id,
        name: data.name,
        email: data.email,
        role,
      };
      saveUser(u);
      return u;
    }
  } catch (err) {
    console.warn("Unable to fetch current user from /user/me:", err);
  }
  return getUser();
};

export const clearUser = () => {
  localStorage.removeItem(USER_KEY);
};

/* ---------------- TOKEN ---------------- */

export const saveToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token); // ❌ no JSON stringify
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/* ---------------- COMBINED SAFE ACCESS ---------------- */

export const getAuth = () => {
  const token = getToken();
  const user = getUser();

  return {
    token,
    user,
    isLoggedIn: !!token,
  };
};

/* ---------------- LOGIN STATE ---------------- */

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

/* ---------------- ROLE ---------------- */

export const getUserRole = (): "candidate" | "interviewer" | "observer" => {
  const user = getUser();
  const rawRole = user?.role?.toLowerCase().replace(/^role_/, "");
  if (rawRole === "candidate" || rawRole === "interviewer" || rawRole === "observer") {
    return rawRole;
  }

  const token = getToken();
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        const role = String(payload?.role || "").toLowerCase().replace(/^role_/, "");
        if (role === "candidate" || role === "interviewer" || role === "observer") {
          return role;
        }
      }
    } catch {
      // fallback
    }
  }

  return "interviewer";
};

// const USER_KEY = "user";
// const TOKEN_KEY = "token";

// export type User = {
//   name?: string;
//   email?: string;
//   role?: "candidate" | "interviewer";
//   [key: string]: any;
// };

// export const saveUser = (user: User) => {
//   localStorage.setItem(USER_KEY, JSON.stringify(user));
// };

// export const getUser = (): User | null => {
//   const raw = localStorage.getItem(TOKEN_KEY);
//   return raw ? (JSON.parse(raw) as User) : null;
// };

// export const clearUser = () => {
//   localStorage.removeItem(USER_KEY);
// };

// export const saveToken = (token: string) => {
//   localStorage.setItem(TOKEN_KEY, token);
// };

// export const getToken = (): string | null => {
//   return localStorage.getItem(TOKEN_KEY);
// };

// export const clearToken = () => {
//   localStorage.removeItem(TOKEN_KEY);
// };

// export const isLoggedIn = (): boolean => {
//   return !!getToken();
// };