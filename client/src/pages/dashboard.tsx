import { Link } from "wouter";
import { useGroups } from "@/hooks/use-groups";
import { CreateGroupDialog } from "@/components/create-group-dialog";
import { JoinGroupDialog } from "@/components/join-group-dialog";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const { data: groups, isLoading } = useGroups();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Your Groups</h1>
          <p className="text-muted-foreground mt-1">
            Manage your squads or join a new one.
          </p>
        </div>
        <div className="flex gap-3">
          <JoinGroupDialog />
          <CreateGroupDialog />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : groups?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted-foreground/20">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold text-foreground">No groups yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-6">
            You aren't part of any groups yet. Create one for your friends or ask for a code to join an existing one!
          </p>
          <CreateGroupDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups?.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group border-border/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent p-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {group.name[0]}
                    </div>
                    <ChevronRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">{group.name}</h3>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {group.description || "No description provided."}
                  </p>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground font-mono bg-muted/30 -mx-6 -mb-6 px-6 py-3">
                    <span>CODE: {group.code}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
