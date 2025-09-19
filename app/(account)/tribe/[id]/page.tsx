import WorkInProgress from "@/components/WorkInProgress";
import React from "react";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  return <WorkInProgress pageName={`Group ID: ${id}`} />;
};

export default Page;
