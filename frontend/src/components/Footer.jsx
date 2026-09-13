import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Footer = () => {
    const location = useLocation();

    if (location.pathname === '/dashboard' || location.pathname === '/onboard' || location.pathname === '/simulation') return null;

    return (
        <footer className="glass-panel border-t border-cyberBlue/20 mt-20">
            <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <span className="font-orbitron font-bold text-xl text-white mb-2 block">DIGITAL<span className="text-cyberPink italic">TWIN</span> AI</span>
                    <p className="text-gray-300 font-inter text-sm italic leading-relaxed max-w-md">
                        "The ultimate synergy between human consciousness and artificial intelligence."
                    </p>
                </div>
                <div className="flex gap-8 text-xs font-orbitron uppercase tracking-widest text-gray-400">
                    <Link to="/" className="hover:text-cyberNeon transition-colors">Home</Link>
                    <Link to="/features" className="hover:text-cyberNeon transition-colors">Features</Link>
                    <Link to="/pricing" className="hover:text-cyberNeon transition-colors">Premium Features</Link>
                    <Link to="/about" className="hover:text-cyberNeon transition-colors">The Blueprint</Link>
                </div>
            </div>
            <div className="border-t border-white/5 text-center py-6 text-xs text-gray-500 font-mono">
                &copy; {new Date().getFullYear()} Digital Twin AI. All Rights Reserved.
            </div>
        </footer>
    );
};

export default Footer;
