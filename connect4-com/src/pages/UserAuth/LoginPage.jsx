import { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Connect4Sample from "./../../assets/Connect4Sample.svg";

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const data = await login(email, password);
      authLogin(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#2f3136] font-Nunito">
      <div className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <img 
            src={Connect4Sample} 
            alt="Connect4" 
            className="w-32 h-32 mx-auto"
          />
          <h1 className="text-3xl font-bold text-white mt-4">Sign In</h1>
          <p className="text-gray-400 mt-2">Welcome back to Connect4</p>
        </div>
        
        <div className="bg-black bg-opacity-20 rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-[#2f3136] text-white rounded-md border border-gray-700 focus:border-[#60a7b1] focus:outline-none mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full p-3 bg-[#2f3136] text-white rounded-md border border-gray-700 focus:border-[#60a7b1] focus:outline-none mt-1"
              />
            </div>
            
            <button
              type="submit"
              className="w-full p-3 bg-[#60a7b1] hover:bg-[#70b7b9] text-white rounded-md transition-colors duration-200 font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#60a7b1] hover:text-[#70b7b9]">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;