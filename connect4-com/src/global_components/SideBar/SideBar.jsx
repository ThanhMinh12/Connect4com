import React from 'react';
import UserAuthButton from './UserAuthButton';

const Sidebar = ({ children }) => {
  const allChildren = React.Children.toArray(children);
  const authButtons = allChildren.filter(
    (child) => child.type === UserAuthButton
  );
  const otherItems = allChildren.filter(
    (child) => child.type !== UserAuthButton
  );

  return (
    <div
      className="fixed top-0 left-0 h-full w-[250px] z-10 bg-[#46494f] overflow-x-hidden pt-5 flex flex-col"
    >
      {/* Top-aligned items */}
      <div>
        {otherItems}
      </div>

      {/* Spaced UserAuthButtons */}
      <div className="mt-[30px]">
        {authButtons}
      </div>
    </div>
  );
};

export default Sidebar;
