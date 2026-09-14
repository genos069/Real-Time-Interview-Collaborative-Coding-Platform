const USER_KEY = "user";
const TOKEN_KEY = "token";

export type User = {
  name?: string;
  email?: string;
  role?: "candidate" | "interviewer";
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
      return JSON.parse(raw) as User;
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
        const role = (rawRole === "candidate" || rawRole === "interviewer") ? rawRole : undefined;
        return {
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

export const getUserRole = (): "candidate" | "interviewer" => {
  const user = getUser();
  const rawRole = user?.role?.toLowerCase().replace(/^role_/, "");
  if (rawRole === "candidate" || rawRole === "interviewer") {
    return rawRole;
  }

  const token = getToken();
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        const role = String(payload?.role || "").toLowerCase().replace(/^role_/, "");
        if (role === "candidate" || role === "interviewer") {
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