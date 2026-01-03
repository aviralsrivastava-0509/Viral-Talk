import { formatDistanceToNow } from "date-fns";
import { type Post } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Video, Megaphone } from "lucide-react";

interface PostCardProps {
  post: Post & { user: any }; // Using any for user temporarily as it's joined in query
}

export function PostCard({ post }: PostCardProps) {
  const isVideo = post.type === "video";
  const isAnnouncement = post.type === "announcement";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-border/50">
      <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
        <Avatar className="h-10 w-10 border border-border">
          {/* Default to generic avatar if profile image missing */}
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
          {isAnnouncement && (
            <Badge variant="secondary" className="w-fit text-[10px] px-2 py-0 h-5 mt-1 font-normal bg-blue-50 text-blue-700 hover:bg-blue-100">
              <Megaphone className="w-3 h-3 mr-1" /> Announcement
            </Badge>
          )}
          {isVideo && (
            <Badge variant="secondary" className="w-fit text-[10px] px-2 py-0 h-5 mt-1 font-normal bg-red-50 text-red-700 hover:bg-red-100">
              <Video className="w-3 h-3 mr-1" /> Video
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-3">
        {post.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
        
        {post.mediaUrl && (
          <div className="rounded-lg overflow-hidden border bg-muted/30">
            {isVideo ? (
               <video controls className="w-full max-h-[400px] object-cover" src={post.mediaUrl} />
            ) : (
              <img 
                src={post.mediaUrl} 
                alt="Post content" 
                className="w-full max-h-[400px] object-cover"
                loading="lazy"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
