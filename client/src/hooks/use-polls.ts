import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function usePolls(groupId: number) {
  return useQuery({
    queryKey: [api.polls.list.path, groupId],
    queryFn: async () => {
      const url = buildUrl(api.polls.list.path, { groupId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch polls");
      return api.polls.list.responses[200].parse(await res.json());
    },
    enabled: !!groupId && !isNaN(groupId),
  });
}

export function useCreatePoll(groupId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.polls.create.input>) => {
      const url = buildUrl(api.polls.create.path, { groupId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create poll");
      }
      return api.polls.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.polls.list.path, groupId] });
      toast({ title: "Success", description: "Poll created successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useVotePoll(groupId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: number; optionId: number }) => {
      const url = buildUrl(api.polls.vote.path, { pollId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to vote");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.polls.list.path, groupId] });
      toast({ title: "Success", description: "Vote recorded!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
