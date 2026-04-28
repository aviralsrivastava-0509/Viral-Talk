import { useMemo } from "react";
import { type Poll, type PollOption, type User } from "@shared/schema";
import { useVotePoll } from "@/hooks/use-polls";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, Check } from "lucide-react";

type PollOptionWithVoters = PollOption & {
  voteCount?: number;
  voters?: User[];
  votes?: number | any[];
};

interface PollCardProps {
  poll: Poll & { options: PollOptionWithVoters[]; creator?: User | null };
  groupId: number;
}

function getCount(opt: PollOptionWithVoters): number {
  if (typeof opt.voteCount === "number") return opt.voteCount;
  if (Array.isArray(opt.voters)) return opt.voters.length;
  if (typeof opt.votes === "number") return opt.votes;
  if (Array.isArray(opt.votes)) return opt.votes.length;
  return 0;
}

function getInitials(user: User): string {
  const name = user.firstName || user.username || "?";
  return name.slice(0, 2).toUpperCase();
}

export function PollCard({ poll, groupId }: PollCardProps) {
  const { mutate: vote, isPending } = useVotePoll(groupId);
  const { user: currentUser } = useAuth();

  const totalVotes = useMemo(
    () => poll.options.reduce((acc, opt) => acc + getCount(opt), 0),
    [poll.options]
  );

  const myVotedOptionId = useMemo(() => {
    if (!currentUser) return null;
    for (const opt of poll.options) {
      if (opt.voters?.some(v => v?.id === currentUser.id)) return opt.id;
    }
    return null;
  }, [poll.options, currentUser]);

  const handleVote = (optionId: number) => {
    if (myVotedOptionId === optionId) return;
    vote({ pollId: poll.id, optionId });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="hover:shadow-md transition-shadow duration-200" data-testid={`card-poll-${poll.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Poll</span>
          </div>
          <CardTitle className="text-lg font-medium leading-tight" data-testid={`text-poll-question-${poll.id}`}>
            {poll.question}
          </CardTitle>
          {poll.creator && (
            <div
              className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground"
              data-testid={`text-poll-creator-${poll.id}`}
            >
              <Avatar className="w-4 h-4">
                <AvatarImage src={poll.creator.profileImageUrl || undefined} />
                <AvatarFallback className="text-[8px]">
                  {(poll.creator.firstName || poll.creator.username || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>
                Created by{" "}
                <span className="font-medium text-foreground/80">
                  {poll.creator.id === currentUser?.id
                    ? "you"
                    : poll.creator.firstName || poll.creator.username}
                </span>
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.options.map((option) => {
            const voteCount = getCount(option);
            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const isMyVote = myVotedOptionId === option.id;
            const voters = option.voters ?? [];

            return (
              <div key={option.id} className="space-y-2" data-testid={`row-poll-option-${option.id}`}>
                <div className="flex items-center justify-between text-sm gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {isMyVote && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <span className="font-medium truncate" data-testid={`text-option-text-${option.id}`}>
                      {option.text}
                    </span>
                  </div>
                  <span
                    className="text-muted-foreground text-xs whitespace-nowrap"
                    data-testid={`text-option-count-${option.id}`}
                  >
                    {voteCount} {voteCount === 1 ? "vote" : "votes"} · {Math.round(percentage)}%
                  </span>
                </div>

                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isMyVote ? "bg-primary" : "bg-primary/60"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex -space-x-2 items-center min-h-[24px]">
                    {voters.slice(0, 5).map((voter) => (
                      <Tooltip key={voter.id}>
                        <TooltipTrigger asChild>
                          <Avatar
                            className="w-6 h-6 border-2 border-background"
                            data-testid={`avatar-voter-${option.id}-${voter.id}`}
                          >
                            <AvatarImage src={voter.profileImageUrl || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(voter)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {voter.firstName || voter.username}
                            {voter.id === currentUser?.id ? " (you)" : ""}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {voters.length > 5 && (
                      <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                        +{voters.length - 5}
                      </div>
                    )}
                  </div>

                  <Button
                    variant={isMyVote ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-3"
                    onClick={() => handleVote(option.id)}
                    disabled={isPending || isMyVote}
                    data-testid={`button-vote-${option.id}`}
                  >
                    {isMyVote ? "Your vote" : "Vote"}
                  </Button>
                </div>

                {voters.length > 0 && (
                  <p
                    className="text-[11px] text-muted-foreground"
                    data-testid={`text-voter-names-${option.id}`}
                  >
                    {voters
                      .slice(0, 3)
                      .map(v => (v.id === currentUser?.id ? "You" : v.firstName || v.username))
                      .join(", ")}
                    {voters.length > 3 ? ` and ${voters.length - 3} more` : ""}
                  </p>
                )}
              </div>
            );
          })}

          <div className="pt-2 text-xs text-muted-foreground text-center" data-testid={`text-total-votes-${poll.id}`}>
            {totalVotes} total {totalVotes === 1 ? "vote" : "votes"}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
