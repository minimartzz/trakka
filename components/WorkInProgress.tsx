import React from "react";

const WorkInProgress = ({ pageName }: { pageName: string }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8 text-center">
      <div className="rounded-lg bg-white p-10 shadow-lg">
        <h1 className="mt-6 text-4xl font-bold text-gray-800">
          {`⚠️🔨 The ${pageName} Page is Under Construction 🔨⚠️`}
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          We apologise for the inconvenience. Please check back again later.
        </p>
      </div>
    </div>
  );
};

export default WorkInProgress;
