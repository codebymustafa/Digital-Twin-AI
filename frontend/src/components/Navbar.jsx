import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, LogOut, LayoutDashboard, User, Menu, X, Radio } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const token = sessionStorage.getItem('token');
    const [user, setUser] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; }
    });
    const streak = localStorage.getItem('currentStreak') || '0';

    React.useEffect(() => {
        const handleRefresh = () => {
            try { setUser(JSON.parse(sessionStorage.getItem('user'))); } catch { setUser(null); }
        };
        window.addEventListener('storage', handleRefresh);
        window.addEventListener('twin-data-updated', handleRefresh);
        return () => {
            window.removeEventListener('storage', handleRefresh);
            window.removeEventListener('twin-data-updated', handleRefresh);
        };
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        setIsMobileMenuOpen(false);
    };

    if (location.pathname === '/onboard' || location.pathname === '/simulation') return null;

    const NAV_LINKS = [
        { name: 'Features', path: '/features' },
        { name: 'Premium Features', path: '/pricing' },
        { name: 'The Blueprint', path: '/about' },
    ];

    const isDashboard = location.pathname === '/dashboard';

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 w-full z-50 border-b border-white/5 transition-all duration-500 ${isDashboard ? 'bg-[#050308]/95 backdrop-blur-2xl' : 'bg-[#050308]/80 backdrop-blur-xl'}`}
        >
            <div className={`max-w-full px-6 py-4 flex justify-between items-center ${!isDashboard ? 'mx-auto max-w-7xl' : ''}`}>
                
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-x-0 bottom-0 h-4 bg-cyberNeon/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                            <BrainCircuit className="text-cyberNeon relative" size={isDashboard ? 28 : 32} />
                        </div>
                        <span className={`font-orbitron font-black tracking-tighter text-white ${isDashboard ? 'text-lg' : 'text-2xl'}`}>
                            DIGITAL<span className="text-cyberPink italic">TWIN</span>
                        </span>
                    </Link>

                    {token && !isDashboard && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-cyberNeon/5 border border-cyberNeon/20 text-cyberNeon text-[10px] font-mono animate-pulse">
                            <Radio size={12} /> NEURAL LINK ACTIVE
                        </div>
                    )}
                </div>

                {!isDashboard && (
                    <div className="hidden md:flex items-center gap-10 font-orbitron text-[10px] uppercase tracking-[0.2em]">
                        {NAV_LINKS.map(link => (
                            <Link 
                                key={link.path} 
                                to={link.path} 
                                className={`transition-all duration-300 ${location.pathname === link.path ? 'text-cyberNeon underline underline-offset-8' : 'text-gray-400 hover:text-white hover:tracking-[0.3em]'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                )}

                {isDashboard && (
                    <div className="hidden md:flex items-center gap-6 font-inter text-sm">
                        <span className="text-cyberNeon font-mono uppercase tracking-widest flex items-center gap-2">
                            <LayoutDashboard size={16} /> Neural Hub
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <div className="flex items-center gap-2">
                             {user?.avatar ? (
                                 <img src={user.avatar} className="w-8 h-8 rounded-full border border-cyberPink/40 object-cover" />
                             ) : (
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyberNeon to-cyberPink flex items-center justify-center text-[10px] font-black text-white">
                                     {user?.username?.charAt(0).toUpperCase()}
                                 </div>
                             )}
                            <span className="text-gray-300 font-orbitron text-xs tracking-widest uppercase ml-1">
                                {user?.username || 'User'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 bg-cyberPink/10 px-3 py-1 rounded-full border border-cyberPink/30 text-cyberPink font-mono text-[10px]">
                             SYNC_STREAK: {streak}
                        </div>
                    </div>
                )}

                <div className="hidden md:flex gap-4 items-center">
                    {token ? (
                        <>
                            {!isDashboard && (
                                <Link to="/dashboard" className="px-8 py-2.5 font-orbitron text-[11px] font-bold tracking-widest bg-cyberNeon text-black rounded-lg hover:bg-white transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                                    OPEN HUB
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="p-2.5 text-gray-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20 rounded-lg"
                                title="Terminate Session"
                            >
                                <LogOut size={20} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="px-6 py-2.5 font-orbitron text-[11px] font-bold tracking-widest text-gray-400 hover:text-white transition-colors">
                                AUTH
                            </Link>
                            <Link to="/register" className="px-8 py-2.5 font-orbitron text-[11px] font-bold tracking-widest bg-white text-black rounded-lg hover:bg-cyberNeon hover:text-black transition-all shadow-xl">
                                INITIALIZE
                            </Link>
                        </>
                    )}
                </div>

                <button className="md:hidden text-cyberNeon p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        className="md:hidden bg-[#050308]/95 backdrop-blur-2xl border-t border-white/5 origin-top"
                    >
                        <div className="p-10 flex flex-col gap-10">
                            {!isDashboard && NAV_LINKS.map(link => (
                                <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-orbitron font-black text-gray-300 hover:text-cyberNeon tracking-tighter transition-all">
                                    {link.name}
                                </Link>
                            ))}
                            <div className="pt-10 border-t border-white/5 flex flex-col gap-6">
                                {token ? (
                                    <>
                                        <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 text-3xl font-orbitron font-black text-cyberNeon tracking-tighter">
                                            <LayoutDashboard size={32} /> DASHBOARD
                                        </Link>
                                        <button onClick={handleLogout} className="flex items-center gap-4 text-3xl font-orbitron font-black text-red-500 tracking-tighter">
                                            <LogOut size={32} /> TERMINATE
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-orbitron font-black text-white">LOGIN</Link>
                                        <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-orbitron font-black text-cyberNeon">REGISTER</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
