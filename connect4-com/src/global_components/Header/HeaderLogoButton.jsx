import React from 'react'

const HeaderLogoButton = ({ icon: Icon, ...props }) => {
    return (
        <button
            className="h-90% flex items-center justify-left px-1 py-1  bg-[#46494f]"
            {...props}
        >
            {Icon && <Icon style={{ width: '60%', height: '60%' }} />}
        </button>
    )
}

export default HeaderLogoButton