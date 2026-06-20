export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    if ('message' in error) return String((error as { message: unknown }).message);
    if ('error' in error) return String((error as { error: unknown }).error);
  }
  return 'An unexpected error occurred';
}
