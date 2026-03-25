import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { useGroup } from "@/hooks/use-groups";
import { usePosts } from "@/hooks/use-posts";
import { useEvents } from "@/hooks/use-events";
import { usePolls } from "@/hooks/use-polls";
import { useMessages, useSendMessage, useEditMessage, useDeleteMessage } from "@/hooks/use-messages";
import { useMembers, useRemoveMember } from "@/hooks/use-members";
import { useUpdateGroupPhoto } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreatePostDialog } from "@/components/create-post-dialog";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { CreatePollDialog } from "@/components/create-poll-dialog";
import { PostCard } from "@/components/post-card";
import { PollCard } from "@/components/poll-card";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone,
  Calendar as CalendarIcon,
  BarChart3,
  MapPin,
  Clock,
  MessageCircle,
  Users,
  Send,
  Crown,
  UserMinus,
  Copy,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  Camera,
  ImageIcon,
} from "lucide-react";

export default function GroupDetails() {
  const [, params] = useRoute("/groups/:id");
  const id = parseInt(params?.id || "0");
  const { data: group, isLoading: groupLoading } = useGroup(id);
  const { data: members } = useMembers(id);
  const { user } = useAuth();
  const [codeCopied, setCodeCopied] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoInput, setPhotoInput] = useState("");
  const { mutate: updatePhoto, isPending: updatingPhoto } = useUpdateGroupPhoto(id);
  const { toast } = useToast();

  const myRole = members?.find(m => m.userId === user?.id)?.role;
  const isAdmin = myRole === "admin";

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
    toast({ description: "Invite code copied!" });
  };

  const handlePhotoSave = () => {
    if (!photoInput.trim()) return;
    updatePhoto(photoInput.trim(), {
      onSuccess: () => {
        setPhotoDialogOpen(false);
        setPhotoInput("");
      },
    });
  };

  if (groupLoading) return <div className="p-8"><Skeleton className="h-12 w-64 mb-4" /><Skeleton className="h-6 w-96" /></div>;
  if (!group) return <div className="p-8 text-center text-muted-foreground">Group not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <div className="w-64 h-64 bg-primary rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Group Photo */}
          <div className="relative flex-shrink-0 group/photo">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border bg-muted shadow-sm">
              {group.photoUrl ? (
                <img src={group.photoUrl} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-3xl font-bold text-primary">
                  {group.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => { setPhotoInput(group.photoUrl || ""); setPhotoDialogOpen(true); }}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white"
                data-testid="button-edit-group-photo"
                title="Change group photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <Badge
                variant="outline"
                className="bg-background/50 backdrop-blur border-primary/20 text-primary font-mono cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                onClick={copyCode}
                data-testid="badge-invite-code"
              >
                {codeCopied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                Code: {group.code}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight leading-tight mb-1">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Group Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Group Photo</DialogTitle>
            <DialogDescription>
              Set a photo URL to give your group a profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Photo URL</label>
              <Input
                placeholder="https://example.com/photo.jpg"
                value={photoInput}
                onChange={e => setPhotoInput(e.target.value)}
                data-testid="input-group-photo-url"
              />
              <p className="text-xs text-muted-foreground">Paste a direct link to an image file.</p>
            </div>
            {photoInput && (
              <div className="rounded-xl overflow-hidden border aspect-square w-32 mx-auto">
                <img src={photoInput} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPhotoDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePhotoSave} disabled={updatingPhoto || !photoInput.trim()}>
              {updatingPhoto ? "Saving..." : "Save Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="feed" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-muted/50 p-1 rounded-full h-auto w-max">
            <TabsTrigger value="feed" className="rounded-full px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm">
              <Megaphone className="w-4 h-4 mr-1.5" /> Feed
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-full px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm" data-testid="tab-chat">
              <MessageCircle className="w-4 h-4 mr-1.5" /> Chat
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-full px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm">
              <CalendarIcon className="w-4 h-4 mr-1.5" /> Events
            </TabsTrigger>
            <TabsTrigger value="polls" className="rounded-full px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm">
              <BarChart3 className="w-4 h-4 mr-1.5" /> Polls
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-full px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm" data-testid="tab-members">
              <Users className="w-4 h-4 mr-1.5" /> Members
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── FEED ── */}
        <TabsContent value="feed" className="space-y-6 mt-6">
          <StoriesSection groupId={id} />
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Recent Posts</h3>
                <CreatePostDialog groupId={id} />
              </div>
              <PostsList groupId={id} />
            </div>
            <div className="hidden md:block w-72 space-y-4">
              <div className="bg-card border rounded-2xl p-5 shadow-sm sticky top-24">
                <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-muted-foreground">About Group</h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Created</span>
                    <span className="text-sm font-medium">{new Date(group.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Invite Code</span>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-2 text-sm font-mono bg-muted px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <code>{group.code}</code>
                      {codeCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── CHAT ── */}
        <TabsContent value="chat" className="mt-6">
          <ChatSection groupId={id} />
        </TabsContent>

        {/* ── EVENTS ── */}
        <TabsContent value="events" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Upcoming Events</h3>
            <CreateEventDialog groupId={id} />
          </div>
          <EventsList groupId={id} />
        </TabsContent>

        {/* ── POLLS ── */}
        <TabsContent value="polls" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Active Polls</h3>
            <CreatePollDialog groupId={id} />
          </div>
          <PollsList groupId={id} />
        </TabsContent>

        {/* ── MEMBERS ── */}
        <TabsContent value="members" className="mt-6">
          <MembersSection groupId={id} group={group} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Stories ──────────────────────────────────────────────────────────────────

function StoriesSection({ groupId }: { groupId: number }) {
  const { data: posts } = usePosts(groupId);
  const stories = posts?.filter(p => p.type === "story") || [];
  if (stories.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
      <div className="flex gap-4">
        {stories.map(story => (
          <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[72px]" data-testid={`story-item-${story.id}`}>
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-orange-500 to-purple-600 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
                {story.mediaUrl ? (
                  <img src={story.mediaUrl} className="w-full h-full object-cover" alt="story" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {story.user?.firstName?.[0] || "?"}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-medium truncate w-full text-center">{story.user?.firstName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Posts ────────────────────────────────────────────────────────────────────

function PostsList({ groupId }: { groupId: number }) {
  const { data: posts, isLoading } = usePosts(groupId);
  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />;
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
      {feedPosts.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────

function ChatSection({ groupId }: { groupId: number }) {
  const { data: messages, isLoading } = useMessages(groupId);
  const { mutate: sendMessage, isPending: sending } = useSendMessage(groupId);
  const { mutate: editMessage, isPending: editing } = useEditMessage(groupId);
  const { mutate: deleteMessage } = useDeleteMessage(groupId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startEditing = (msg: any) => {
    setEditingId(msg.id);
    setEditingContent(msg.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const submitEdit = (messageId: number) => {
    if (!editingContent.trim()) return;
    editMessage(
      { messageId, content: editingContent.trim() },
      {
        onSuccess: () => cancelEditing(),
        onError: () => toast({ variant: "destructive", description: "Could not edit message." }),
      }
    );
  };

  const handleDelete = (messageId: number) => {
    deleteMessage(messageId, {
      onError: () => toast({ variant: "destructive", description: "Could not delete message." }),
    });
  };

  return (
    <div className="flex flex-col h-[70vh] border rounded-2xl overflow-hidden bg-card">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />)}
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageCircle className="w-12 h-12 opacity-20" />
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.userId === user?.id;
            const isBeingEdited = editingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 items-end group/msg ${isMe ? "flex-row-reverse" : "flex-row"}`}
                data-testid={`message-${msg.id}`}
              >
                {!isMe && (
                  <Avatar className="h-7 w-7 border border-border flex-shrink-0 mb-5">
                    <AvatarImage src={msg.user?.profileImageUrl} />
                    <AvatarFallback className="text-[10px]">{msg.user?.firstName?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-[10px] text-muted-foreground px-1 font-medium">
                      {msg.user?.firstName}
                    </span>
                  )}

                  {isBeingEdited ? (
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        value={editingContent}
                        onChange={e => setEditingContent(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") submitEdit(msg.id);
                          if (e.key === "Escape") cancelEditing();
                        }}
                        className="rounded-xl text-sm h-9"
                        autoFocus
                        data-testid={`input-edit-message-${msg.id}`}
                      />
                      <Button size="sm" onClick={() => submitEdit(msg.id)} disabled={editing} className="h-9 px-3">
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-9 px-3">
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5">
                      {isMe && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted text-muted-foreground" data-testid={`button-message-options-${msg.id}`}>
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => startEditing(msg)} data-testid={`button-edit-message-${msg.id}`}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(msg.id)}
                              data-testid={`button-delete-message-${msg.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Unsend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                        {msg.editedAt && (
                          <span className={`text-[10px] ml-2 opacity-60`}>(edited)</span>
                        )}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-muted-foreground px-1">
                    {formatDistanceToNow(new Date(msg.createdAt || new Date()), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex gap-2 bg-background/80 backdrop-blur">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          className="rounded-full bg-muted border-0 focus-visible:ring-1"
          data-testid="input-chat-message"
        />
        <Button
          size="icon"
          className="rounded-full flex-shrink-0"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          data-testid="button-send-message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Events ───────────────────────────────────────────────────────────────────

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
        <div key={event.id} className="bg-card border rounded-2xl p-5 hover:shadow-md transition-shadow" data-testid={`card-event-${event.id}`}>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-xl flex flex-col items-center justify-center font-bold leading-none">
              <span className="text-[10px] uppercase">{format(event.startTime, "MMM")}</span>
              <span className="text-lg">{format(event.startTime, "d")}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg leading-tight mb-1">{event.title}</h4>
              {event.description && <p className="text-sm text-muted-foreground mb-3">{event.description}</p>}
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{format(event.startTime, "h:mm a, MMM d yyyy")}</span>
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

// ── Polls ─────────────────────────────────────────────────────────────────────

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
      {polls.map(poll => <PollCard key={poll.id} poll={poll} groupId={groupId} />)}
    </div>
  );
}

// ── Members ───────────────────────────────────────────────────────────────────

function MembersSection({ groupId, group }: { groupId: number; group: any }) {
  const { data: members, isLoading } = useMembers(groupId);
  const { mutate: removeMember, isPending: removing } = useRemoveMember(groupId);
  const { user } = useAuth();
  const { toast } = useToast();

  const myRole = members?.find(m => m.userId === user?.id)?.role;
  const isAdmin = myRole === "admin";

  const handleRemove = (targetMember: any) => {
    if (!window.confirm(`Remove ${targetMember.user?.firstName} from the group?`)) return;
    removeMember(targetMember.userId, {
      onSuccess: () => toast({ description: `${targetMember.user?.firstName} was removed from the group.` }),
      onError: () => toast({ variant: "destructive", description: "Could not remove member." }),
    });
  };

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{members?.length ?? 0} Members</h3>
        {isAdmin && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300">
            <Crown className="w-3 h-3 mr-1" /> Admin
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {members?.map(member => {
          const isMe = member.userId === user?.id;
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-4 bg-card border rounded-2xl hover:shadow-sm transition-shadow"
              data-testid={`member-row-${member.id}`}
            >
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={member.user?.profileImageUrl} />
                <AvatarFallback>{member.user?.firstName?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">
                    {member.user?.firstName} {member.user?.lastName}
                    {isMe && <span className="text-muted-foreground font-normal"> (you)</span>}
                  </span>
                  {member.role === "admin" && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
              </div>

              {isAdmin && !isMe && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  onClick={() => handleRemove(member)}
                  disabled={removing}
                  data-testid={`button-remove-member-${member.id}`}
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
