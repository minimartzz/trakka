import Image from "next/image";
import React from "react";

const Footer = () => {
  return (
    <footer className="absolute bottom-0 w-full h-8 bg-secondary dark:text-white flex items-center justify-between p-4">
      <p className="text-sm">📝 Record it in your Trakka</p>
      <Image
        src="/bgg/powered-by-bgg-reversed-rgb.svg"
        alt="Powered by BGG"
        width={100}
        height={30}
        className="hidden dark:block"
      />
      <Image
        src="/bgg/powered-by-bgg-rgb.svg"
        alt="Powered by BGG"
        width={100}
        height={30}
        className="dark:hidden"
      />
    </footer>
  );
};

export default Footer;
