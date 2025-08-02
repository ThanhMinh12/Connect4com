import './App.css';
import '@fontsource/inter/index.css';
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketContext, socket } from './contexts/SocketContext'
import ProtectedRoute from './components/ProtectedRoute'
import FrontPage from './pages/FrontPage/FrontPage.jsx'
import LoginPage from './pages/UserAuth/LoginPage.jsx'
import SignupPage from './pages/UserAuth/SignupPage.jsx'
import ProfilePage from './pages/Profile/ProfilePage.jsx'
import GameRoom from './pages/Game/GameRoom.jsx'

function App() {
    return (
      <AuthProvider>
        <SocketContext.Provider value={socket}>
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/signup" element={<SignupPage />}/>
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }/>
            <Route path="/room" element={
              <ProtectedRoute>
                <GameRoom />
              </ProtectedRoute>
            } />
          </Routes>
        </SocketContext.Provider>
      </AuthProvider>
  )
}

export default App
