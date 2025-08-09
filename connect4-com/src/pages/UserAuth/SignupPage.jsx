import { useState, useEffect } from 'react';
import { signup } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
      authLogin(data.user);
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create an account</h1>
        <h2 className="text-lg font-medium text-gray-700 mb-4">Sign up with email</h2>
        <div onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSignup}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <hr className="my-6 border-gray-300" />
        <h2 className="text-lg font-medium text-gray-700 mb-4">Or sign up with Google</h2>
        <div id="google-button" className="mt-4 flex justify-center">
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <p className="text-sm text-gray-500">
              Google Sign-In not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.
            </p>
          )}
        </div>
        
        {/* Test Google configuration */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-2 bg-blue-50 rounded text-xs">
            <p className="font-bold">Google Configuration Test:</p>
            <p>Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}</p>
            <p>Origin: {window.location.origin}</p>
            <p>Status: {window.google ? '✅ Google loaded' : '❌ Google not loaded'}</p>
            <p className="text-red-500 font-bold">Add this to Google Cloud Console:</p>
            <p className="bg-yellow-100 p-1 rounded">{window.location.origin}</p>
            <button 
              onClick={() => console.log('Google object:', window.google)}
              className="mt-2 px-2 py-1 bg-blue-200 rounded text-xs"
            >
              Test Google Object
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignupPage;