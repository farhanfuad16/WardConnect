import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useIssues(params?: { wardId?: number; status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["issues", params],
    queryFn: () => api.getIssues(params),
    refetchInterval: 15000,
  });
}

export function useIssue(id: number) {
  return useQuery({
    queryKey: ["issue", id],
    queryFn: () => api.getIssue(id),
    enabled: !!id,
    refetchInterval: 15000,
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useNotices(params?: { wardId?: number; category?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["notices", params],
    queryFn: () => api.getNotices(params),
  });
}

export function useIncidents(params?: { wardId?: number; severity?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["incidents", params],
    queryFn: () => api.getIncidents(params),
  });
}

export function useIncident(id: number) {
  return useQuery({
    queryKey: ["incident", id],
    queryFn: () => api.getIncident(id),
    enabled: !!id,
  });
}

export function useResources(params?: { wardId?: number; category?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["resources", params],
    queryFn: () => api.getResources(params),
  });
}

export function useNotifications(params?: { unreadOnly?: boolean; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => api.getNotifications(params),
  });
}

// Drives the bell's red dot. Polled like the other live data so a new
// notification shows up on its own; the mark-read mutations below invalidate
// the "notifications" prefix, so the dot clears right after reading.
export function useUnreadNotificationCount() {
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.getNotifications({ unreadOnly: true, limit: 1 }),
    refetchInterval: 15000,
  });
  return data?.unreadCount ?? 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCreateSosAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createSosAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sos"] });
    },
  });
}

export function useSosAlerts(params?: { wardId?: number; status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["sos", params],
    queryFn: () => api.getSosAlerts(params),
  });
}

export function useSubmitVolunteerInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.submitVolunteerInterest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
    },
  });
}

export function useVolunteers(params?: { wardId?: number; status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["volunteers", params],
    queryFn: () => api.getVolunteers(params),
  });
}

export function useDeleteVolunteerInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteVolunteerInterest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
    },
  });
}

export function useVolunteerCount(wardId?: number) {
  return useQuery({
    queryKey: ["volunteers", "count", wardId],
    queryFn: () => api.getVolunteerCount(wardId!),
    enabled: !!wardId,
    refetchInterval: 10000,
  });
}
