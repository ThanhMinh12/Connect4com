import React from 'react'

const SideBarLogoButton = ({ icon: Icon, ...props }) => {
    return (
        <button
            className="w-full flex items-center justify-center px-1 py-1 mb-2 bg-[#46494f]"
            {...props}
        >
            {Icon && <Icon style={{ width: '90%', height: '100%' }} />}
        </button>
    )
}

export default SideBarLogoButton