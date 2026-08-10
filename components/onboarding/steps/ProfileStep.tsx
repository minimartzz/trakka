"use client";

import AvatarUploader from "@/components/AvatarUploader";
import type { ProfileDraft } from "@/components/onboarding/steps";
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

interface ProfileStepProps {
  userId: string;
  email: string;
  profile: ProfileDraft;
  errors: Partial<Record<keyof ProfileDraft, string>>;
  defaultImageUrl: string;
  onChange: (patch: Partial<ProfileDraft>) => void;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1.5 text-xs text-destructive">{message}</p>
  ) : null;

const ProfileStep = ({
  userId,
  email,
  profile,
  errors,
  defaultImageUrl,
  onChange,
}: ProfileStepProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <AvatarUploader
          userId={userId}
          initialImageUrl={profile.image}
          defaultImageUrl={defaultImageUrl}
          onImageUrlChange={(url) => onChange({ image: url })}
        />
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName" className="mb-2">
              First name
            </Label>
            <Input
              id="firstName"
              value={profile.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              aria-invalid={!!errors.firstName}
              autoComplete="given-name"
            />
            <FieldError message={errors.firstName} />
          </div>
          <div>
            <Label htmlFor="lastName" className="mb-2">
              Last name
            </Label>
            <Input
              id="lastName"
              value={profile.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              aria-invalid={!!errors.lastName}
              autoComplete="family-name"
            />
            <FieldError message={errors.lastName} />
          </div>
        </div>

        <div>
          <Label htmlFor="username" className="mb-2">
            Username
          </Label>
          <Input
            id="username"
            value={profile.username}
            onChange={(e) => onChange({ username: e.target.value })}
            aria-invalid={!!errors.username}
            autoComplete="username"
          />
          <FieldError message={errors.username} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            This is what your tribe sees on leaderboards.
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="mb-2">
            About you{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="description"
            value={profile.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Ruthless negotiator. Never plays the same opening twice."
          />
        </div>

        <div>
          <Label htmlFor="gender" className="mb-2">
            Gender
          </Label>
          <Select
            value={profile.gender || undefined}
            onValueChange={(value) =>
              onChange({ gender: value as ProfileDraft["gender"] })
            }
          >
            <SelectTrigger
              id="gender"
              className="w-full"
              aria-invalid={!!errors.gender}
            >
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
          <FieldError message={errors.gender} />
        </div>

        <p className="text-xs text-muted-foreground">
          Signed in as <span className="text-foreground">{email}</span>
        </p>
      </div>
    </div>
  );
};

export default ProfileStep;
