export type ApiErrorCode = 'OFFLINE' | 'TIMEOUT' | 'HTTP' | 'NON_JSON' | 'INVALID_JSON' | 'UNKNOWN';

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;
  bodySnippet?: string;

  constructor(code: ApiErrorCode, message?: string, options?: { status?: number; bodySnippet?: string }) {
    super(message ?? code);
    this.name = 'ApiError';
    this.code = code;
    this.status = options?.status;
    this.bodySnippet = options?.bodySnippet;
  }
}

export const getUserMessage = (error: unknown): string => {
  const apiError = error instanceof ApiError ? error : null;
  switch (apiError?.code) {
    case 'OFFLINE':
      return 'No internet connection';
    case 'TIMEOUT':
      return 'Request timed out. Please try again.';
    case 'HTTP':
      return 'Server error. Please try again.';
    case 'NON_JSON':
    case 'INVALID_JSON':
      return 'Unexpected server response. Please try again.';
    default:
      return 'Something went wrong.';
  }
};
