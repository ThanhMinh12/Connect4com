import React from "react";
import HeaderUserAuthButton from "./UserAuthButton";

const Header = ({ children }) => {
  const items = React.Children.toArray(children);
  const authButtons = items.filter(
    (child) => child.type === HeaderUserAuthButton
  );
  const otherItems = items.filter(
    (child) => child.type !== HeaderUserAuthButton
  );

  return (
    <header className="fixed top-0 left-0 w-full h-[70px] z-10 bg-[#46494f] flex items-center p-4">
      {/* Left-aligned content */}
      <div className="flex items-center space-x-0">
        {otherItems}
      </div>

      {/* Right-aligned UserAuthButtons */}
      <div className="flex items-center space-x-4 ml-auto">
        {authButtons}
      </div>
    </header>
  );
};

export default Header;
