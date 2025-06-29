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
import Connect4Sample from './../../assets/Connect4Sample.svg'

const FrontPage = () => {
    return (
        <div className="flex h-screen bg-[#2f3136] text-white font-Nunito">
            <div className="hidden md:block">
                <Sidebar>
                    <SideBarLogoButton icon={PopTextLogo} />
                    <SidebarButton icon={PlayGameIcon} text="Play Online" />
                    <SidebarButton icon={PuzzleIcon} text="Puzzles" />
                    <SidebarButton icon={LearnIcon} text="Learn" />
                    <SidebarButton icon={ProfileIcon} text="View Profile" />
                </Sidebar>
            </div>
            <main className="flex-1 w-full pl-0 md:pl-[250px] mt-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-center">
                    {/* Hide image below xs (500px) */}
                    <div className="hidden sm:flex justify-center md:w-auto">
                        <img
                            className="w-[550px] min-w-[200px] max-w-full mb-8 md:mb-0"
                            src={Connect4Sample}
                            alt="Connect4 Sample"
                        />
                    </div>
                    <div className="w-full md:w-2/5 text-center flex flex-col items-center">
                        <h1 className="text-4xl font-bold mb-4 font-nunito">Play Connect4 Online on the #1 site!</h1>
                        <p className="text-lg">Start a new game or explore the sidebar.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default FrontPage