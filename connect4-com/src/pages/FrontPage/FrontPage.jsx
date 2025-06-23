import React from 'react'
import './FrontPage.css'
import Sidebar from './../../global_components/SideBar/SideBar.jsx'
import SideBarLogoButton from './../../global_components/SideBar/SideBarLogoButton.jsx'
import SidebarButton from './../../global_components/SideBar/SideBarButton.jsx'
import PlayGameIcon from './../../assets/PlayGame.svg?react'
import PopTextLogo from './../../assets/PopTextLogo.svg?react'
import PuzzleIcon from './../../assets/Puzzle.svg?react'
import LearnIcon from './../../assets/Learn.svg?react'
import ProfileIcon from './../../assets/Profile.svg?react'

const FrontPage = () => {
    return (
        <div className="flex pl-[250px] h-screen bg-[#2f3136] text-white font-Nunito">
            <Sidebar>
                <SideBarLogoButton icon={PopTextLogo} />
                <SidebarButton icon={PlayGameIcon} text="Play Online" />
                <SidebarButton icon={PuzzleIcon} text="Puzzles" />
                <SidebarButton icon={LearnIcon} text="Learn" />
                <SidebarButton icon={ProfileIcon} text="View Profile" />



            </Sidebar>
            <main className="flex-1 flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to Connect4!</h1>
                <p className="text-lg">Start a new game or explore the sidebar.</p>
            </main>
        </div>
    )
}

export default FrontPage