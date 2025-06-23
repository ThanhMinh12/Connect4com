import React from 'react'

const Sidebar = ({ children }) => {
    return (
        <div
            className="
                fixed top-0 left-0 h-full w-[250px] z-10 bg-[#46494f] overflow-x-hidden pt-5 flex flex-col
            "
        >
            {children}
        </div>
    )
}

export default Sidebar