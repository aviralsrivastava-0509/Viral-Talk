import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPollSchema } from "@shared/schema";
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

interface CreatePollDialogProps {
  groupId: number;
}

export function CreatePollDialog({ groupId }: CreatePollDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreatePoll(groupId);
  
  const form = useForm<z.infer<typeof insertPollSchema>>({
    resolver: zodResolver(insertPollSchema),
    defaultValues: {
      question: "",
      groupId,
      options: ["", ""], // Start with 2 empty options
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options" as any, // Cast because zod schema is strictly typed but field array needs path
  });

  const onSubmit = (data: z.infer<typeof insertPollSchema>) => {
    // Filter empty options
    const cleanedData = {
      ...data,
      options: data.options.filter(o => o.trim().length > 0)
    };
    
    if (cleanedData.options.length < 2) {
      form.setError("root", { message: "At least 2 options are required" });
      return;
    }

    mutate({ ...cleanedData, groupId }, {
      onSuccess: () => {
        setOpen(false);
        form.reset({ question: "", groupId, options: ["", ""] });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto gap-2">
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
              {...form.register("question")} 
            />
            {form.formState.errors.question && (
              <p className="text-sm text-destructive">{form.formState.errors.question.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Options</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input 
                  placeholder={`Option ${index + 1}`}
                  {...form.register(`options.${index}` as any)} 
                />
                {fields.length > 2 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => remove(index)}
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
              onClick={() => append("")}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Option
            </Button>
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Poll"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
