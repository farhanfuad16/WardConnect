import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useIssues(params?: { wardId?: number; status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["issues", params],
    queryFn: () => api.getIssues(params),
  });
}

export function useIssue(id: number) {
  return useQuery({
    queryKey: ["issue", id],
    queryFn: () => api.getIssue(id),
    enabled: !!id,
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
