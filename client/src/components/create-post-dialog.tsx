import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPostSchema } from "@shared/schema";
import { useCreatePost } from "@/hooks/use-posts";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PenSquare } from "lucide-react";

interface CreatePostDialogProps {
  groupId: number;
}

export function CreatePostDialog({ groupId }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreatePost(groupId);
  
  const form = useForm<z.infer<typeof insertPostSchema>>({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      type: "announcement",
      content: "",
      mediaUrl: "",
      groupId,
    },
  });

  const onSubmit = (data: z.infer<typeof insertPostSchema>) => {
    mutate({ ...data, groupId }, {
      onSuccess: () => {
        setOpen(false);
        form.reset({ type: "announcement", content: "", mediaUrl: "", groupId });
      },
    });
  };

  const type = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto gap-2">
          <PenSquare className="w-4 h-4" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select 
              onValueChange={(val) => form.setValue("type", val as any)} 
              defaultValue={type}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">Announcement / Chat</SelectItem>
                <SelectItem value="story">Story (Ephemeral)</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea 
              placeholder="What's on your mind?" 
              className="min-h-[100px]"
              {...form.register("content")} 
            />
          </div>

          <div className="space-y-2">
            <Label>Image/Video URL (Optional)</Label>
            <Input 
              placeholder="https://..." 
              {...form.register("mediaUrl")} 
            />
            <p className="text-xs text-muted-foreground">Paste a link to an image or video.</p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
