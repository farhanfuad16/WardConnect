// Admin API Client for WardConnect
const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function setToken(token: string): void {
  localStorage.setItem('admin_token', token);
}

function removeToken(): void {
  localStorage.removeItem('admin_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// Local uploads are stored as "/uploads/<file>" (or as an absolute URL built
// from whichever host uploaded them), so rebuild them against the API origin:
// in dev the admin runs on Vite's port while the API runs on 3000.
export function resolvePhotoUrl(photoUrl?: string | null): string | undefined {
  if (!photoUrl) return undefined;
  if (typeof window === "undefined") return photoUrl;
  const { protocol, hostname, port, origin } = window.location;
  const apiOrigin = port === "5173" ? `${protocol}//${hostname}:3000` : origin;
  if (photoUrl.startsWith("/")) return `${apiOrigin}${photoUrl}`;
  const localUpload = photoUrl.match(/^https?:\/\/[^/?#]+(\/uploads\/[^?#]+)/i);
  if (localUpload) return `${apiOrigin}${localUpload[1]}`;
  return photoUrl;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(response.status, errorData.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

// Auth
export async function login(email: string, password: string): Promise<{ token: string; user: any }> {
  const data = await apiRequest<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    removeToken();
  }
}

export async function getMe(): Promise<any> {
  return apiRequest('/auth/me');
}

// Issues
export async function getIssues(params?: { wardId?: number; status?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.wardId) query.set('wardId', String(params.wardId));
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiRequest(`/issues${qs ? `?${qs}` : ''}`);
}

export async function updateIssueStatus(id: number, status: string) {
  return apiRequest(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Incidents
export async function getIncidents(params?: { wardId?: number; severity?: string; verified?: boolean; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.wardId) query.set('wardId', String(params.wardId));
  if (params?.severity) query.set('severity', params.severity);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiRequest(`/incidents${qs ? `?${qs}` : ''}`);
}

export async function createIncident(data: {
  title: string;
  category: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  status: string;
}) {
  return apiRequest('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIncident(id: number, data: any) {
  return apiRequest(`/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteIncident(id: number) {
  return apiRequest(`/incidents/${id}`, {
    method: 'DELETE',
  });
}

// SOS alerts — citizens send these from the app; admins triage them here.
// Kept as a distinct concept from Incidents: an SOS is a private distress
// call from one person (dispatch/acknowledge/resolve), while an Incident is
// a verified public announcement to the whole ward. An admin can promote a
// serious SOS into a public Incident (see Sos.tsx), but they are not the
// same list and are not auto-merged.
export async function getSosAlerts(params?: { wardId?: number; status?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.wardId) query.set('wardId', String(params.wardId));
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiRequest(`/sos${qs ? `?${qs}` : ''}`);
}

export async function updateSosAlert(id: number, status: string) {
  return apiRequest(`/sos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Notices
export async function getNotices(params?: { wardId?: number; category?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.wardId) query.set('wardId', String(params.wardId));
  if (params?.category) query.set('category', params.category);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiRequest(`/notices${qs ? `?${qs}` : ''}`);
}

export async function createNotice(data: { title: string; body: string; category: string }) {
  return apiRequest('/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNotice(id: number, data: { title?: string; body?: string; category?: string }) {
  return apiRequest(`/notices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteNotice(id: number) {
  return apiRequest(`/notices/${id}`, {
    method: 'DELETE',
  });
}

// Resources
export async function getResources(params?: { wardId?: number; category?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.wardId) query.set('wardId', String(params.wardId));
  if (params?.category) query.set('category', params.category);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiRequest(`/resources${qs ? `?${qs}` : ''}`);
}

export async function createResource(data: { name: string; category: string; contactInfo: string; address?: string; description?: string }) {
  return apiRequest('/resources', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateResource(id: number, data: { name?: string; category?: string; contactInfo?: string; address?: string; description?: string }) {
  return apiRequest(`/resources/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteResource(id: number) {
  return apiRequest(`/resources/${id}`, {
    method: 'DELETE',
  });
}

// Volunteers
export async function getVolunteers(params?: { wardId?: number; status?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.wardId) query.set('wardId', String(params.wardId));
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiRequest(`/volunteers${qs ? `?${qs}` : ''}`);
}

export async function updateVolunteer(id: number, data: { status?: string; skillsOrInterest?: string }) {
  return apiRequest(`/volunteers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteVolunteer(id: number) {
  return apiRequest(`/volunteers/${id}`, {
    method: 'DELETE',
  });
}

// Analytics
export async function getAnalyticsSummary() {
  return apiRequest('/analytics/summary');
}

// Wards
export async function getWards() {
  return apiRequest('/wards');
}