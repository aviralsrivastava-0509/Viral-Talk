import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function usePosts(groupId: number) {
  return useQuery({
    queryKey: [api.posts.list.path, groupId],
    queryFn: async () => {
      const url = buildUrl(api.posts.list.path, { groupId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return api.posts.list.responses[200].parse(await res.json());
    },
    enabled: !!groupId && !isNaN(groupId),
  });
}

export function useCreatePost(groupId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.posts.create.input>) => {
      const url = buildUrl(api.posts.create.path, { groupId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create post");
      }
      return api.posts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path, groupId] });
      toast({ title: "Success", description: "Posted successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
