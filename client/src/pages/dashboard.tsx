import { Link } from "wouter";
import { useGroups } from "@/hooks/use-groups";
import { CreateGroupDialog } from "@/components/create-group-dialog";
import { JoinGroupDialog } from "@/components/join-group-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Users, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const { data: groups, isLoading } = useGroups();
  const { user } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">{greeting()}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {user?.firstName ? `${user.firstName}'s Groups` : "Your Groups"}
          </h1>
        </div>
        <div className="flex gap-2.5 flex-shrink-0">
          <JoinGroupDialog />
          <CreateGroupDialog />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : groups?.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 px-8 bg-muted/20 rounded-3xl border border-dashed border-border/60">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center mb-5">
            <Users className="w-8 h-8 text-violet-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No groups yet</h3>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
            Create a private group for your friends or enter a code to join one.
          </p>
          <div className="flex gap-2.5">
            <JoinGroupDialog />
            <CreateGroupDialog />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups?.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <div
                className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-violet-500/8 hover:-translate-y-0.5 transition-all duration-200"
                data-testid={`card-group-${group.id}`}
              >
                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-purple-400 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    {/* Group avatar */}
                    <div className="w-13 h-13 rounded-xl overflow-hidden border border-border/60 bg-muted flex-shrink-0 shadow-sm">
                      {group.photoUrl ? (
                        <img src={group.photoUrl} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-400/30 to-purple-400/20 flex items-center justify-center">
                          <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                            {group.name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all mt-0.5" />
                  </div>

                  <h3 className="text-base font-semibold text-foreground leading-tight mb-1 line-clamp-1">
                    {group.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {group.description || "No description yet."}
                  </p>
                </div>

                <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70 font-mono tracking-wider">
                    {group.code}
                  </span>
                  <span className="text-xs text-muted-foreground/50">Tap to open</span>
                </div>
              </div>
            </Link>
          ))}

        </div>
      )}
    </div>
  );
}
