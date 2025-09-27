import { createClient } from "@/utils/supabase/server";
import React from "react";

const Page = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(user);

  return <div>My Profile</div>;
};

export default Page;
