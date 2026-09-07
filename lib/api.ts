import { apiCall } from "./_core/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    return await apiCall<T>(endpoint, options);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error) {
      const match = error.message.match(/API call failed: (\d+)/);
      if (match) throw new ApiError(parseInt(match[1]), error.message);
      throw new ApiError(500, error.message);
    }
    throw new ApiError(500, "Unknown error occurred");
  }
}

export type IssueStatus = "submitted" | "acknowledged" | "in_progress" | "resolved" | "rejected";
export type NoticeCategory = "Emergency Alert" | "Utility Notice" | "General Notice";

export interface Issue {
  id: number;
  userId: number;
  wardId: number;
  category: string;
  title: string;
  description: string;
  status: IssueStatus;
  severity: "normal" | "emergency";
  landmark?: string;
  photoUrl?: string;
  latitude?: string;
  longitude?: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  wardName?: string;
}

export interface Notice {
  id: number;
  wardId: number;
  title: string;
  body: string;
  category: NoticeCategory;
  postedBy: number;
  createdAt: string;
  wardName?: string;
  postedByName?: string;
}

export interface Incident {
  id: number;
  wardId: number;
  title: string;
  category: string;
  severity: "High" | "Medium" | "Low";
  description: string;
  status: string;
  accent?: string;
  latitude?: string;
  longitude?: string;
  verifiedBy?: number;
  createdAt: string;
  wardName?: string;
}

export interface Resource {
  id: number;
  wardId: number;
  name: string;
  category: string;
  contactInfo: string;
  address?: string;
  createdAt: string;
  wardName?: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface SosAlert {
  id: number;
  userId: number;
  wardId: number;
  type: string;
  status: "pending" | "dispatched" | "resolved" | "cancelled";
  note?: string;
  latitude?: string;
  longitude?: string;
  createdAt: string;
  userName?: string;
  wardName?: string;
}

export interface Volunteer {
  id: number;
  userId: number;
  wardId: number;
  skillsOrInterest?: string;
  status: "pending" | "approved" | "active" | "inactive";
  createdAt: string;
  userName?: string;
  wardName?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  data: T[];
}

export interface IssuesResponse {
  issues: Issue[];
  total: number;
  limit: number;
  offset: number;
}

export interface NoticesResponse {
  notices: Notice[];
  total: number;
  limit: number;
  offset: number;
}

export interface IncidentsResponse {
  incidents: Incident[];
  total: number;
  limit: number;
  offset: number;
}

export interface ResourcesResponse {
  resources: Resource[];
  total: number;
  limit: number;
  offset: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
}

export interface SosAlertsResponse {
  alerts: SosAlert[];
  total: number;
  limit: number;
  offset: number;
}

export interface VolunteersResponse {
  volunteers: Volunteer[];
  total: number;
  limit: number;
  offset: number;
}

export const statusLabel: Record<IssueStatus, string> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

export async function getIssues(params?: { wardId?: number; status?: string; limit?: number; offset?: number }): Promise<IssuesResponse> {
  const query = new URLSearchParams();
  if (params?.wardId) query.set("wardId", String(params.wardId));
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiRequest<IssuesResponse>(`/api/issues${qs ? `?${qs}` : ""}`);
}

export async function getIssue(id: number): Promise<{ issue: Issue }> {
  return apiRequest<{ issue: Issue }>(`/api/issues/${id}`);
}

export async function createIssue(data: {
  category: string;
  title: string;
  description: string;
  severity?: "normal" | "emergency";
  landmark?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ issue: Issue }> {
  return apiRequest<{ issue: Issue }>("/api/issues", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getNotices(params?: { wardId?: number; category?: string; limit?: number; offset?: number }): Promise<NoticesResponse> {
  const query = new URLSearchParams();
  if (params?.wardId) query.set("wardId", String(params.wardId));
  if (params?.category) query.set("category", params.category);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiRequest<NoticesResponse>(`/api/notices${qs ? `?${qs}` : ""}`);
}

export async function getIncidents(params?: { wardId?: number; severity?: string; limit?: number; offset?: number }): Promise<IncidentsResponse> {
  const query = new URLSearchParams();
  if (params?.wardId) query.set("wardId", String(params.wardId));
  if (params?.severity) query.set("severity", params.severity);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiRequest<IncidentsResponse>(`/api/incidents${qs ? `?${qs}` : ""}`);
}

export async function getIncident(id: number): Promise<{ incident: Incident }> {
  return apiRequest<{ incident: Incident }>(`/api/incidents/${id}`);
}

export async function getResources(params?: { wardId?: number; category?: string; limit?: number; offset?: number }): Promise<ResourcesResponse> {
  const query = new URLSearchParams();
  if (params?.wardId) query.set("wardId", String(params.wardId));
  if (params?.category) query.set("category", params.category);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiRequest<ResourcesResponse>(`/api/resources${qs ? `?${qs}` : ""}`);
}

export async function getNotifications(params?: { unreadOnly?: boolean; limit?: number; offset?: number }): Promise<NotificationsResponse> {
  const query = new URLSearchParams();
  if (params?.unreadOnly) query.set("unreadOnly", "true");
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiRequest<NotificationsResponse>(`/api/notifications${qs ? `?${qs}` : ""}`);
}

export async function markNotificationRead(id: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>("/api/notifications/read-all", {
    method: "PATCH",
  });
}

export async function createSosAlert(data: {
  type: string;
  note?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ alert: SosAlert }> {
  return apiRequest<{ alert: SosAlert }>("/api/sos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSosAlerts(params?: { wardId?: number; status?: string; limit?: number; offset?: number }): Promise<SosAlertsResponse> {
  const query = new URLSearchParams();
  if (params?.wardId) query.set("wardId", String(params.wardId));
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiRequest<SosAlertsResponse>(`/api/sos${qs ? `?${qs}` : ""}`);
}

export async function submitVolunteerInterest(data: {
  skillsOrInterest?: string;
}): Promise<{ volunteer: Volunteer }> {
  return apiRequest<{ volunteer: Volunteer }>("/api/volunteers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getVolunteers(params?: { wardId?: number; status?: string; limit?: number; offset?: number }): Promise<VolunteersResponse> {
  const query = new URLSearchParams();
  if (params?.wardId) query.set("wardId", String(params.wardId));
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return apiRequest<VolunteersResponse>(`/api/volunteers${qs ? `?${qs}` : ""}`);
}

export interface UploadResult {
  url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export async function uploadImage(uri: string): Promise<UploadResult> {
  // Create FormData for multipart upload
  const formData = new FormData();
  
  // Get the file extension from the URI
  const uriParts = uri.split(".");
  const fileType = uriParts[uriParts.length - 1];
  const mimeType = `image/${fileType === "jpg" ? "jpeg" : fileType}`;
  
  // Append the image file
  formData.append("image", {
    uri,
    name: `photo.${fileType}`,
    type: mimeType,
  } as any);

  // Use apiCall directly for multipart upload (not apiRequest which uses JSON)
  const { apiCall } = await import("./_core/api");
  return apiCall<UploadResult>("/api/uploads/image", {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
