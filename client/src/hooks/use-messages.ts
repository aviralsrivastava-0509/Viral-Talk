import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

type MessageWithUser = Message & { user: any };

export function useMessages(groupId: number) {
  return useQuery<MessageWithUser[]>({
    queryKey: ["/api/groups", groupId, "messages"],
    queryFn: () => fetch(`/api/groups/${groupId}/messages`).then(r => r.json()),
    refetchInterval: 3000,
    enabled: !!groupId,
  });
}

export function useSendMessage(groupId: number) {
  return useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/groups/${groupId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "messages"] });
    },
  });
}

export function useEditMessage(groupId: number) {
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: number; content: string }) =>
      apiRequest("PATCH", `/api/groups/${groupId}/messages/${messageId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "messages"] });
    },
  });
}

export function useDeleteMessage(groupId: number) {
  return useMutation({
    mutationFn: (messageId: number) =>
      apiRequest("DELETE", `/api/groups/${groupId}/messages/${messageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "messages"] });
    },
  });
}
