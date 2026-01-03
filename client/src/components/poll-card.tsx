import { useState } from "react";
import { type Poll, type PollOption } from "@shared/schema";
import { useVotePoll } from "@/hooks/use-polls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface PollCardProps {
  poll: Poll & { options: (PollOption & { votes: any[] })[] };
  groupId: number;
}

export function PollCard({ poll, groupId }: PollCardProps) {
  const { mutate: vote, isPending } = useVotePoll(groupId);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);

  const handleVote = (optionId: number) => {
    setSelectedOption(optionId);
    vote({ pollId: poll.id, optionId });
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-md bg-purple-100 text-purple-600">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Poll</span>
        </div>
        <CardTitle className="text-lg font-medium leading-tight">
          {poll.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {poll.options.map((option) => {
          const voteCount = option.votes?.length || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isSelected = selectedOption === option.id;

          return (
            <div key={option.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{option.text}</span>
                <span className="text-muted-foreground text-xs">{voteCount} votes</span>
              </div>
              <div className="relative">
                <Progress value={percentage} className="h-2 bg-muted" indicatorClassName="bg-primary/80" />
              </div>
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="w-full mt-2 h-8 text-xs"
                onClick={() => handleVote(option.id)}
                disabled={isPending || selectedOption !== null}
              >
                {isSelected ? "Voted" : "Vote"}
              </Button>
            </div>
          );
        })}
        <div className="pt-2 text-xs text-muted-foreground text-center">
          {totalVotes} total votes
        </div>
      </CardContent>
    </Card>
  );
}
