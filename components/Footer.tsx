import Image from "next/image";
import React from "react";

const Footer = () => {
  return (
    <footer className="relative w-full h-15 bg-primary text-white flex items-center justify-center p-4">
      <div className="text-center">
        {/* <p>&copy; {new Date().getFullYear()} Trakka Co. All rights reserved.</p> */}
        <p className="text-sm mt-1">📝 Record it in your Trakka</p>
      </div>

      <div className="absolute bottom-0 right-0 p-3">
        <Image
          src="/bgg/powered-by-bgg-reversed-rgb.svg"
          alt="Powered by BGG"
          width={150}
          height={40}
        />
      </div>
    </footer>
  );
};

export default Footer;
