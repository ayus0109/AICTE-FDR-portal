const getApiBase = () => {
  let envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl) {
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      envUrl = `https://${envUrl}`;
    }
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api/v1`;
  }
  // Smart cloud fallback when hosted on Render or Vercel
  if (
    typeof window !== 'undefined' && 
    (window.location.hostname.includes('.onrender.com') || window.location.hostname.includes('.vercel.app'))
  ) {
    return 'https://aicte-fdr-backend.onrender.com/api/v1';
  }
  return '/api/v1';
};

export const API_BASE = getApiBase();

export const getDownloadUrl = (pathOrKey: string, directUrl?: string | null) => {
  if (directUrl && directUrl.startsWith('http')) {
    return directUrl;
  }
  const cleanKey = pathOrKey.replace(/^\/+/, '');
  const token = localStorage.getItem('aicte_token');
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  if (cleanKey.startsWith('api/v1/')) {
    return `${API_BASE.replace(/\/api\/v1\/?$/, '')}/${cleanKey}${tokenParam}`;
  }
  return `${API_BASE}/documents/download/${cleanKey}${tokenParam}`;
};

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aicte_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    let errorDetail = 'Authentication failed.';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // response is not json
    }

    if (endpoint.includes('/auth/')) {
      throw new ApiError(errorDetail, 401);
    }

    localStorage.removeItem('aicte_token');
    localStorage.removeItem('aicte_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // response is not json
    }
    throw new ApiError(errorDetail, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, {
      method: 'POST',
      body: formData,
    }),
};
