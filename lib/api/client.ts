import axios, {
  type AxiosError,
  type AxiosResponse,
  type AxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface ApiErrorBody {
  status: 'error';
  code: string;
  message: string;
  data: Record<string, unknown>;
}

// Only POST/PUT/PATCH/DELETE warrant a success toast when the server returns a message.
const MUTABLE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60_000, // LLM + search calls can take 20–40 s
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (response: AxiosResponse): any => {
    const method = response.config.method?.toLowerCase();
    if (MUTABLE_METHODS.has(method ?? '') && response.data?.message) {
      toast.success(response.data.message);
    }
    return response.data;
  },

  async (error: AxiosError<ApiErrorBody>) => {
    if (!error.response) {
      toast.error('Network error. Check your connection.');
      return Promise.reject(error);
    }

    const { status, headers } = error.response;
    const body = error.response.data;
    const message = body?.message;

    switch (status) {
      case 400:
      case 422:
        // Do NOT toast — let the calling hook/component handle inline display.
        break;

      case 401: {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.error('Session expired. Please sign in again.', { duration: Infinity, dismissible: true });
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.href = '/auth';
        }, 1_500);
        break;
      }

      case 403:
        if (typeof window !== 'undefined') window.location.href = '/403';
        break;

      case 404:
        if (typeof window !== 'undefined') window.location.href = '/404';
        break;

      case 429: {
        const retryAfter = headers['retry-after'];
        const seconds = retryAfter ? parseInt(String(retryAfter), 10) : null;
        toast.error(
          seconds != null
            ? `Too many requests. Try again in ${seconds} seconds.`
            : 'Too many requests. Try again later.'
        );
        break;
      }

      case 500:
        toast.error('Something went wrong', {
          action: {
            label: 'Retry',
            onClick: () => { if (error.config) api.request(error.config); },
          },
        });
        reportError(error);
        break;

      default:
        toast.error(message ?? `Request failed (${status}).`);
    }

    return Promise.reject(error);
  }
);

// TypeScript infers api.post<T>() as Promise<AxiosResponse<T>>, but the
// response interceptor above already unwraps it to T at runtime. This wrapper
// re-declares each method with Promise<T> so service functions stay fully typed.
export const typedApi = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get<T>(url, config) as unknown as Promise<T>,
  post: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => api.post<T>(url, data, config) as unknown as Promise<T>,
  put: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => api.put<T>(url, data, config) as unknown as Promise<T>,
  patch: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => api.patch<T>(url, data, config) as unknown as Promise<T>,
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete<T>(url, config) as unknown as Promise<T>,
};

export function reportError(err: unknown, context?: Record<string, unknown>) {
  const isAxios = axios.isAxiosError(err);
  console.error('[error]', {
    message: isAxios ? err.message : String(err),
    url: isAxios ? err.config?.url : undefined,
    status: isAxios ? err.response?.status : undefined,
    code: isAxios ? (err.response?.data as ApiErrorBody)?.code : undefined,
    ...context,
  });
  // TODO: Sentry.captureException(err, { extra: context })
}

export default api;
