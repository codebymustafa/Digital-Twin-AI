import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, Bell, BellOff, ChevronDown, Shield, AlertTriangle, Headphones, Send, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api/admin/broadcasts';

const PRIORITY_CONFIG = {
    info:     { color: '#00e5ff',  bg: '#00e5ff15', border: '#00e5ff40', Icon: Megaphone, label: 'Announcement' },
    warning:  { color: '#f59e0b',  bg: '#f59e0b15', border: '#f59e0b40', Icon: AlertTriangle, label: 'Warning' },
    critical: { color: '#ff4444',  bg: '#ff444415', border: '#ff444440', Icon: Shield, label: 'Critical' },
};

export default function BroadcastNotifier() {
    const [broadcasts, setBroadcasts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [contactType, setContactType] = useState('help');
    const [contactMessage, setContactMessage] = useState('');
    const [contactStatus, setContactStatus] = useState(null);
    const [newPopup, setNewPopup] = useState(null);
    const [dismissed, setDismissed] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]'); } catch { return []; }
    });
    const [lastReadTime, setLastReadTime] = useState(() => {
        try { return parseInt(localStorage.getItem('last_read_announcements_time') || '0'); } catch { return 0; }
    });
    const socketRef = useRef(null);
    const popupTimer = useRef(null);

    useEffect(() => {
        const fetchBroadcasts = async () => {
            try {
                const res = await fetch(API_URL);
                if (res.ok) {
                    const data = await res.json();
                    setBroadcasts(data);
                    const unread = data.filter(b => !dismissed.includes(b._id || b.id) && new Date(b.createdAt).getTime() > lastReadTime).length;
                    setUnreadCount(unread);
                }
            } catch { /* server offline, skip */ }
        };
        fetchBroadcasts();
    }, []);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

        socketRef.current.on('broadcast_message', (msg) => {
            setBroadcasts(prev => [msg, ...prev]);
            setUnreadCount(prev => prev + 1);
            setNewPopup(msg);
            clearTimeout(popupTimer.current);
            popupTimer.current = setTimeout(() => setNewPopup(null), 8000);
        });

        return () => {
            socketRef.current?.disconnect();
            clearTimeout(popupTimer.current);
        };
    }, []);

    const dismissPopup = () => {
        setNewPopup(null);
        clearTimeout(popupTimer.current);
    };

    const markAllRead = () => {
        const now = Date.now();
        setLastReadTime(now);
        localStorage.setItem('last_read_announcements_time', now.toString());
        setUnreadCount(0);
    };

    const dismissOne = (id) => {
        const updated = [...dismissed, id];
        setDismissed(updated);
        localStorage.setItem('dismissed_broadcasts', JSON.stringify(updated));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString();
    };

    const visibleBroadcasts = broadcasts.filter(b => !dismissed.includes(b._id || b.id));

    const handleSendContact = async (e) => {
        e.preventDefault();
        if (!contactMessage.trim()) return;
        setContactStatus('sending');
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type: contactType, message: contactMessage.trim() })
            });

            if (res.ok) {
                setContactStatus('success');
                setContactMessage('');
                setTimeout(() => {
                    setContactStatus(null);
                    setIsContactOpen(false);
                }, 2000);
            } else {
                setContactStatus('error');
            }
        } catch {
            setContactStatus('error');
        }
    };

    return (
        <>
            <AnimatePresence>
                {newPopup && (
                    <motion.div
                        key="popup"
                        initial={{ x: 120, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 120, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-20 right-5 z-[200] max-w-sm w-full"
                    >
                        {(() => {
                            const cfg = PRIORITY_CONFIG[newPopup.priority] || PRIORITY_CONFIG.info;
                            return (
                                <div
                                    className="rounded-2xl p-5 shadow-2xl border backdrop-blur-xl"
                                    style={{ background: cfg.bg, borderColor: cfg.border }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <cfg.Icon size={18} style={{ color: cfg.color }} />
                                            <span className="font-orbitron text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                                                {cfg.label} from Admin
                                            </span>
                                        </div>
                                        <button onClick={dismissPopup} className="text-gray-500 hover:text-white transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <p className="text-white text-sm font-inter leading-relaxed">{newPopup.message}</p>
                                    <p className="text-gray-500 text-[10px] font-mono mt-2">
                                        Sent by {newPopup.sentBy || 'Admin'} · {formatTime(newPopup.createdAt)}
                                    </p>
                                    <motion.div
                                        className="mt-3 h-0.5 rounded-full"
                                        initial={{ scaleX: 1 }}
                                        animate={{ scaleX: 0 }}
                                        transition={{ duration: 8, ease: 'linear' }}
                                        style={{ transformOrigin: 'left', backgroundColor: cfg.color }}
                                    />
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-3">

                <AnimatePresence>
                    {isContactOpen && (
                        <motion.div
                            key="contact-panel"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="w-80 flex flex-col rounded-2xl border border-[#00e5ff]/30 bg-[#0a050d]/95 backdrop-blur-xl shadow-2xl overflow-hidden p-4"
                        >
                            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                                <div className="flex items-center gap-2">
                                    <Headphones size={16} className="text-[#00e5ff]" />
                                    <span className="font-orbitron text-xs font-bold text-white tracking-wider">CONTACT ADMIN</span>
                                </div>
                                <button onClick={() => setIsContactOpen(false)} className="text-gray-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            {contactStatus === 'success' ? (
                                <div className="py-8 text-center text-green-400 font-mono text-xs flex flex-col items-center gap-2">
                                    <CheckCircle2 size={32} className="text-green-400 animate-bounce" />
                                    <span>Message dispatched to Admin!</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSendContact} className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1">Request Type</label>
                                        <select
                                            value={contactType}
                                            onChange={e => setContactType(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-inter outline-none focus:border-[#00e5ff]"
                                        >
                                            <option value="help" className="bg-[#0a050d]">🆘 Help / Support</option>
                                            <option value="issue" className="bg-[#0a050d]">⚠️ Bug / Issue</option>
                                            <option value="feedback" className="bg-[#0a050d]">💬 General Feedback</option>
                                            <option value="update request" className="bg-[#0a050d]">🔄 Update Request</option>
                                            <option value="feature request" className="bg-[#0a050d]">✨ Feature Request</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1">Your Message</label>
                                        <textarea
                                            rows={4}
                                            value={contactMessage}
                                            onChange={e => setContactMessage(e.target.value)}
                                            placeholder="Describe your request or issue here..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-inter resize-none outline-none focus:border-[#00e5ff] placeholder:text-gray-600"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={contactStatus === 'sending'}
                                        className="w-full py-2.5 bg-[#00e5ff] hover:bg-white text-black font-orbitron font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <Send size={13} /> {contactStatus === 'sending' ? 'TRANSMITTING...' : 'SEND TO ADMIN'}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            key="panel"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="w-80 max-h-[420px] flex flex-col rounded-2xl border border-white/10 bg-[#0a050d]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <Megaphone size={15} className="text-cyberPink" />
                                    <span className="font-orbitron text-xs font-bold text-white tracking-wider">ANNOUNCEMENTS</span>
                                    {unreadCount > 0 && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyberPink text-white font-bold">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {visibleBroadcasts.length > 0 && (
                                        <button onClick={markAllRead} className="text-[9px] font-mono text-gray-500 hover:text-cyberNeon transition-colors">
                                            Mark all read
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {visibleBroadcasts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                                        <BellOff size={28} className="text-gray-600 mb-2" />
                                        <p className="text-gray-600 text-xs font-mono">No active announcements</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1 p-2">
                                        {visibleBroadcasts.map((b) => {
                                            const id = b._id || b.id;
                                            const cfg = PRIORITY_CONFIG[b.priority] || PRIORITY_CONFIG.info;
                                            return (
                                                <motion.div
                                                    key={id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="p-3 rounded-xl border relative group"
                                                    style={{ background: cfg.bg, borderColor: cfg.border }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <cfg.Icon size={12} style={{ color: cfg.color }} />
                                                            <span className="text-[9px] font-mono uppercase font-bold" style={{ color: cfg.color }}>
                                                                {cfg.label}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => dismissOne(id)}
                                                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 transition-all"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                    <p className="text-white text-xs font-inter leading-relaxed">{b.message}</p>
                                                    <p className="text-gray-600 text-[9px] font-mono mt-1">
                                                        {b.sentBy || 'Admin'} · {formatTime(b.createdAt)}
                                                    </p>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setIsOpen(false);
                        setIsContactOpen(p => !p);
                    }}
                    title="Contact Admin"
                    className="relative w-14 h-14 rounded-2xl bg-[#0a050d] border border-[#00e5ff]/30 flex items-center justify-center shadow-xl hover:border-[#00e5ff] transition-all"
                >
                    <Headphones size={22} className="text-[#00e5ff]" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { 
                        setIsContactOpen(false);
                        if (!isOpen) markAllRead();
                        setIsOpen(p => !p); 
                    }}
                    title="Announcements"
                    className="relative w-14 h-14 rounded-2xl bg-[#0a050d] border border-cyberPink/30 flex items-center justify-center shadow-xl hover:border-cyberPink transition-all"
                >
                    <Bell size={22} className="text-cyberPink" />
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyberPink text-white text-[9px] font-bold font-mono flex items-center justify-center"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </motion.button>
            </div>
        </>
    );
}
