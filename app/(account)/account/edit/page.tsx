"use client";
import { updateProfile } from "@/app/(account)/account/edit/action";
import useAuth from "@/app/hooks/useAuth";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
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
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import Form from "next/form";
import Link from "next/link";

const GENERIC_IMAGE_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_HEADER}/storage/v1/object/public/images/avatars/generic_profile.png`;

const Page = () => {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );
  const router = useRouter();

  const { user, authLoading } = useAuth();
  if (authLoading || !user) {
    return;
  }

  // Function definitions
  const handleImageUrlChange = (url: string | null) => {
    setProfilePictureUrl(url);
  };

  const handleSubmit = async (formData: FormData) => {
    const finalImageUrl = profilePictureUrl || user.image || GENERIC_IMAGE_URL;
    formData.append("userId", user.id);
    formData.append("profilePicture", finalImageUrl);

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success(result.message);
      router.push("/account");
    } else {
      toast.error(result.message);
    }
  };

  const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
      <div className="flex mt-8 gap-x-3 items-center">
        <Button variant="outline" asChild>
          <Link href="/account">Cancel</Link>
        </Button>
        <Button
          type="submit"
          className="font-semibold bg-add-button hover:bg-green-600 cursor-pointer"
          disabled={pending}
        >
          {pending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    );
  };

  return (
    <div className="p-12">
      {/* Profile Picture */}
      <ProfilePictureUploader
        userId={String(user.id)}
        onImageUrlChange={handleImageUrlChange}
        initialImageUrl={user.image}
        defaultImageUrl={GENERIC_IMAGE_URL}
        path="avatars"
      />
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400 italic">
          Please make sure your image file does not contain a &quot;.&quot;
        </p>
      </div>

      {/* Form Content */}
      <Form action={handleSubmit}>
        <div className="p-12 space-y-4 mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="mb-2">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user.first_name}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="mb-2">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user.last_name}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="username" className="mb-2">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              defaultValue={user.username}
              required
            />
          </div>
          <div>
            <Label htmlFor="description" className="mb-2">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={user.description}
            />
          </div>
          <div>
            <Label htmlFor="gender" className="mb-2">
              Gender
            </Label>
            <Select name="gender" defaultValue={String(user.gender)}>
              <SelectTrigger className="w-full">
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
          <div className="flex justify-end pt-4">
            <SubmitButton />
          </div>
        </div>
      </Form>
    </div>
  );
};

export default Page;
