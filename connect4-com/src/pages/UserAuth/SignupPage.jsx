import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signup } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Connect4Sample from "./../../assets/Connect4Sample.svg";


function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin, checkAuth } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await signup(email, username, password);
      authLogin(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (response) => {
    const idToken = response.credential;
    console.log('Google credential received:', response);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Google login error:', data);
        throw new Error(data.error || data.message || 'Google login failed');
      }

      const data = await res.json();
      console.log('Google login success:', data);
      authLogin(data.user, data.token);
      await checkAuth();
      navigate('/');
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed. Please try again.');
    }
  };

  useEffect(() => {
    if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    }

    function initializeGoogleSignIn() {
      if (window.google && window.google.accounts) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        console.log('Initializing Google Sign-In with client ID:', clientId);
        
        if (!clientId || clientId === 'your_google_client_id_here') {
          console.warn('Google Client ID not configured');
          return;
        }

        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredential,
          });
          
          const buttonElement = document.getElementById('google-button');
          if (buttonElement) {
            window.google.accounts.id.renderButton(buttonElement, { 
              theme: 'outline', 
              size: 'large',
              width: '100%'
            });
            console.log('Google button rendered successfully');
          } else {
            console.error('Google button element not found');
          }
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
        }
      } else {
        console.error('Google Sign-In library not loaded');
      }
    }

    return () => {
    };
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#2f3136] font-Nunito">
      <div className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <img 
            src={Connect4Sample} 
            alt="Connect4" 
            className="w-32 h-32 mx-auto"
          />
          <h1 className="text-3xl font-bold text-white mt-4">Create Account</h1>
          <p className="text-gray-400 mt-2">Join Connect4 and start playing</p>
        </div>
        
        <div className="bg-black bg-opacity-20 rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-[#2f3136] text-white rounded-md border border-gray-700 focus:border-[#60a7b1] focus:outline-none mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-3 bg-[#2f3136] text-white rounded-md border border-gray-700 focus:border-[#60a7b1] focus:outline-none mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 bg-[#2f3136] text-white rounded-md border border-gray-700 focus:border-[#60a7b1] focus:outline-none mt-1"
              />
            </div>
            
            <button
              type="submit"
              className="w-full p-3 bg-[#60a7b1] hover:bg-[#70b7b9] text-white rounded-md transition-colors duration-200 font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </form>
          
          <div className="my-6 flex items-center">
            <hr className="flex-1 border-gray-700" />
            <span className="px-3 text-gray-400 text-sm">OR</span>
            <hr className="flex-1 border-gray-700" />
          </div>
          
          <div id="google-button" className="w-full"></div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-[#60a7b1] hover:text-[#70b7b9]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;