import { ApiError } from './apiError';

export type ApiClientOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null;
  params?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;
  timeoutMs?: number;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.megzed.com/api/v1';
const DEFAULT_TIMEOUT_MS = 15000;

const toSnippet = (value: string, length = 200) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > length ? `${normalized.slice(0, length)}…` : normalized;
};

const buildUrl = (path: string, params?: ApiClientOptions['params']) => {
  const rawUrl = path.startsWith('http')
    ? path
    : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const url = new URL(rawUrl, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

const isAbortError = (error: unknown) =>
  error instanceof DOMException ? error.name === 'AbortError' : false;

const isOfflineError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }
  return message.includes('Failed to fetch');
};

export const apiClient = {
  async request<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
    const {
      params,
      auth = true,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      headers,
      body,
      signal,
      ...rest
    } = options;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const requestHeaders = new Headers(headers);
    requestHeaders.set('Accept', 'application/json');

    if (auth) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        requestHeaders.set('Authorization', `Bearer ${token}`);
      }
    }

    let requestBody: BodyInit | undefined;

    if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
      requestBody = body as BodyInit;
    } else if (body && typeof body === 'object') {
      requestHeaders.set('Content-Type', 'application/json');
      requestBody = JSON.stringify(body);
    } else if (typeof body === 'string') {
      requestBody = body;
    }

    try {
      const response = await fetch(buildUrl(path, params), {
        ...rest,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
      });

      const text = await response.text();
      const bodySnippet = text ? toSnippet(text) : undefined;

      if (!response.ok) {
        throw new ApiError('HTTP', `HTTP ${response.status}`, {
          status: response.status,
          bodySnippet,
        });
      }

      const contentType = response.headers.get('content-type') ?? '';
      const looksLikeHtml = text.trimStart().startsWith('<');
      const isJson = contentType.includes('application/json');

      if (!isJson || looksLikeHtml) {
        throw new ApiError('NON_JSON', 'Non-JSON response', { bodySnippet });
      }

      if (!text) {
        return null as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        throw new ApiError('INVALID_JSON', 'Invalid JSON response', { bodySnippet });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (isAbortError(error)) {
        throw new ApiError('TIMEOUT', 'Request timed out');
      }
      if (isOfflineError(error)) {
        throw new ApiError('OFFLINE', 'Offline');
      }
      throw new ApiError('UNKNOWN', 'Unknown error');
    } finally {
      window.clearTimeout(timeoutId);
    }
  },
};
