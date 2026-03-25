import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

type MessageWithUser = Message & { user: any };

export function useMessages(groupId: number) {
  return useQuery<MessageWithUser[]>({
    queryKey: ["/api/groups", groupId, "messages"],
    queryFn: () => fetch(`/api/groups/${groupId}/messages`).then(r => r.json()),
    refetchInterval: 3000, // Poll every 3 seconds for new messages
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
