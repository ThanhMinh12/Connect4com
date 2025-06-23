import React from 'react'

const SideBarLogoButton = ({ icon: Icon, ...props }) => {
    return (
        <button
            className="w-full flex items-center justify-center px-2 py-1 mb-3 bg-[#46494f]"
            {...props}
        >
            {Icon && <Icon style={{ width: '80%', height: '100%' }} />}
        </button>
    )
}

export default SideBarLogoButton