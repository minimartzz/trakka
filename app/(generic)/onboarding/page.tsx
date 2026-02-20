"use client";
import { saveProfile } from "@/app/(generic)/onboarding/action";
import LoadingSpinner from "@/components/icons/LoadingSpinner";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import createClient from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "nextjs-toploader/app";
import React, { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

const GENERIC_IMAGE_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_HEADER}/storage/v1/object/public/images/avatars/generic_profile.png`;

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
      }
      setLoading(false);
    };
    fetchUser();
    console.log(user);
  }, []);

  const handleImageUrlChange = (url: string | null) => {
    setProfilePictureUrl(url);
  };

  const handleSubmit = async (formData: FormData) => {
    const finalImageUrl = profilePictureUrl || GENERIC_IMAGE_URL;
    formData.append("email", user!.email!);
    formData.append("profilePicture", finalImageUrl);
    formData.append("uuid", user!.id);

    const result = await saveProfile(formData);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      setError(null);
      toast.success("Profile saved successfully!");
      router.push("/dashboard");
    }
  };

  const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" className="w-full mt-4" disabled={pending}>
        {pending ? "Saving..." : "Save Profile"}
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-background p-4">
      <h1 className="text-5xl font-bold tracking-tight leading-tight pb-2 bg-gradient-to-r from-primary via-chart-2 to-ring bg-clip-text text-transparent">
        Welcome to Trakka
      </h1>
      <h3 className="text-xl font-semibold">We just need a bit more info...</h3>
      <Card className="w-full max-w-lg p-1 py-5 m-8">
        <CardHeader>
          <CardTitle className="text-xl">Profile Details</CardTitle>
          <p className="text-muted-foreground">
            Fill in your details below to complete your sign up
          </p>
        </CardHeader>
        <CardContent>
          {/* Upload profile picture */}
          <ProfilePictureUploader
            userId={user!.id}
            onImageUrlChange={handleImageUrlChange}
            initialImageUrl={profilePictureUrl}
            defaultImageUrl={GENERIC_IMAGE_URL}
            path="avatars"
          />
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400 italic">
              Please make sure your image file does not contain a &quot;.&quot;
            </p>
          </div>
          <div className="w-full border-t border-gray-200 my-4" />

          {/* Form content */}
          <form className="space-y-4" action={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="mb-2">
                  First Name
                </Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div>
                <Label htmlFor="lastName" className="mb-2">
                  Last Name
                </Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div>
              <Label htmlFor="username" className="mb-2">
                Username
              </Label>
              <Input id="username" name="username" required />
            </div>
            <div>
              <Label htmlFor="description" className="mb-2">
                Description
              </Label>
              <Textarea id="description" name="description" />
            </div>
            <div>
              <Label htmlFor="gender" className="mb-2">
                Gender
              </Label>
              <Select name="gender">
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

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
