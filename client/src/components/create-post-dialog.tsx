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
import { PenSquare, Megaphone, BookImage, Video, Sparkles } from "lucide-react";

interface CreatePostDialogProps {
  groupId: number;
}

const postTypes = [
  { value: "announcement", label: "Announcement", icon: Megaphone, color: "text-blue-600" },
  { value: "image", label: "Photo", icon: BookImage, color: "text-green-600" },
  { value: "video", label: "Video", icon: Video, color: "text-red-600" },
  { value: "story", label: "Story (24h)", icon: Sparkles, color: "text-orange-600" },
];

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
    const payload = {
      ...data,
      groupId,
      content: data.content?.trim() || null,
      mediaUrl: data.mediaUrl?.trim() || null,
    };
    mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        form.reset({ type: "announcement", content: "", mediaUrl: "", groupId });
      },
    });
  };

  const type = form.watch("type");
  const needsMedia = type === "video" || type === "image" || type === "story";
  const selectedType = postTypes.find(t => t.value === type);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-create-post">
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
              <SelectTrigger data-testid="select-post-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map(t => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${t.color}`} />
                        {t.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {type === "announcement" ? "Message" : "Caption (Optional)"}
            </Label>
            <Textarea
              placeholder={type === "announcement" ? "Share something with the group..." : "Add a caption..."}
              className="min-h-[100px]"
              data-testid="input-post-content"
              {...form.register("content")}
            />
          </div>

          {needsMedia && (
            <div className="space-y-2">
              <Label>{type === "video" ? "Video URL" : "Image URL"}</Label>
              <Input
                placeholder="https://..."
                data-testid="input-post-media-url"
                {...form.register("mediaUrl")}
              />
              <p className="text-xs text-muted-foreground">
                Paste a direct link to your {type === "video" ? "video" : "image"}.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending} data-testid="button-submit-post">
              {isPending ? "Posting..." : `Post ${selectedType?.label || ""}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
