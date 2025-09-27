import Image from "next/image";
import React from "react";

const Footer = () => {
  return (
    <footer className="relative w-full h-10 bg-primary text-white flex items-center justify-between p-4">
      <p className="text-sm">📝 Record it in your Trakka</p>
      <Image
        src="/bgg/powered-by-bgg-reversed-rgb.svg"
        alt="Powered by BGG"
        width={100}
        height={30}
      />
    </footer>
  );
};

export default Footer;
