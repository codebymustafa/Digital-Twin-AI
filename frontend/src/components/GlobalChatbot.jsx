import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Cpu, ChevronDown, WifiOff, Wifi, LogIn } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import io from 'socket.io-client';

const SUGGEST_LOGIN_KEYWORDS = /\b(psx|kse|stock|shares|portfolio|invest in|buy shares|mutual fund|market analysis|technical analysis|dividend|ipo)\b/i;
const HARMFUL_TOPICS = /\b(suicide|kill myself|end my life|self.?harm|cut myself|murder|how to die|want to die|going to sun|buy moon)\b/i;

const formatCap = (name) => {
    if (!name || typeof name !== 'string') return 'Friend';
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const cleanBotText = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[*_#`]/g, '')
        .replace(/^\s*[-•]\s+/gm, '')
        .replace(/\bIMPORTANT:\s*/gi, '')
        .replace(/\bNOTE:\s*/gi, '')
        .trim();
};

const LOCAL_TWIN_GREETING = "Hey! I'm your Local Twin � your AI companion available without login.\n\nI can answer general questions on any topic with accurate, sourced info. For deeper analysis, personalized advice, live PSX/investment data, and your full digital twin experience � log in or sign up!\n\nWhat's on your mind?";

const GlobalChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    const socketRef = useRef(null);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const user = (() => { try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; } })();
        const loggedIn = !!(user?.id || user?._id);
        setIsLoggedIn(loggedIn);

        if (!loggedIn) {
            setMessages([{ role: 'ai', text: LOCAL_TWIN_GREETING }]);
            return;
        }

        const userId = user.id || user._id;

        const loadHistory = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/chat/${userId}`);
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    const formatted = data.messages.map(m => ({ role: m.role === 'assistant' ? 'ai' : 'user', text: m.content }));
                    setMessages([{ role: 'ai', text: `Welcome back, ${formatCap(user?.username)}! What would you like to discuss today?` }, ...formatted]);
                } else {
                    setMessages([{ role: 'ai', text: `Hello ${formatCap(user?.username)}! I'm your AI Twin. How can I help you today?` }]);
                }
            } catch {
                setMessages([{ role: 'ai', text: `Hello ${formatCap(user?.username)}! How can I assist your thinking today?` }]);
            }
        };

        loadHistory();

        socketRef.current = io('http://localhost:5000');
        socketRef.current.on('connect', () => { setSocketConnected(true); socketRef.current.emit('join', { userId }); });
        socketRef.current.on('disconnect', () => setSocketConnected(false));
        socketRef.current.on('receive_message', (data) => {
            setMessages(prev => [...prev, { role: 'ai', text: data.message }]);
            setIsTyping(false);
            if (!isOpen) setHasUnread(true);
        });
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, []);

    useEffect(() => {
        if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }, [messages, isTyping]);

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;
        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsTyping(true);

        if (HARMFUL_TOPICS.test(userText)) {
            setMessages(prev => [...prev, { role: 'ai', text: "I care about your wellbeing. If you're going through something serious, please reach out to a trusted person or mental health professional. I'm here to help with everyday decisions and questions." }]);
            setIsTyping(false);
            return;
        }

        if (!isLoggedIn) {
            if (SUGGEST_LOGIN_KEYWORDS.test(userText)) {
                setMessages(prev => [...prev, { role: 'ai', text: "For detailed investment analysis and live PSX data, you'll get much more accurate results by logging in to your Digital Twin.\n\nQuick tip: Always diversify, never invest money you can't afford to lose, and check SECP-registered sources for Pakistan market data.\n\nLog in for full AI-powered insights!" }]);
                setIsTyping(false);
                return;
            }
            try {
                const response = await fetch('http://localhost:5000/api/ai/local', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userText, history: messages.slice(-6).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })) })
                });
                const data = await response.json();
                setMessages(prev => [...prev, { role: 'ai', text: data.response || data.reply || "I'm having trouble connecting. Please try again." }]);
                if (!isOpen) setHasUnread(true);
            } catch {
                setMessages(prev => [...prev, { role: 'ai', text: "Connection issue. Please check if the server is running." }]);
            } finally {
                setIsTyping(false);
            }
            return;
        }

        if (socketConnected) {
            const user = (() => { try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; } })();
            const moodContext = localStorage.getItem('todayMoodContext') || '';
            socketRef.current.emit('send_message', { userId: user?.id || user?._id, message: userText, mode: 'normal', moodContext });
        } else {
            try {
                const userSnapshot = (() => { try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; } })();
                const moodContext = localStorage.getItem('todayMoodContext') || '';
                const response = await fetch('http://localhost:5000/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userText, history: messages.slice(-8).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })), context: { username: userSnapshot?.username, userId: userSnapshot?.id || userSnapshot?._id, personality: userSnapshot?.personality }, moodContext })
                });
                const data = await response.json();
                setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
                if (!isOpen) setHasUnread(true);
            } catch {
                setMessages(prev => [...prev, { role: 'ai', text: "Signal lost. Recalibrating logic mirror..." }]);
            } finally {
                setIsTyping(false);
            }
        }
    };

    const toggleChat = () => { setIsOpen(!isOpen); if (!isOpen) setHasUnread(false); };

    return (
        <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="mb-4 w-[350px] sm:w-[400px] h-[560px] bg-[#0a050d] border border-cyberNeon/40 rounded-3xl shadow-[0_0_50px_rgba(255,90,0,0.3)] flex flex-col overflow-hidden">
                        <div className="bg-cyberDark/80 p-4 border-b border-cyberNeon/20 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyberNeon to-cyberPink flex items-center justify-center animate-pulse shadow-[0_0_10px_#ff5a00]"><Cpu size={16} className="text-white" /></div>
                                <div>
                                    <h3 className="text-white font-orbitron font-bold text-sm tracking-widest">{isLoggedIn ? 'TWIN // ALPHA' : 'LOCAL TWIN'}</h3>
                                    <p className={`text-[10px] font-mono uppercase flex items-center gap-1 ${isLoggedIn ? (socketConnected ? 'text-cyberNeon' : 'text-yellow-500') : 'text-gray-400'}`}>
                                        {isLoggedIn ? (socketConnected ? <><Wifi size={10} /> Neural Sync Active</> : <><WifiOff size={10} /> HTTP Mode</>) : <><WifiOff size={10} /> Guest Mode � No Login Required</>}
                                    </p>
                                </div>
                            </div>
                            <button onClick={toggleChat} className="text-gray-400 hover:text-white transition-colors"><ChevronDown size={20} /></button>
                        </div>

                        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth">
                            {messages.map((msg, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] font-inter leading-relaxed whitespace-pre-wrap shadow-md ${msg.role === 'user' ? 'bg-cyan-500/20 text-white border border-cyan-400/30 rounded-tr-sm' : 'bg-[#140e24] text-gray-100 border border-white/10 rounded-tl-sm'}`}>{msg.text}</div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-[#181024] border border-cyberPink/30 p-3 rounded-2xl rounded-bl-none flex gap-1 w-max items-center h-10">
                                        {[0, 0.2, 0.4].map((d, i) => <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, delay: d }} className="w-1.5 h-1.5 rounded-full bg-cyberNeon" />)}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {!isLoggedIn && (
                            <div className="px-4 py-2 bg-[#0f0a1a] border-t border-white/5 flex items-center justify-between text-[11px]">
                                <span className="text-gray-500 font-mono">Want personalized AI insights?</span>
                                <Link to="/login" className="text-cyberNeon font-orbitron font-bold hover:text-white transition-colors flex items-center gap-1"><LogIn size={11} /> Log in</Link>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-3 bg-[#0a050d] border-t border-cyberNeon/20 flex gap-2">
                            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isLoggedIn ? "Ask your twin anything..." : "Ask anything � no login needed..."} className="flex-1 bg-[#120b18] border border-cyberBlue/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyberNeon transition-colors font-inter text-sm" />
                            <button type="submit" disabled={isTyping} className="bg-cyberNeon text-[#050308] p-2 rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,90,0,0.4)]"><Send size={18} /></button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button onClick={toggleChat} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={`relative w-16 h-16 rounded-full flex justify-center items-center cursor-pointer transition-all shadow-[0_0_30px_rgba(255,90,0,0.8)] border border-cyberNeon/50 ${isOpen ? 'bg-cyberDark' : 'bg-gradient-to-r from-cyberNeon to-cyberPink'}`}>
                {isOpen ? <X size={30} className="text-white" /> : <MessageCircle size={30} className="text-white drop-shadow-md" />}
                {!isOpen && hasUnread && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-cyberBg shadow-[0_0_10px_red]" />}
                {!isOpen && <div className="absolute inset-0 rounded-full border border-cyberNeon animate-ping opacity-50 pointer-events-none"></div>}
            </motion.button>
        </div>
    );
};

export default GlobalChatbot;
