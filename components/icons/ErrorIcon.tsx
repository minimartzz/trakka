import React from "react";

const ErrorIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" {...props}>
      <defs>
        <style>
          {`.cls-2{fill:#e1e4ed}.cls-4{fill:#cdd2e1}.cls-10{fill:#393045}`}
        </style>
      </defs>
      <g id="_02-error" data-name="02-error">
        <path className="fill:#afb4c8" d="m41 47 2 8H21l2-8h18z" />
        <path
          className="cls-2"
          d="M46 55a2.006 2.006 0 0 1 2 2 2.015 2.015 0 0 1-2 2H18a2.006 2.006 0 0 1-2-2 2.015 2.015 0 0 1 2-2h28zM63 41v2a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4v-2z"
        />
        <path
          d="M63 9v32H1V9a4 4 0 0 1 4-4h54a4 4 0 0 1 4 4z"
          style={{ fill: "#ade1fa" }}
        />
        <path
          className="cls-4"
          d="M7 43v-2H1v2a4 4 0 0 0 4 4h6a4 4 0 0 1-4-4z"
        />
        <path
          d="M11 5H5a4 4 0 0 0-4 4v32h6V9a4 4 0 0 1 4-4z"
          style={{ fill: "#8ed8f8" }}
        />
        <path
          className="cls-4"
          d="M57 43v-2h6v2a4 4 0 0 1-4 4h-6a4 4 0 0 0 4-4z"
        />
        <path
          d="M53 5h6a4 4 0 0 1 4 4v32h-6V9a4 4 0 0 0-4-4z"
          style={{ fill: "#d4effc" }}
        />
        <path style={{ fill: "#99a1b1" }} d="M41 47H23l-1 4h20l-1-4z" />
        <path
          className="cls-4"
          d="M18 59h28a2.015 2.015 0 0 0 2-2H16a2.006 2.006 0 0 0 2 2z"
        />
        <path
          d="M32 9a14 14 0 1 1-14 14A14 14 0 0 1 32 9zm1 16 1-12h-4l1 12zm1 5a2 2 0 1 0-2 2 2.006 2.006 0 0 0 2-2z"
          style={{ fill: "#f26973" }}
        />
        <path
          d="M32 9a13.994 13.994 0 0 0-12.428 7.572 13.96 13.96 0 0 1 10.649-.921L30 13h4l-.357 4.28a13.965 13.965 0 0 1 4.785 18.148A13.994 13.994 0 0 0 32 9z"
          style={{ fill: "#e65263" }}
        />
        <path className="cls-2" d="m34 13-1 12h-2l-1-12h4z" />
        <circle className="cls-2" cx="32" cy="30" r="2" />
        <path
          className="cls-10"
          d="M59 4H5a5.006 5.006 0 0 0-5 5v34a5.006 5.006 0 0 0 5 5h16.719l-1.5 6H18a3.015 3.015 0 0 0-3 3 3 3 0 0 0 3 3h28a3.015 3.015 0 0 0 3-3 3 3 0 0 0-3-3h-2.219l-1.5-6H59a5.006 5.006 0 0 0 5-5V9a5.006 5.006 0 0 0-5-5zM5 6h54a3 3 0 0 1 3 3v31H2V9a3 3 0 0 1 3-3zm42 51a.974.974 0 0 1-.306.712A.957.957 0 0 1 46 58H18a1 1 0 0 1-1-1 .974.974 0 0 1 .306-.712A.957.957 0 0 1 18 56h28a1 1 0 0 1 1 1zm-24.719-3 1.5-6h16.438l1.5 6zM59 46H5a3 3 0 0 1-3-3v-1h60v1a3 3 0 0 1-3 3z"
        />
        <path
          className="cls-10"
          d="M32 38a15 15 0 1 0-15-15 15.017 15.017 0 0 0 15 15zm0-28a13 13 0 1 1-13 13 13.015 13.015 0 0 1 13-13z"
        />
        <path
          className="cls-10"
          d="M32 33a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0-4a1 1 0 1 1-1 1 1 1 0 0 1 1-1zM31 26h2a1 1 0 0 0 1-.917l1-12A1 1 0 0 0 34 12h-4a1 1 0 0 0-1 1.083l1 12A1 1 0 0 0 31 26zm1.913-12-.833 10h-.16l-.833-10z"
        />
      </g>
    </svg>
  );
};

export default ErrorIcon;
