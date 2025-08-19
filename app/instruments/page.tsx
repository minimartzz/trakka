import { createClient } from "@/utils/supabase/server";
import React from "react";

const Page = async () => {
  const supabase = await createClient();
  const { data: groups } = await supabase.from("groups").select();
  console.log(groups);

  return <pre>{JSON.stringify(groups, null, 2)}</pre>;
};

export default Page;
