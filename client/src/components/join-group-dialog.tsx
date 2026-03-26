import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { joinGroupSchema } from "@shared/schema";
import { useJoinGroup } from "@/hooks/use-groups";
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
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

export function JoinGroupDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useJoinGroup();
  const form = useForm<z.infer<typeof joinGroupSchema>>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = (data: z.infer<typeof joinGroupSchema>) => {
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
        <Button variant="outline" className="gap-2 rounded-full">
          <UserPlus className="w-4 h-4" />
          Join Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join an existing group</DialogTitle>
          <DialogDescription>
            Enter the unique group code to join your friends.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="code">Group Code</Label>
            <Input id="code" placeholder="e.g. weekend-squad" {...form.register("code")} />
            {form.formState.errors.code && (
              <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Joining..." : "Join Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
