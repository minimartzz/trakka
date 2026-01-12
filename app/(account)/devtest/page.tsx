import Image from "next/image";
import React from "react";

const Page = () => {
  return (
    <div className="flex min-h-screen justify-center items-center">
      <div className="relative w-40 h-40 rounded-full overflow-hidden">
        <Image
          src="https://gfhcmvtbxarjafdrxvcv.supabase.co/storage/v1/object/public/images/avatars/28fa72aa-1968-412c-90ca-d8411d706f50.jpg"
          alt="test"
          className="object-cover"
          fill
        />
      </div>
    </div>
  );
};

export default Page;
