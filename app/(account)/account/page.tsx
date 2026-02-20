import { Button } from "@/components/ui/button";
import fetchUser from "@/utils/fetchServerUser";
import { format } from "date-fns";
import { SquarePen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Page = async () => {
  // Get user details
  const user = await fetchUser();

  // Formatting functions
  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), "dd MMM yyyy");
  };

  return (
    <div className="p-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-center">
        <div className="relative">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300">
            <Image
              src={user.image}
              alt="Profile picture"
              layout="fill"
              objectFit="cover"
            />
          </div>
          <Button
            className="sm:hidden absolute top-0 right-[-80px] dark:text-background text-foreground ml-auto font-semibold bg-gray-500 hover:bg-gray-600 p-2"
            asChild
          >
            <Link href="/account/edit">
              <SquarePen className="w-2 h-2" />
            </Link>
          </Button>
        </div>
        <div className="text-center md:text-left mt-5 md:mt-0 md:ml-10 space-y-2">
          <h1 className="text-3xl font-bold">
            {user.first_name} {user.last_name}
          </h1>
          <h2 className="text-xl text-muted-foreground">@{user.username}</h2>
          <p className="text-sm text-gray-600">
            Last Seen: {formatDate(user.updated_at)}
          </p>
          <p className="text-sm text-gray-600">
            Member Since: {formatDate(user.confirmed_at)}
          </p>
        </div>
        <Button
          className="hidden md:block text-white ml-auto self-start font-semibold bg-gray-500 hover:bg-gray-600"
          asChild
        >
          <Link href="/account/edit">
            <span className="flex items-center gap-x-2">
              <SquarePen className="h-4 w-4" />
              <p className="hidden lg:block">Edit Profile</p>
            </span>
          </Link>
        </Button>
      </div>
      <p className="pl-4 mt-8 italic">{`"${user.description}"`}</p>
      <hr />

      {/* Account Details */}
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex-col">
          <p className="font-semibold text-lg mb-0.5">First Name:</p>
          <p className="text-lg">{user.first_name}</p>
        </div>
        <div className="flex-col">
          <p className="font-semibold text-lg mb-0.5">Last Name:</p>
          <p className="text-lg">{user.last_name}</p>
        </div>
        <div className="col-span-2">
          <p className="font-semibold text-lg mb-0.5">Email:</p>
          <p className="text-lg">{user.email}</p>
        </div>
        <div className="col-span-2">
          <p className="font-semibold text-lg mb-0.5">Gender:</p>
          <p className="text-lg">{user.gender}</p>
        </div>
      </div>

      {/* TODO: Linked Accounts, Interests, Favourite Games, etc. */}
    </div>
  );
};

export default Page;
