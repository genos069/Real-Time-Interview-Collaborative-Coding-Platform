/**
 * Resolves avatar URL ensuring proper backend base URL prepending for relative paths
 * while supporting data/blob URLs (previews) and external URLs.
 */
export function getAvatarUrl(avatar?: string | null): string {
  if (!avatar || typeof avatar !== "string" || avatar.trim() === "") {
    return "";
  }

  const trimmed = avatar.trim();

  // If it's already an absolute URL or blob/data preview URL
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  const rawBase = import.meta.env.VITE_API_URL || "";
  // Strip trailing slash
  const apiBase = rawBase.replace(/\/+$/, "");

  // If avatar is e.g. "/api/user/avatar/123?t=..."
  if (trimmed.startsWith("/api/")) {
    // If apiBase ends with "/api", strip "/api" from apiBase to avoid "/api/api/..."
    const origin = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
    return `${origin}${trimmed}`;
  }

  // Otherwise, ensure leading slash
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${apiBase}${path}`;
}
