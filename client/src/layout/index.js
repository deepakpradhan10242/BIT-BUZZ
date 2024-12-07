import React from "react";
import logo from "../assets/logo.png";

const AuthLayouts = ({ children }) => {
  return (
    <>
      <header className="flex justify-center items-center py-5 h-24 shadow-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white">
        <div className="flex items-center space-x-3">
          <p className="text-6xl font-extrabold tracking-tight text-white drop-shadow-lg font-[Cookie]">
            <span className="text-white-400">BIT</span>
          </p>

          <img
            src={logo}
            alt="logo"
            width={90}
            height={30}
            className="rounded-md shadow-lg"
          />
          <p className="text-6xl font-extrabold tracking-tight text-white drop-shadow-lg font-[Cookie]">
            <span className="text-white-400">BUZZ</span>
          </p>
        </div>
      </header>

      <div className="container mx-auto p-6">{children}</div>
    </>
  );
};

export default AuthLayouts;
