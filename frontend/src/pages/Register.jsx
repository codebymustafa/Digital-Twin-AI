import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password,
      });
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/onboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-panel p-10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h2 className="text-4xl font-orbitron neon-text text-center text-cyberPink mb-2 z-10 relative">Create Your Account</h2>
        <p className="text-gray-400 text-center text-sm font-inter mb-8">Sign up to create your Digital Twin and start making smarter decisions</p>

        {error && <p className="text-red-500 mb-4 text-center text-sm font-inter">{error}</p>}

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          <div className="relative">
            <input
              type="text"
              className="w-full bg-transparent border-b-2 border-cyberBlue text-cyberText py-2 focus:outline-none focus:border-cyberPink transition-colors"
              placeholder="Choose a Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <input
              type="email"
              className="w-full bg-transparent border-b-2 border-cyberBlue text-cyberText py-2 focus:outline-none focus:border-cyberPink transition-colors"
              placeholder="Your Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <input
              type="password"
              className="w-full bg-transparent border-b-2 border-cyberBlue text-cyberText py-2 focus:outline-none focus:border-cyberPink transition-colors"
              placeholder="Choose a Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="mt-4 bg-cyberDark text-cyberPink py-3 rounded-lg border border-cyberPink hover:bg-cyberPink hover:text-cyberDark transition-all duration-300 font-orbitron font-bold tracking-widest neon-glow-pink disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm font-inter text-gray-400">
          Already have an account? <Link to="/login" className="text-cyberNeon hover:underline">Log in here</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
