import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Group } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useGroups() {
  return useQuery({
    queryKey: [api.groups.list.path],
    queryFn: async () => {
      const res = await fetch(api.groups.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch groups");
      return api.groups.list.responses[200].parse(await res.json());
    },
  });
}

export function useGroup(id: number) {
  return useQuery({
    queryKey: [api.groups.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.groups.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch group");
      return api.groups.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.groups.create.input>) => {
      const res = await fetch(api.groups.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create group");
      }
      return api.groups.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Success", description: "Group created successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.groups.join.input>) => {
      const res = await fetch(api.groups.join.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to join group");
      }
      return api.groups.join.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Success", description: "Joined group successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
