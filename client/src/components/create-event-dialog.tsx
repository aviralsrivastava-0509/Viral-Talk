import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEventSchema } from "@shared/schema";
import { useCreateEvent } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";

interface CreateEventDialogProps {
  groupId: number;
}

// Extend schema to handle string dates from form before coercion
const formSchema = insertEventSchema.extend({
  startTime: z.string(),
  endTime: z.string().optional(),
});

export function CreateEventDialog({ groupId }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateEvent(groupId);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      groupId,
      startTime: "",
      endTime: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Convert strings back to Dates for the actual mutation
    const payload = {
      ...data,
      groupId,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : undefined,
    };

    mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        form.reset({ title: "", description: "", location: "", groupId, startTime: "", endTime: "" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto gap-2">
          <CalendarDays className="w-4 h-4" />
          Plan Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Plan Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input 
              placeholder="Birthday Party" 
              {...form.register("title")} 
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input 
                type="datetime-local" 
                {...form.register("startTime")} 
              />
            </div>
            <div className="space-y-2">
              <Label>End Time (Optional)</Label>
              <Input 
                type="datetime-local" 
                {...form.register("endTime")} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input 
              placeholder="Central Park" 
              {...form.register("location")} 
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="Bring snacks!" 
              {...form.register("description")} 
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Planning..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
