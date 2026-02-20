import React from "react";

const MeepleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      id="Meeple--Streamline-Tabler"
      className={className}
      {...props}
    >
      <desc>
        {"\n    Meeple Streamline Icon: https://streamlinehq.com\n  "}
      </desc>
      <path d="M9 20H4a1 1 0 0 1 -1 -1c0 -2 3.378 -4.907 4 -6 -1 0 -4 -0.5 -4 -2 0 -2 4 -3.5 6 -4 0 -1.5 0.5 -4 3 -4s3 2.5 3 4c2 0.5 6 2 6 4 0 1.5 -3 2 -4 2 0.622 1.093 4 4 4 6a1 1 0 0 1 -1 1h-5c-1 0 -2 -4 -3 -4s-2 4 -3 4z" />
    </svg>
  );
};

export default MeepleIcon;
