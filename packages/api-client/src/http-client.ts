const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

type RequestConfig = {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
};

export async function customHttpClient<T>({
  url,
  method,
  params,
  data,
  headers
}: RequestConfig): Promise<T> {
  const token = localStorage.getItem("accessToken");

  const query = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";

  const response = await fetch(`${API_BASE_URL}${url}${query}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: data ? JSON.stringify(data) : undefined
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw errorBody ?? new Error("API request failed");
  }

  return response.json();
}
