import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertGroupSchema } from "@shared/schema";
import { useCreateGroup } from "@/hooks/use-groups";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

// The schema from shared is good, but we need to generate the code client-side
// because the user shouldn't pick the code manually usually, but for simplicity
// let's let them pick a unique handle/code.
const formSchema = insertGroupSchema.extend({
  code: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, "Alphanumeric, dashes, or underscores only"),
});

export function CreateGroupDialog({ children }: { children?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateGroup();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      code: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          <span>{children}</span>
        ) : (
          <Button className="gap-2 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new group</DialogTitle>
          <DialogDescription>
            Start a space for your friends to hang out, share, and plan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input id="name" placeholder="The Cool Kids" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Group Code (Unique ID)</Label>
            <Input id="code" placeholder="cool-kids-2024" {...form.register("code")} />
            <p className="text-xs text-muted-foreground">Friends will use this code to join.</p>
            {form.formState.errors.code && (
              <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              placeholder="What is this group about?" 
              {...form.register("description")} 
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
