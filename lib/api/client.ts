import axios, {
  type AxiosError,
  type AxiosResponse,
  type AxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
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

  (error: AxiosError<ApiError>) => {
    if (!error.response) {
      toast.error('Network error. Check your internet connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        toast.error('Session expired. Please login again.');
        // Delay navigation so the toast has time to appear before the page unloads.
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.href = '/login';
        }, 1_500);
        break;
      case 403:
        toast.error("You don't have permission to perform this action.");
        break;
      case 422:
        if (data?.errors) {
          const firstMessage = Object.values(data.errors).flat()[0];
          toast.error(firstMessage ?? data.message ?? 'Validation failed.');
        } else {
          toast.error(data?.message ?? 'Validation failed.');
        }
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(data?.message ?? `Request failed (${status}).`);
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

export default api;
