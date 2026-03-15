import axios from 'axios';

interface ApiErrorBody {
  status: 'error';
  code: string;
  message: string;
  data: Record<string, unknown>;
}

export function getApiMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiErrorBody)?.message ?? error.message;
  }
  return 'Something went wrong';
}

export function isValidationError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return error.response?.status === 400 || error.response?.status === 422;
}
