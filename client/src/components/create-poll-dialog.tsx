import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePoll } from "@/hooks/use-polls";
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
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ListChecks } from "lucide-react";

const formSchema = z.object({
  question: z.string().min(1, "Question is required"),
});

interface CreatePollDialogProps {
  groupId: number;
}

export function CreatePollDialog({ groupId }: CreatePollDialogProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(["", ""]);
  const [optionError, setOptionError] = useState("");
  const { mutate, isPending } = useCreatePoll(groupId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { question: "" },
  });

  const updateOption = (index: number, value: string) => {
    setOptions(prev => prev.map((o, i) => (i === index ? value : o)));
    setOptionError("");
  };

  const addOption = () => setOptions(prev => [...prev, ""]);

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    form.reset({ question: "" });
    setOptions(["", ""]);
    setOptionError("");
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const validOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (validOptions.length < 2) {
      setOptionError("Please fill in at least 2 options.");
      return;
    }

    mutate(
      { question: data.question, groupId, options: validOptions },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto gap-2" data-testid="button-open-create-poll">
          <ListChecks className="w-4 h-4" />
          New Poll
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Question</Label>
            <Input
              placeholder="Where should we go for dinner?"
              data-testid="input-poll-question"
              {...form.register("question")}
            />
            {form.formState.errors.question && (
              <p className="text-sm text-destructive">{form.formState.errors.question.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Options</Label>
            {options.map((opt, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={opt}
                  onChange={e => updateOption(index, e.target.value)}
                  data-testid={`input-poll-option-${index}`}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    data-testid={`button-remove-option-${index}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-2 border-dashed"
              onClick={addOption}
              data-testid="button-add-poll-option"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Option
            </Button>
            {optionError && <p className="text-sm text-destructive">{optionError}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} data-testid="button-submit-poll">
              {isPending ? "Creating..." : "Create Poll"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
