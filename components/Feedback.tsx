"use client";
import { submitFeedback } from "@/components/actions/submitFeedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareText } from "lucide-react";
import Form from "next/form";
import React from "react";
import { toast } from "sonner";

interface FeedbackProps {
  profileId: number;
}

const Feedback = ({ profileId }: FeedbackProps) => {
  const handleFeedbackSubmit = async (formData: FormData) => {
    const feedback = formData.get("feedback") as string;
    console.log(feedback);

    const result = await submitFeedback(profileId, feedback);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-gray-700 hover:bg-gray-800 h-10 w-10">
          <MessageSquareText className="h-4 w-4 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex items-start justify-start">
          <DialogTitle>Share Feedback</DialogTitle>
          <DialogDescription>Let us know what you think!</DialogDescription>
        </DialogHeader>
        <Form action={handleFeedbackSubmit}>
          <Label htmlFor="feedback" className="hidden">
            Feedback
          </Label>
          <Textarea
            id="feedback"
            name="feedback"
            placeholder="Share your feedback here"
            required
          />
          <div className="flex justify-end mt-4">
            <Button type="submit">Submit</Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Feedback;
