import { useState } from "react";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { useGroup } from "@/hooks/use-groups";
import { usePosts } from "@/hooks/use-posts";
import { useEvents } from "@/hooks/use-events";
import { usePolls } from "@/hooks/use-polls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreatePostDialog } from "@/components/create-post-dialog";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { CreatePollDialog } from "@/components/create-poll-dialog";
import { PostCard } from "@/components/post-card";
import { PollCard } from "@/components/poll-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Megaphone, 
  Calendar as CalendarIcon, 
  BarChart3, 
  MapPin,
  Clock
} from "lucide-react";

export default function GroupDetails() {
  const [, params] = useRoute("/groups/:id");
  const id = parseInt(params?.id || "0");
  const { data: group, isLoading: groupLoading } = useGroup(id);

  if (groupLoading) return <div className="p-8"><Skeleton className="h-12 w-64 mb-4" /><Skeleton className="h-6 w-96" /></div>;
  if (!group) return <div className="p-8 text-center text-muted-foreground">Group not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border rounded-3xl p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <div className="w-64 h-64 bg-primary rounded-full blur-[80px]" />
        </div>
        
        <div className="relative z-10">
          <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur border-primary/20 text-primary">
            Code: {group.code}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-2">
            {group.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {group.description}
          </p>
        </div>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
          <TabsList className="bg-muted/50 p-1 rounded-full h-auto">
            <TabsTrigger value="feed" className="rounded-full px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Megaphone className="w-4 h-4 mr-2" /> Feed
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-full px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <CalendarIcon className="w-4 h-4 mr-2" /> Events
            </TabsTrigger>
            <TabsTrigger value="polls" className="rounded-full px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <BarChart3 className="w-4 h-4 mr-2" /> Polls
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="feed" className="space-y-6">
          <StoriesSection groupId={id} />
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Recent Posts</h3>
                <CreatePostDialog groupId={id} />
              </div>
              <PostsList groupId={id} />
            </div>
            {/* Sidebar for Desktop */}
            <div className="hidden md:block w-80 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm sticky top-24">
                <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">About Group</h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">Created</span>
                    <span className="text-sm font-medium">
                      {new Date(group.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Invite Code</span>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {group.code}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Upcoming Events</h3>
            <CreateEventDialog groupId={id} />
          </div>
          <EventsList groupId={id} />
        </TabsContent>

        <TabsContent value="polls" className="space-y-6">
           <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Active Polls</h3>
            <CreatePollDialog groupId={id} />
          </div>
          <PollsList groupId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StoriesSection({ groupId }: { groupId: number }) {
  const { data: posts } = usePosts(groupId);
  const stories = posts?.filter(p => p.type === "story") || [];

  if (stories.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
      <div className="flex gap-4">
        {stories.map(story => (
          <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[80px]">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-orange-500 to-purple-600 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full border-2 border-background overflow-hidden relative">
                {story.mediaUrl ? (
                   <img src={story.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      Text
                   </div>
                )}
              </div>
            </div>
            <span className="text-xs font-medium truncate w-full text-center">
              {story.user?.firstName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostsList({ groupId }: { groupId: number }) {
  const { data: posts, isLoading } = usePosts(groupId);
  
  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />;
  
  // Filter out stories from the main feed
  const feedPosts = posts?.filter(p => p.type !== "story") || [];

  if (feedPosts.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-2xl">
        <p className="text-muted-foreground">No posts yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function EventsList({ groupId }: { groupId: number }) {
  const { data: events, isLoading } = useEvents(groupId);

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-2xl">
        <p className="text-muted-foreground">No upcoming events planned.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map(event => (
        <div key={event.id} className="bg-card border rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-xl flex flex-col items-center justify-center font-bold leading-none">
              <span className="text-[10px] uppercase">{format(event.startTime, "MMM")}</span>
              <span className="text-lg">{format(event.startTime, "d")}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg leading-tight mb-1">{event.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{format(event.startTime, "h:mm a")}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PollsList({ groupId }: { groupId: number }) {
  const { data: polls, isLoading } = usePolls(groupId);

  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />;

  if (!polls || polls.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-2xl">
        <p className="text-muted-foreground">No polls active right now.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {polls.map(poll => (
        <PollCard key={poll.id} poll={poll} groupId={groupId} />
      ))}
    </div>
  );
}
