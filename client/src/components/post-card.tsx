import { formatDistanceToNow } from "date-fns";
import { type Post } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Video, Megaphone, Image, Sparkles } from "lucide-react";

interface PostCardProps {
  post: Post & { user: any };
}

const typeMeta: Record<string, { label: string; icon: any; classes: string }> = {
  announcement: { label: "Announcement", icon: Megaphone, classes: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  video: { label: "Video", icon: Video, classes: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  image: { label: "Photo", icon: Image, classes: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  story: { label: "Story", icon: Sparkles, classes: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
};

export function PostCard({ post }: PostCardProps) {
  const meta = typeMeta[post.type] || typeMeta.announcement;
  const Icon = meta.icon;

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-border/50"
      data-testid={`card-post-${post.id}`}
    >
      <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={post.user?.profileImageUrl} />
          <AvatarFallback>{post.user?.firstName?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">
              {post.user?.firstName} {post.user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt || new Date()), { addSuffix: true })}
            </span>
          </div>
          <Badge
            variant="secondary"
            className={`w-fit text-[10px] px-2 py-0 h-5 mt-1 font-normal ${meta.classes}`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {meta.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        {post.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}

        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden border bg-muted/30">
            {post.type === "video" ? (
              <video controls className="w-full max-h-[400px] object-cover" src={post.mediaUrl} />
            ) : (
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="w-full max-h-[500px] object-cover"
                loading="lazy"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
