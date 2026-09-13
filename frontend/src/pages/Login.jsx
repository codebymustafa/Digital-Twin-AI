import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password
      });

      sessionStorage.setItem('token', res.data.token);

      const userData = res.data.user;
      if (email.toLowerCase() === 'admin@digitaltwin.com' || userData.username?.toLowerCase() === 'admin') {
        userData.role = 'admin';
      }

      sessionStorage.setItem('user', JSON.stringify(userData));

      if (userData.role === 'admin') {
        navigate('/dashboard');
        return;
      }

      if (res.data.user.onboardingCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/10"
      >
        <h2 className="text-3xl md:text-4xl font-orbitron neon-text text-center text-cyberNeon mb-2 z-10 relative">Welcome Back</h2>
        <p className="text-gray-400 text-center text-sm font-inter mb-8">Sign in to access your Digital Twin</p>

        {error && <p className="text-red-400 mb-4 text-center text-xs font-mono bg-red-500/10 p-3 rounded-xl border border-red-500/30">{error}</p>}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="relative">
            <input
              type="email"
              className="w-full bg-transparent border-b-2 border-cyberBlue/40 text-cyberText py-2.5 focus:outline-none focus:border-cyberNeon transition-colors font-inter text-sm"
              placeholder="Your Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <input
              type="password"
              className="w-full bg-transparent border-b-2 border-cyberBlue/40 text-cyberText py-2.5 focus:outline-none focus:border-cyberNeon transition-colors font-inter text-sm"
              placeholder="Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="mt-4 bg-cyberNeon text-[#050308] py-3.5 rounded-xl hover:bg-white transition-all duration-300 font-orbitron font-bold text-sm tracking-widest disabled:opacity-60 cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.3)]"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm font-inter text-gray-400">
          Don't have an account? <Link to="/register" className="text-cyberPink hover:underline font-semibold ml-1">Create one here</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
