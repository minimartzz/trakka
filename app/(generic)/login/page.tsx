import LoginClient from "@/components/LoginClient";
import { Suspense } from "react";

const LoadingFallback = () => (
  // Use a minimal version of your header and card as a loading state
  <div className="flex min-h-screen justify-center items-center bg-background p-4">
    <div className="w-full max-w-lg p-5 border rounded-lg shadow-lg">
      <div className="h-10 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-1/4 pt-2" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-300 rounded-sm w-full mt-5" />
      </div>
    </div>
  </div>
);

const Page = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginClient />
    </Suspense>
  );
};

export default Page;
