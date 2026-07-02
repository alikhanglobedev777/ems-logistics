const DEFAULT_API_BASE_URL = "http://localhost:4000/api";
let apiBaseUrl = DEFAULT_API_BASE_URL;

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

  return localStorage.getItem("accessToken");
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

export async function customHttpClient<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
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

  const response = await fetch(`${apiBaseUrl}${url}`, {
    ...options,
    headers,
  });

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
