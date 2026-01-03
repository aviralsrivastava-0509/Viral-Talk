import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useEvents(groupId: number) {
  return useQuery({
    queryKey: [api.events.list.path, groupId],
    queryFn: async () => {
      const url = buildUrl(api.events.list.path, { groupId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      // Ensure dates are dates
      return api.events.list.responses[200].parse(data).map(event => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: event.endTime ? new Date(event.endTime) : null,
      }));
    },
    enabled: !!groupId && !isNaN(groupId),
  });
}

export function useCreateEvent(groupId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.events.create.input>) => {
      const url = buildUrl(api.events.create.path, { groupId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create event");
      }
      return api.events.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path, groupId] });
      toast({ title: "Success", description: "Event planned successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
