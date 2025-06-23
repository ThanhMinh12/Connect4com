import React from 'react'

const SidebarButton = ({ icon: Icon, text, ...props }) => {
    return (
        <button
            className="w-full flex items-center px-4 py-3 rounded-lg bg-[#46494f] hover:bg-[#36393f] transition-colors duration-150 group overflow-visible"
            {...props}
        >
            <span className="flex items-center justify-center w-14 h-14 overflow-visible">
                {Icon && <Icon className="w-12 h-12" />}
            </span>
            <span className="ml-4 text-white text-lg font-bold font-nunito flex-1 text-left">
                {text}
            </span>
        </button>
    )
}

export default SidebarButton
