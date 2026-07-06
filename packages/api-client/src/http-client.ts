const DEFAULT_API_BASE_URL = "http://localhost:4000/api";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
export const AUTH_SESSION_CHANGED_EVENT = "ems:auth-session-changed";
let apiBaseUrl = DEFAULT_API_BASE_URL;
let refreshRequest: Promise<boolean> | null = null;

export type ApiClientConfig = {
  baseUrl?: string;
};

export function configureApiClient(config: ApiClientConfig) {
  apiBaseUrl = (config.baseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

function readAccessToken() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function readRefreshToken() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function notifySessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
  }
}

export function hasAuthSession() {
  return Boolean(readAccessToken() && readRefreshToken());
}

export function saveAuthSession(accessToken: string, refreshToken: string) {
  if (typeof localStorage === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  notifySessionChanged();
}

export function clearAuthSession() {
  if (typeof localStorage === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifySessionChanged();
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshSession() {
  const refreshToken = readRefreshToken();

  if (!refreshToken) return false;

  try {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const payload = await readJson(response) as {
      data?: { accessToken?: string; refreshToken?: string };
    } | null;

    if (!response.ok || !payload?.data?.accessToken || !payload.data.refreshToken) {
      clearAuthSession();
      return false;
    }

    saveAuthSession(payload.data.accessToken, payload.data.refreshToken);
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
}

function requestHeaders(options: RequestInit) {
  const token = readAccessToken();
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function customHttpClient<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  let response = await fetch(`${apiBaseUrl}${url}`, {
    ...options,
    headers: requestHeaders(options),
  });

  const canRefresh = !["/auth/login", "/auth/register", "/auth/refresh"].includes(url);

  if (response.status === 401 && canRefresh && readRefreshToken()) {
    refreshRequest ??= refreshSession().finally(() => {
      refreshRequest = null;
    });

    if (await refreshRequest) {
      response = await fetch(`${apiBaseUrl}${url}`, {
        ...options,
        headers: requestHeaders(options),
      });
    }
  }

  const data = await readJson(response);
  const result = {
    data,
    status: response.status,
    headers: response.headers,
  };

  if (!response.ok) {
    throw result;
  }

  return result as T;
}
