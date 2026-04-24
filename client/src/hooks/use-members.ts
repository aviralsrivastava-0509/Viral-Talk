import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Member } from "@shared/schema";

type MemberWithUser = Member & { user: any };

export function useMembers(groupId: number) {
  return useQuery<MemberWithUser[]>({
    queryKey: ["/api/groups", groupId, "members"],
    queryFn: () => fetch(`/api/groups/${groupId}/members`).then(r => r.json()),
    enabled: !!groupId,
  });
}

export function useRemoveMember(groupId: number) {
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest("DELETE", `/api/groups/${groupId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "members"] });
    },
  });
}

export type LeaveGroupResult = {
  ok: boolean;
  action: "left" | "promoted" | "disbanded";
  newAdmin?: { userId: string; name: string };
};

export function useLeaveGroup(groupId: number) {
  return useMutation<LeaveGroupResult>({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/groups/${groupId}/leave`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });
}
