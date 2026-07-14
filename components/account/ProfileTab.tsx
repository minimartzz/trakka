"use client";

import { updateProfile } from "@/app/(account)/account/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, SquarePen } from "lucide-react";
import Form from "next/form";
import { useRouter } from "nextjs-toploader/app";
import React from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

interface ProfileUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  gender: string;
  description: string;
  image: string;
}

interface ProfileTabProps {
  user: ProfileUser;
  editMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
}

const FieldLabel = ({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) => (
  <Label
    htmlFor={htmlFor}
    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
  >
    {children}
  </Label>
);

const FieldRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <FieldLabel>{label}</FieldLabel>
    <p className="text-base">{value}</p>
  </div>
);

const SubmitButtons = ({ onCancel }: { onCancel: () => void }) => {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-x-3 pt-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={pending}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        className="font-semibold bg-accent-5/80 hover:bg-accent-5 text-white"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
};

const ProfileTab = ({ user, editMode, onEditModeChange }: ProfileTabProps) => {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    formData.append("profilePicture", user.image);

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success(result.message);
      onEditModeChange(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div>
      {/* Section header: distinct band from the content below, houses the
          edit toggle so it travels with the section it acts on. */}
      <div className="flex items-center justify-between gap-3 border-b px-1 py-3">
        <h2 className="text-sm font-semibold">
          {editMode ? "Edit Profile" : "Profile"}
        </h2>
        {!editMode && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEditModeChange(true)}
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <SquarePen className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      {!editMode ? (
        <div className="flex flex-col gap-6 px-1 py-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <FieldRow label="First Name" value={user.first_name} />
            <FieldRow label="Last Name" value={user.last_name} />
            <FieldRow label="Email" value={user.email} />
            <FieldRow label="Gender" value={user.gender} />
          </div>
          {user.description && (
            <div className="flex flex-col gap-1 border-t pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                About
              </p>
              <p className="text-base italic text-foreground/90">
                &ldquo;{user.description}&rdquo;
              </p>
            </div>
          )}
        </div>
      ) : (
        <Form action={handleSubmit} className="flex flex-col gap-6 px-1 py-6">
          {/* Same grid position as view mode: the value is now the input */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="firstName">First Name</FieldLabel>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user.first_name}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user.last_name}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              {/* Email can't be changed here — no input, just a
                  disabled-looking field so it reads as inert. */}
              <FieldLabel htmlFor="email-display">Email</FieldLabel>
              <div
                id="email-display"
                className="flex h-9 w-full items-center rounded-md border border-transparent bg-muted px-3 text-sm text-muted-foreground"
              >
                {user.email}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="gender">Gender</FieldLabel>
              <Select name="gender" defaultValue={user.gender}>
                <SelectTrigger id="gender" className="w-full">
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {["Male", "Female", "Others"].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              name="username"
              defaultValue={user.username}
              required
            />
          </div>

          {/* Same position as the "About" block in view mode */}
          <div className="flex flex-col gap-1 border-t pt-5">
            <FieldLabel htmlFor="description">About</FieldLabel>
            <Textarea
              id="description"
              name="description"
              defaultValue={user.description}
            />
          </div>

          <div className="flex justify-end pt-2">
            <SubmitButtons onCancel={() => onEditModeChange(false)} />
          </div>
        </Form>
      )}
    </div>
  );
};

export default ProfileTab;
