import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Calendar, TrendingUp, Award } from 'lucide-react';

const StreakWidget = () => {
    const [streak, setStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [streakHistory, setStreakHistory] = useState([]);
    const [showCelebration, setShowCelebration] = useState(false);

    const syncStreakState = () => {
        let user = null;
        try { user = JSON.parse(sessionStorage.getItem('user')); } catch { user = null; }

        const currentStreak = user?.currentStreak !== undefined
            ? user.currentStreak
            : parseInt(localStorage.getItem('currentStreak') || '0');

        const longest = user?.longestStreak !== undefined
            ? user.longestStreak
            : parseInt(localStorage.getItem('longestStreak') || '0');

        const history = JSON.parse(localStorage.getItem('streakHistory') || '[]');
        const today = new Date().toDateString();
        const newHistory = [today, ...history.filter(d => d !== today)].slice(0, 30);
        localStorage.setItem('streakHistory', JSON.stringify(newHistory));

        setStreak(currentStreak);
        setLongestStreak(Math.max(longest, currentStreak));
        setStreakHistory(newHistory);
    };

    useEffect(() => {
        syncStreakState();
        window.addEventListener('twin-data-updated', syncStreakState);
        return () => window.removeEventListener('twin-data-updated', syncStreakState);
    }, []);

    const getStreakLevel = () => {
        if (streak >= 30) return { label: 'LEGENDARY', color: '#ffd700', icon: '👑' };
        if (streak >= 14) return { label: 'ON FIRE', color: '#ff5a00', icon: '🔥' };
        if (streak >= 7) return { label: 'CONSISTENT', color: '#00e5ff', icon: '⚡' };
        if (streak >= 3) return { label: 'BUILDING', color: '#a200ff', icon: '🚀' };
        return { label: 'STARTING', color: '#9ca3af', icon: '🌱' };
    };

    const level = getStreakLevel();

    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000).toDateString();
        return { date: d, active: streakHistory.includes(d), label: new Date(d).toLocaleDateString('en', { weekday: 'short' }) };
    });

    const MILESTONES = [3, 7, 14, 30, 60, 100];

    return (
        <div className="glass-panel rounded-2xl border border-[#ff5a00]/20 overflow-hidden relative">
            <AnimatePresence>
                {showCelebration && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 rounded-2xl">
                        <div className="text-center">
                            <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: 3, duration: 0.5 }}
                                className="text-6xl mb-3">🏆</motion.div>
                            <p className="font-orbitron text-xl text-[#ffd700] font-black">New Record!</p>
                            <p className="text-gray-400 text-sm mt-1">Longest streak: {longestStreak} days!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-5">
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h3 className="font-orbitron text-white font-bold flex items-center gap-2 mb-1">
                            <Flame size={18} style={{ color: level.color }} /> Daily Streak
                        </h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: level.color, backgroundColor: `${level.color}20` }}>
                            {level.icon} {level.label}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-black font-orbitron" style={{ color: level.color, textShadow: `0 0 20px ${level.color}` }}>
                            {streak}
                        </div>
                        <div className="text-gray-500 text-xs font-mono">days in a row</div>
                    </div>
                </div>

                <div className="flex gap-1 mb-5">
                    {last7.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`w-full h-8 rounded-lg transition-all ${day.active ? 'shadow-lg' : 'bg-[#120b18]'}`}
                                style={day.active ? { backgroundColor: `${level.color}40`, border: `1px solid ${level.color}60` } : {}} />
                            <span className="text-gray-600 font-mono" style={{ fontSize: '9px' }}>{day.label}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[#120b18] rounded-xl p-3 text-center">
                        <Trophy size={16} className="text-[#ffd700] mx-auto mb-1" />
                        <div className="text-white font-orbitron font-bold">{longestStreak}</div>
                        <div className="text-gray-500 font-mono text-xs">Best Streak</div>
                    </div>
                    <div className="bg-[#120b18] rounded-xl p-3 text-center">
                        <Calendar size={16} className="text-[#00e5ff] mx-auto mb-1" />
                        <div className="text-white font-orbitron font-bold">{streakHistory.length}</div>
                        <div className="text-gray-500 font-mono text-xs">Total Days</div>
                    </div>
                </div>

                <div>
                    <p className="text-gray-500 text-xs font-mono mb-3">MILESTONES</p>
                    <div className="flex gap-2 flex-wrap">
                        {MILESTONES.map(m => (
                            <div key={m} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono transition-all ${streak >= m ? 'bg-[#ffd700]/15 border-[#ffd700]/40 text-[#ffd700]' : 'border-white/10 text-gray-600'}`}>
                                {streak >= m ? '✅' : '🔒'} {m} days
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StreakWidget;
