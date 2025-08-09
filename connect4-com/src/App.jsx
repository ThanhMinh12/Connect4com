import './App.css';
import '@fontsource/inter/index.css';
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import ProtectedRoute from './components/ProtectedRoute'
import FrontPage from './pages/FrontPage/FrontPage.jsx'
import LoginPage from './pages/UserAuth/LoginPage.jsx'
import SignupPage from './pages/UserAuth/SignupPage.jsx'
import ProfilePage from './pages/Profile/ProfilePage.jsx'
import GameRoom from './pages/Game/GameRoom.jsx'
import WaitRoom from './pages/Game/WaitRoom.jsx';

function App() {
    return (
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/signup" element={<SignupPage />}/>
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }/>
            <Route path="/room/friendly" element={
              <ProtectedRoute>
                <GameRoom />
              </ProtectedRoute>
            } />
            <Route path="/room/waiting" element={
              <ProtectedRoute>
                <WaitRoom />
              </ProtectedRoute>
            } />
            <Route path="/room/:roomId" element={
              <ProtectedRoute>
                <GameRoom />
              </ProtectedRoute>
            } />
          </Routes>
        </SocketProvider>
      </AuthProvider>
  )
}

export default App
