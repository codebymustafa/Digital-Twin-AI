import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Zap, MessageSquare, BrainCircuit, Mic, Lock, Send,
    Target, TrendingUp, TrendingDown, CheckCircle, XCircle,
    Clock, Shield, User, BarChart3, Heart, AlertTriangle,
    Star, Lightbulb, Award, Coffee, Moon, Sun, LogOut,
    ChevronRight, Play, RotateCcw, BookOpen, Cpu, GitFork, Wind, ShieldCheck, Coins
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadarChart,
    PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { useNavigate } from 'react-router-dom';

import MoodCheckin from '../components/MoodCheckin';
import GoalTracker from '../components/GoalTracker';
import DecisionJournal from '../components/DecisionJournal';
import ProfileManager from '../components/ProfileManager';
import StreakWidget from '../components/StreakWidget';
import OverthinkinShield from '../components/OverthinkinShield';
import CompareWithPast from '../components/CompareWithPast';
import WeeklyReportCard from '../components/WeeklyReportCard';
import { DashboardSkeleton } from '../components/Skeleton';
import TwinPersonality from '../components/TwinPersonality';
import ScenarioSimulator from '../components/ScenarioSimulator';
import FocusMode from '../components/FocusMode';
import AdminHub from '../components/AdminHub';
import BroadcastNotifier from '../components/BroadcastNotifier';

const getDashboardData = () => {
    const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
    const decisions = JSON.parse(localStorage.getItem('decisionJournal') || '[]');
    const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
    const streak = parseInt(localStorage.getItem('currentStreak') || '0');
    
    const completedGoals = goals.filter(g => g.completed).length;
    const goodDecisions = decisions.filter(d => d.rating.score >= 4).length;
    const stressAlerts = decisions.filter(d => d.rating.label === 'Risky Move').length;
    
    const logicScore = decisions.length > 0 
        ? Math.round((decisions.reduce((s, d) => s + d.rating.score, 0) / (decisions.length * 5)) * 100)
        : 0;

    return {
        goalsDone: `${completedGoals}/${goals.length}`,
        goodDecisions: String(goodDecisions),
        stressAlerts: String(stressAlerts),
        logicScore: `${logicScore}%`,
        streak,
        decisions: decisions.slice(0, 5),
        hasData: decisions.length > 0 || goals.length > 0 || moodHistory.length > 0
    };
};

const getWeeklyRiskData = () => {
    const decisions = JSON.parse(localStorage.getItem('decisionJournal') || '[]');
    const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
    const defaultLogic = [65, 75, 80, 70, 85, 90, 75];
    const defaultStress = [35, 45, 30, 50, 40, 25, 30];

    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateString = d.toDateString();

        const dayDecisions = decisions.filter(dec => dec.date === dateString);
        const dayMoods = moodHistory.filter(m => m.date === dateString);

        let logic = defaultLogic[6 - i];
        let stress = defaultStress[6 - i];

        if (dayDecisions.length > 0 || dayMoods.length > 0) {
            let logicTotal = 0;
            let logicCount = 0;
            let stressTotal = 0;
            let stressCount = 0;

            dayDecisions.forEach(dec => {
                logicTotal += (dec.rating?.score || 3) * 20;
                logicCount++;
                if (dec.emotion === 'anxious' || dec.emotion === 'angry') {
                    stressTotal += 80;
                    stressCount++;
                } else if (dec.emotion === 'confused') {
                    stressTotal += 60;
                    stressCount++;
                } else {
                    stressTotal += 20;
                    stressCount++;
                }
            });

            dayMoods.forEach(m => {
                const moodId = m.mood?.id;
                if (moodId === 'great') { logicTotal += 95; logicCount++; stressTotal += 10; stressCount++; }
                else if (moodId === 'good') { logicTotal += 80; logicCount++; stressTotal += 25; stressCount++; }
                else if (moodId === 'okay') { logicTotal += 60; logicCount++; stressTotal += 45; stressCount++; }
                else if (moodId === 'stressed') { logicTotal += 40; logicCount++; stressTotal += 85; stressCount++; }
                else if (moodId === 'bad') { logicTotal += 30; logicCount++; stressTotal += 75; stressCount++; }
            });

            if (logicCount > 0) logic = Math.round(logicTotal / logicCount);
            if (stressCount > 0) stress = Math.round(stressTotal / stressCount);
        }

        result.push({ day: dayLabel, logic, stress });
    }
    return result;
};

const getDecisionHistoryData = () => {
    const decisions = JSON.parse(localStorage.getItem('decisionJournal') || '[]');
    const defaultHistory = [
        { week: 'W4', good: 2, bad: 1 },
        { week: 'W3', good: 3, bad: 0 },
        { week: 'W2', good: 1, bad: 2 },
        { week: 'W1', good: 4, bad: 1 },
    ];

    if (decisions.length === 0) return defaultHistory;

    const result = [
        { week: 'W4', good: 0, bad: 0 },
        { week: 'W3', good: 0, bad: 0 },
        { week: 'W2', good: 0, bad: 0 },
        { week: 'W1', good: 0, bad: 0 },
    ];

    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    decisions.forEach(d => {
        const itemTime = d.id || Date.parse(d.date);
        if (isNaN(itemTime)) return;
        const diffWeeks = Math.floor((now - itemTime) / oneWeekMs);
        
        let targetIndex = -1;
        if (diffWeeks === 0) targetIndex = 3;
        else if (diffWeeks === 1) targetIndex = 2;
        else if (diffWeeks === 2) targetIndex = 1;
        else if (diffWeeks >= 3) targetIndex = 0;

        if (targetIndex !== -1) {
            const isGood = (d.rating?.score || 3) >= 4;
            if (isGood) {
                result[targetIndex].good += 1;
            } else {
                result[targetIndex].bad += 1;
            }
        }
    });

    const totalCount = result.reduce((sum, item) => sum + item.good + item.bad, 0);
    if (totalCount === 0) return defaultHistory;

    return result;
};

const getPersonalityData = () => {
    const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
    const decisions = JSON.parse(localStorage.getItem('decisionJournal') || '[]');
    const userSnapshot = JSON.parse(localStorage.getItem('user') || '{}');
    
    const completedGoals = goals.filter(g => g.completed).length;
    
    const ambition = Math.min(100, Math.max(40, 50 + (goals.length * 8)));
    const logicScore = decisions.length > 0 
        ? Math.round((decisions.reduce((s, d) => s + (d.rating?.score || 3), 0) / (decisions.length * 5)) * 100)
        : 70;

    const emotionalDecisions = decisions.filter(d => d.emotion === 'anxious' || d.emotion === 'angry').length;
    const patience = Math.max(20, 80 - (emotionalDecisions * 15));
    const goodDecisions = decisions.filter(d => (d.rating?.score || 3) >= 4).length;
    const confidence = Math.min(100, 60 + (completedGoals * 10) + (goodDecisions * 5));

    const relationGoals = goals.filter(g => g.category === 'Relationships').length;
    const relationDecisions = decisions.filter(d => d.type === 'Relationships' || d.type === 'Social').length;
    const empathy = Math.min(100, 50 + (relationGoals * 15) + (relationDecisions * 10));

    const streak = parseInt(localStorage.getItem('currentStreak') || '0');
    const resilience = Math.min(100, 55 + (streak * 5));

    return [
        { subject: 'Confidence', value: confidence },
        { subject: 'Patience', value: patience },
        { subject: 'Logic', value: logicScore },
        { subject: 'Empathy', value: empathy },
        { subject: 'Ambition', value: ambition },
        { subject: 'Resilience', value: resilience },
    ];
};

const TiltCard = ({ children, className = '' }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const ref = React.useRef(null);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setRotateX(((e.clientY - rect.top) / rect.height - 0.5) * -10);
        setRotateY(((e.clientX - rect.left) / rect.width - 0.5) * 10);
    };

    return (
        <motion.div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
            animate={{ rotateX, rotateY }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ perspective: 1000 }} className={className}>
            <div style={{ transformStyle: 'preserve-3d' }} className="w-full h-full">{children}</div>
        </motion.div>
    );
};

const ChatView = ({ onBack }) => {
    const cleanText = (str) => {
        if (!str || typeof str !== 'string') return '';
        let cleaned = str.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        cleaned = cleaned.replace(/[*_#`]/g, '');
        cleaned = cleaned.replace(/^\s*[-â€¢]\s+/gm, '');
        cleaned = cleaned.replace(/\bIMPORTANT:\s*/gi, '');
        cleaned = cleaned.replace(/\bNOTE:\s*/gi, '');
        return cleaned.trim();
    };

    const [messages, setMessages] = useState([
        { 
            role: 'ai', 
            text: "Hello. I am your Digital Twin. I think through your challenges with calm, clear logic. How can I help you analyze your decisions today?",
            time: 'Now'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const containerRef = React.useRef(null);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;
        
        const userText = input.trim();
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userSnapshot = (() => { try { return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user')); } catch { return null; } })();
        const savedSettings = (() => { try { return JSON.parse(localStorage.getItem('twinSettings') || '{}'); } catch { return {}; } })();

        const context = {
            username: userSnapshot?.username,
            role: userSnapshot?.role,
            userId: userSnapshot?.id || userSnapshot?._id,
            personality: userSnapshot?.personality,
            ambition: savedSettings.ambitionScale || 90,
            logicBias: savedSettings.logicWeight || 85,
            twinVoice: savedSettings.twinVoice || 'Analyst'
        };
        const moodContext = localStorage.getItem('todayMoodContext') || '';

        setMessages(prev => [...prev, { role: 'user', text: userText, time: nowTime }]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userText, 
                    history: messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
                    context,
                    moodContext
                })
            });
            const data = await response.json();
            const cleanedReply = cleanText(data.response || "I processed your thoughts. Focus on immediate logical steps and measured execution.");
            setMessages(prev => [...prev, { role: 'ai', text: cleanedReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
            setIsTyping(false);

            const chatToken = sessionStorage.getItem('token');
            if (chatToken) {
                try {
                    const rewardRes = await fetch('http://localhost:5000/api/auth/reward', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${chatToken}` },
                        body: JSON.stringify({ action: 'chat_interaction' })
                    });
                    if (rewardRes.ok) {
                        const rewardData = await rewardRes.json();
                        if (rewardData.user) {
                            sessionStorage.setItem('user', JSON.stringify(rewardData.user));
                            window.dispatchEvent(new Event('twin-data-updated'));
                        }
                    }
                } catch { /* silent */ }
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'ai', text: "Connection was momentarily interrupted. Please ask again in a moment.", time: nowTime }]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col h-full relative z-10 bg-[#07050d] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="px-5 py-3.5 border-b border-white/10 flex justify-between items-center bg-[#0d0917]/90 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-500 p-[1.5px] flex items-center justify-center">
                        <div className="w-full h-full bg-[#0d0917] rounded-full flex items-center justify-center">
                            <Cpu size={15} className="text-cyan-400" />
                        </div>
                    </div>
                    <div>
                        <span className="font-orbitron font-bold text-white text-xs md:text-sm tracking-wide">Twin Conversation</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <p className="text-gray-400 text-[11px] font-inter">Live Logical Sync</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onBack} 
                    className="text-gray-400 hover:text-white text-xs font-inter bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-colors cursor-pointer"
                >
                    Close Chat
                </button>
            </div>

            <div ref={containerRef} className="flex-1 p-5 md:p-6 overflow-y-auto space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 8 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] md:max-w-[78%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`p-4 rounded-2xl text-xs md:text-sm font-inter leading-relaxed ${
                                msg.role === 'user'
                                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-white border border-cyan-400/30 rounded-tr-sm shadow-[0_4px_20px_rgba(0,229,255,0.08)]'
                                : 'bg-[#130d22]/90 text-gray-100 border border-white/10 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                            }`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            {msg.time && (
                                <span className="text-[10px] text-gray-500 font-mono mt-1 px-1">
                                    {msg.time}
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-[#130d22] border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                            {[0, 0.15, 0.3].map((d, i) => (
                                <motion.div 
                                    key={i} 
                                    animate={{ y: [0, -4, 0] }} 
                                    transition={{ repeat: Infinity, duration: 0.8, delay: d }}
                                    className="w-1.5 h-1.5 rounded-full bg-cyan-400" 
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            <form onSubmit={handleSend} className="p-3.5 border-t border-white/10 bg-[#0d0917]/90 flex gap-2.5 items-center">
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question or dilemma..."
                    className="flex-1 bg-[#150f24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400/60 transition-colors font-inter text-xs md:text-sm"
                />
                <button 
                    type="submit" 
                    disabled={isTyping || !input.trim()}
                    className="bg-cyan-400 text-black px-4 md:px-5 py-3 rounded-xl hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};

const ScenarioView = ({ onBack }) => {
    const [selected, setSelected] = useState(null);
    const scenarios = [
        { id: 1, question: "Should I quit my job and start my own business?", optionA: { label: "Quit Now", desc: "You leave immediately and focus 100% on your startup. High risk, but you're fully committed.", prob: 72, risk: "HIGH" }, optionB: { label: "Stay & Build First", desc: "You keep your job while building your startup on weekends. Slower but safer.", prob: 91, risk: "LOW" } },
        { id: 2, question: "Should I move to a new city for a better opportunity?", optionA: { label: "Move Now", desc: "Take the leap. New city, new network, new possibilities. Scary but exciting.", prob: 68, risk: "MEDIUM" }, optionB: { label: "Stay for 6 More Months", desc: "Save more money, research thoroughly, then move with better preparation.", prob: 85, risk: "LOW" } },
        { id: 3, question: "Should I go back to university for a higher degree?", optionA: { label: "Enroll This Year", desc: "Immediate investment in your education. 2-4 years of study, long-term career benefits.", prob: 80, risk: "MEDIUM" }, optionB: { label: "Work First", desc: "Gain 2-3 years of industry experience, then decide with more practical knowledge.", prob: 78, risk: "LOW" } },
    ];

    return (
        <div className="flex flex-col h-full relative z-10 overflow-y-auto custom-scrollbar rounded-3xl">
            <div className="p-6 border-b border-cyberPink/20 flex justify-between items-center bg-[#0a050d] rounded-t-3xl">
                <div>
                    <h2 className="font-orbitron text-xl text-cyberPink font-bold">Life Scenario Simulator</h2>
                    <p className="text-gray-400 text-sm mt-1">Pick a scenario and see which path is smarter for you.</p>
                </div>
                <button onClick={onBack} className="text-gray-500 hover:text-white text-sm font-mono bg-[#120b18] px-3 py-1 rounded-lg border border-white/10">â† Go Back</button>
            </div>
            <div className="p-6 space-y-6">
                {scenarios.map((scenario) => (
                    <div key={scenario.id} className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                        <button className="w-full p-5 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
                            onClick={() => setSelected(selected === scenario.id ? null : scenario.id)}>
                            <span className="text-white font-inter font-semibold">{scenario.question}</span>
                            <ChevronRight size={18} className={`text-cyberPink transition-transform ${selected === scenario.id ? 'rotate-90' : ''}`} />
                        </button>
                        {selected === scenario.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[
                                    { ...scenario.optionA, color: '#00e5ff', side: 'A' },
                                    { ...scenario.optionB, color: '#a200ff', side: 'B' },
                                ].map((opt) => (
                                    <div key={opt.side} className="rounded-2xl p-5 border" style={{ borderColor: `${opt.color}40`, background: `${opt.color}08` }}>
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-orbitron font-bold" style={{ color: opt.color }}>Option {opt.side}: {opt.label}</h3>
                                            <span className={`text-xs font-mono px-2 py-1 rounded ${opt.risk === 'HIGH' ? 'bg-red-500/20 text-red-400' : opt.risk === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{opt.risk} RISK</span>
                                        </div>
                                        <p className="text-gray-400 text-sm font-inter leading-relaxed mb-4">{opt.desc}</p>
                                        <div className="mb-2">
                                            <div className="flex justify-between text-xs font-mono mb-1">
                                                <span className="text-gray-500">Success Chance</span>
                                                <span style={{ color: opt.color }}>{opt.prob}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-[#120b18] rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${opt.prob}%` }} transition={{ duration: 1 }}
                                                    className="h-full rounded-full" style={{ backgroundColor: opt.color, boxShadow: `0 0 8px ${opt.color}` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const formatCapitalName = (name) => {
    if (!name || typeof name !== 'string') return 'User';
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const Dashboard = () => {
    const [view, setView] = useState('hub');
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; }
    });

    const [data, setData] = useState(() => getDashboardData());
    const [showMoodCheckin, setShowMoodCheckin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('status');
    const [showFocus, setShowFocus] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const handleRefresh = () => {
            try {
                setUser(JSON.parse(sessionStorage.getItem('user')));
            } catch {
                setUser(null);
            }
        };
        window.addEventListener('storage', handleRefresh);
        window.addEventListener('twin-data-updated', handleRefresh);
        return () => {
            window.removeEventListener('storage', handleRefresh);
            window.removeEventListener('twin-data-updated', handleRefresh);
        };
    }, []);

    const currentWeeklyRiskData = getWeeklyRiskData();
    const currentDecisionHistoryData = getDecisionHistoryData();
    const currentPersonalityData = getPersonalityData();

    const logicVal = currentPersonalityData.find(p => p.subject === 'Logic')?.value || 70;
    const ambitionVal = currentPersonalityData.find(p => p.subject === 'Ambition')?.value || 70;
    const patienceVal = currentPersonalityData.find(p => p.subject === 'Patience')?.value || 70;
    const empathyVal = currentPersonalityData.find(p => p.subject === 'Empathy')?.value || 70;
    const riskComfortVal = user?.personality?.riskTaking || 50;
    const innerFocusVal = 100 - (user?.personality?.introvertExtrovert || 50);

    const getBarDescription = (label, val) => {
        if (label === 'Logic') {
            if (val >= 80) return 'Very logical thinker';
            if (val >= 60) return 'Balanced thinker';
            return 'More intuitive thinker';
        }
        if (label === 'Ambition') {
            if (val >= 80) return 'Highly ambitious';
            if (val >= 60) return 'Goal-oriented';
            return 'Calm pace';
        }
        if (label === 'Patience') {
            if (val >= 70) return 'Highly patient';
            if (val >= 50) return 'Steady';
            return 'Needs improvement';
        }
        if (label === 'Empathy') {
            if (val >= 70) return 'Highly empathetic';
            if (val >= 50) return 'Average for your type';
            return 'Objective';
        }
        if (label === 'Risk') {
            if (val >= 70) return 'Very bold';
            if (val >= 40) return 'Prefers balanced options';
            return 'Prefers safe choices';
        }
        if (label === 'Introvert') {
            if (val >= 70) return 'Mostly introverted';
            if (val >= 40) return 'Balanced/ambivert';
            return 'Mostly extroverted';
        }
        return '';
    };

    const personalityBreakdown = [
        { label: 'How Logical You Are', value: logicVal, color: '#00e5ff', desc: getBarDescription('Logic', logicVal) },
        { label: 'How Ambitious You Are', value: ambitionVal, color: '#ff5a00', desc: getBarDescription('Ambition', ambitionVal) },
        { label: 'How Patient You Are', value: patienceVal, color: '#a200ff', desc: getBarDescription('Patience', patienceVal) },
        { label: 'How Empathetic You Are', value: empathyVal, color: '#00e5ff', desc: getBarDescription('Empathy', empathyVal) },
        { label: 'Risk Comfort Level', value: riskComfortVal, color: '#ff5a00', desc: getBarDescription('Risk', riskComfortVal) },
        { label: 'Inner Focus (Introvert)', value: innerFocusVal, color: '#a200ff', desc: getBarDescription('Introvert', innerFocusVal) },
    ];

    const handleUpdate = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        const updatedData = getDashboardData();
        setData(updatedData);
    }, [refreshKey]);

    useEffect(() => {
        const syncBackendData = async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) return;
                const res = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const userData = await res.json();
                    if (userData.userGoals) localStorage.setItem('userGoals', JSON.stringify(userData.userGoals));
                    if (userData.decisionJournal) localStorage.setItem('decisionJournal', JSON.stringify(userData.decisionJournal));
                    if (userData.moodHistory) localStorage.setItem('moodHistory', JSON.stringify(userData.moodHistory));
                    if (userData.currentStreak !== undefined) localStorage.setItem('currentStreak', String(userData.currentStreak));
                    if (userData.lastCheckinDate) {
                        localStorage.setItem('lastCheckin', userData.lastCheckinDate);
                    }
                    sessionStorage.setItem('user', JSON.stringify(userData));
                    setUser(userData);
                    setRefreshKey(prev => prev + 1);
                }
            } catch (err) {
                console.error("Error syncing database data to localStorage on mount:", err);
            }
        };

        syncBackendData();

        const loadTimer = setTimeout(() => setIsLoading(false), 1500);

        const lastCheckin = localStorage.getItem('lastCheckin');
        const today = new Date().toDateString();
        if (lastCheckin !== today) {
            const checkinTimer = setTimeout(() => setShowMoodCheckin(true), 2500);
            return () => { clearTimeout(loadTimer); clearTimeout(checkinTimer); };
        }
        return () => clearTimeout(loadTimer);
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const currentHour = new Date().getHours();
    const timeGreetings = {
        morning: ["Good morning", "Welcome back", "Hope you are having a clear morning"],
        afternoon: ["Good afternoon", "Welcome back", "Hope your day is going well"],
        evening: ["Good evening", "Welcome back", "Ready to review your day"],
        night: ["Welcome back", "Good evening", "Hope you had a productive day"]
    };
    const period = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : currentHour < 21 ? 'evening' : 'night';
    const greeting = timeGreetings[period][Math.floor(Math.random() * timeGreetings[period].length)];

    if (isLoading) return <div className="min-h-screen bg-[#050308]"><DashboardSkeleton /></div>;

    const stats = [
        { icon: CheckCircle, label: 'Good Decisions', value: data.goodDecisions, sub: 'This week', color: '#00e5ff', positive: true },
        { icon: Target, label: 'Goals Completed', value: data.goalsDone, sub: 'Overall', color: '#ff5a00', positive: true },
        { icon: AlertTriangle, label: 'Stress Alerts', value: data.stressAlerts, sub: 'Risky moves detected', color: '#a200ff', positive: false },
        { icon: Zap, label: 'Logic Score', value: data.logicScore, sub: 'Current level', color: '#00e5ff', positive: true },
    ];
    const logicPct = data.logicScore ? parseInt(data.logicScore) : 0;
    const goalsDoneNum = data.goalsDone.split('/')[0] ? parseInt(data.goalsDone.split('/')[0]) : 0;
    const goalsTotalNum = data.goalsDone.split('/')[1] ? parseInt(data.goalsDone.split('/')[1]) : 1;
    const goalProgress = goalsTotalNum > 0 ? Math.round((goalsDoneNum / goalsTotalNum) * 100) : 0;
    const streakBonus = Math.min(20, data.streak * 2);
    const moodBonusData = JSON.parse(localStorage.getItem('moodHistory') || '[]');
    const recentGoodMoods = moodBonusData.slice(0, 7).filter(m => m.mood?.id === 'great' || m.mood?.id === 'good').length;
    const moodBonus = Math.round((recentGoodMoods / 7) * 20);
    const twinAccuracy = data.hasData
        ? Math.min(99, Math.round(logicPct * 0.4 + goalProgress * 0.3 + streakBonus * 0.5 + moodBonus * 0.5))
        : 0;

    const aiSuggestions = (() => {
        const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        const latestMood = moodHistory[0]?.mood?.id || null;
        const latestEnergy = moodHistory[0]?.answers?.energy || null;
        const latestSleep = moodHistory[0]?.answers?.sleep || null;
        const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
        const decisions = JSON.parse(localStorage.getItem('decisionJournal') || '[]');
        const stressAlertCount = parseInt(data.stressAlerts) || 0;
        const streakVal = data.streak;
        const goodDec = parseInt(data.goodDecisions) || 0;

        if (!data.hasData) {
            return [
                { icon: Zap, text: "Welcome to your Digital Twin. To start, log your first decision in the Decision Journal below â€” every choice builds your twin's intelligence.", color: '#00e5ff', type: 'TIP' },
                { icon: Target, text: "Set your first goal and watch your twin calculate the most efficient path to achieve it based on your personality.", color: '#ff5a00', type: 'SUGGESTION' },
                { icon: Activity, text: "Check in with your mood daily so I can track how emotions affect your logical thinking and help you make better decisions.", color: '#a200ff', type: 'POSITIVE' },
                { icon: BrainCircuit, text: "Ask me anything in the 'What Would My Twin Do?' box for instant logical advice on any life situation.", color: '#00e5ff', type: 'TIP' },
            ];
        }

        const suggestions = [];

        if (latestSleep && latestSleep.includes('Poorly')) {
            suggestions.push({ icon: Moon, text: `You slept poorly last night. Decision quality drops 40% when sleep-deprived. Avoid making major choices today â€” rest is your top priority right now.`, color: '#a200ff', type: 'WARNING' });
        } else {
            suggestions.push({ icon: Moon, text: `Sleep quality directly impacts your logic score by up to 40%. Aim for 7-9 hours tonight to keep your twin's sync accuracy high.`, color: '#a200ff', type: 'WARNING' });
        }

        if (logicPct >= 75) {
            suggestions.push({ icon: TrendingUp, text: `Your logic efficiency is at ${logicPct}% â€” strong performance. You're making consistently smart decisions. Keep this momentum going.`, color: '#00e5ff', type: 'POSITIVE' });
        } else if (logicPct > 0) {
            suggestions.push({ icon: TrendingUp, text: `Your logic score is ${logicPct}%. Focus on slowing down before decisions â€” even 10 minutes of reflection can raise this by 15%.`, color: '#00e5ff', type: 'POSITIVE' });
        } else {
            suggestions.push({ icon: TrendingUp, text: `Log more decisions in your journal to unlock your logic score. Each entry teaches your twin more about your thinking patterns.`, color: '#00e5ff', type: 'TIP' });
        }

        if (latestMood === 'stressed' || latestMood === 'bad') {
            suggestions.push({ icon: Coffee, text: `Your energy is lower today. I recommend tackling small, low-stakes tasks first. Save complex decisions for when your cognitive load is lighter.`, color: '#ff5a00', type: 'TIP' });
        } else if (latestMood === 'great') {
            suggestions.push({ icon: Coffee, text: `You're in a peak mental state today. Great energy for tackling that big decision or goal you've been postponing. Strike while the iron is hot.`, color: '#ff5a00', type: 'TIP' });
        } else {
            suggestions.push({ icon: Coffee, text: `Tackle your most important goal in the morning â€” your logic performance is typically highest in the first 2-3 hours after waking.`, color: '#ff5a00', type: 'TIP' });
        }

        if (stressAlertCount > 1) {
            suggestions.push({ icon: Heart, text: `${stressAlertCount} stress alerts detected this week. Social connections reduce cortisol and boost decision quality â€” plan a meaningful call with someone you trust.`, color: '#a200ff', type: 'SUGGESTION' });
        } else if (streakVal >= 3) {
            suggestions.push({ icon: Heart, text: `${streakVal}-day streak active â€” you're building powerful daily habits. Consistency is the single biggest predictor of long-term success. Keep logging.`, color: '#a200ff', type: 'SUGGESTION' });
        } else {
            suggestions.push({ icon: Heart, text: `Social connections boost decision quality. Plan a meaningful interaction this week â€” people who discuss decisions with others make 30% better choices.`, color: '#a200ff', type: 'SUGGESTION' });
        }

        return suggestions;
    })();

    if (user?.role === 'admin') {
        navigate('/admin');
        return null;
    }

    return (
        <div className="min-h-screen bg-[#050308] text-white selection:bg-cyberNeon selection:text-black">
            
            <AnimatePresence>
                {!localStorage.getItem('dashboard_onboarding_v1') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#0a050d] border border-cyberNeon/40 p-10 rounded-[3rem] max-w-2xl w-full shadow-[0_0_80px_rgba(0,229,255,0.2)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <BrainCircuit size={150} />
                            </div>
                            <h2 className="text-4xl font-orbitron font-black text-white mb-6 uppercase tracking-tighter">
                                Welcome to Your <span className="text-cyberNeon">Personal AI Twin</span>
                            </h2>
                            <p className="text-gray-400 font-inter text-lg leading-relaxed mb-10">
                                This dashboard is your Neural Command Center. Here, you don't just track data â€” you evolve your consciousness.
                            </p>
                            <div className="space-y-6 mb-10">
                                {[
                                    { icon: MessageSquare, title: 'Twin Chat', desc: 'Talk to your logical mirror. It filters out emotion to give you raw, unbiased advice.' },
                                    { icon: GitFork, title: 'Scenario Simulator', desc: 'Predict the future. See the success rates of big life decisions before you make them.' },
                                    { icon: Target, title: 'Goal Tracker', desc: 'Log your ambitions and watch your twin calculate the most efficient path.' }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="p-3 bg-cyberNeon/10 rounded-xl text-cyberNeon">
                                            <step.icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-orbitron font-bold text-sm uppercase">{step.title}</h4>
                                            <p className="text-gray-500 text-xs mt-1">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => {
                                    localStorage.setItem('dashboard_onboarding_v1', 'true');
                                    handleUpdate();
                                }}
                                className="w-full py-5 bg-cyberNeon text-black font-orbitron font-black text-xl rounded-2xl hover:scale-[1.02] transition-transform active:scale-95 shadow-[0_0_30px_rgba(0,229,255,0.4)]"
                            >
                                INITIALIZE NEURAL HUB
                            </button>
                        </motion.div>
                    </motion.div>
                )}
                {showMoodCheckin && (
                    <MoodCheckin 
                        onClose={() => setShowMoodCheckin(false)} 
                        onComplete={() => {
                            setShowMoodCheckin(false);
                            handleUpdate();
                        }} 
                    />
                )}
                {showFocus && <FocusMode onClose={() => setShowFocus(false)} />}
            </AnimatePresence>
            <OverthinkinShield />
            <BroadcastNotifier />
            
            <div className="fixed top-0 w-full z-50 bg-[#050308]/95 backdrop-blur-xl border-b border-cyberBlue/20">
                <div className="px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BrainCircuit className="text-cyberNeon" size={28} />
                        <span className="font-orbitron text-lg font-bold tracking-widest text-white">
                            DIGITAL<span className="text-cyberPink">TWIN</span>
                        </span>
                        <span className="hidden md:block text-gray-600 mx-2">|</span>
                        <span className="hidden md:block text-gray-400 font-inter text-sm">{greeting}, <span className="text-cyberNeon font-bold">{user?.username || 'User'}</span> ðŸ‘‹</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/premium')}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyberNeon/40 bg-cyberNeon/10 text-cyberNeon text-[11px] font-mono hover:bg-cyberNeon hover:text-black transition-all"
                            title="Twin Coins â€” click to unlock Premium"
                        >
                            <Coins size={14} className="animate-pulse" />
                            <span className="font-orbitron font-bold">{user?.coins ?? 0}</span>
                        </button>
                        {!user?.isPremium ? (
                            <button
                                onClick={() => navigate('/premium')}
                                className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-400 text-[10px] font-mono hover:bg-amber-400 hover:text-black transition-all"
                            >
                                <Star size={13} /> UNLOCK PREMIUM
                            </button>
                        ) : (
                            <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/40 bg-green-500/10 text-green-400 text-[10px] font-mono">
                                <ShieldCheck size={12} /> PREMIUM
                            </span>
                        )}
                        <button 
                            onClick={() => setShowFocus(true)}
                            className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyberNeon/30 bg-cyberNeon/5 text-cyberNeon text-[10px] font-mono hover:bg-cyberNeon hover:text-black transition-all group"
                        >
                            <Wind size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                            NEURAL RECALIBRATION
                        </button>
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyberPink/40 bg-cyberPink/10 text-cyberPink text-[10px] font-mono hover:bg-cyberPink hover:text-white transition-all"
                            >
                                <ShieldCheck size={14} /> ADMIN PANEL
                            </button>
                        )}
                        <div className="hidden md:flex items-center gap-2 text-green-400 font-mono text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            Twin Online
                        </div>
                        <button onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 font-orbitron text-sm bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                            <LogOut size={15} /> Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="md:hidden flex bg-[#0a050d] border-b border-white/5 sticky top-[52px] z-40">
                {[
                    { id: 'status', label: 'Status' },
                    { id: 'goals', label: 'Goals' },
                    { id: 'journal', label: 'Journal' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 text-xs font-orbitron font-bold transition-all ${activeTab === tab.id ? 'text-cyberNeon border-b-2 border-cyberNeon' : 'text-gray-500'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="pt-20 pb-16 px-4 md:px-8 max-w-[1800px] mx-auto">
                {view === 'profile' ? (
                    <ProfileManager user={user} onBack={() => setView('hub')} onChat={() => setView('chat')} />
                ) : (
                    <>
                        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} 
                            className={`mb-8 glass-panel p-6 md:p-8 rounded-3xl border border-cyberNeon/20 bg-gradient-to-r from-cyberNeon/5 via-[#0a050d] to-cyberPink/5 flex flex-col md:flex-row items-center gap-6 ${activeTab !== 'status' ? 'hidden md:flex' : ''}`}>
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-cyberNeon to-cyberPink flex items-center justify-center text-3xl font-black text-white font-orbitron flex-shrink-0 shadow-[0_0_30px_rgba(255,90,0,0.5)]">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="font-orbitron text-2xl md:text-4xl text-white font-black">
                            {greeting}, <span className="text-cyberNeon">{formatCapitalName(user?.username)}</span>!
                        </h1>
                        <p className="text-gray-400 font-inter mt-2 text-sm md:text-base">Your AI Twin is ready to help. Here is your decision progress and well-being overview for this week.</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center flex-shrink-0">
                        <div className="text-5xl font-black font-orbitron text-cyberNeon drop-shadow-[0_0_15px_#ff5a00]">
                            {data.hasData ? `${twinAccuracy}%` : 'â€”'}
                        </div>
                        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">Twin Accuracy</div>
                        <div className="w-32 h-1.5 bg-[#120b18] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: data.hasData ? `${twinAccuracy}%` : '0%' }} transition={{ duration: 2 }} className="h-full bg-cyberNeon shadow-[0_0_8px_#ff5a00] rounded-full" />
                        </div>
                        {!data.hasData && <div className="text-[10px] font-mono text-gray-600">Log data to unlock</div>}
                    </div>
                </motion.div>

                <div className={`mb-8 ${activeTab !== 'status' ? 'hidden md:block' : ''}`}>
                    <WeeklyReportCard key={refreshKey} />
                </div>
 
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 ${activeTab !== 'status' ? 'hidden md:grid' : ''}`}>
                    {stats.map((stat, idx) => (
                        <TiltCard key={idx}>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                className="glass-panel p-5 rounded-2xl border hover:shadow-lg transition-all h-full flex flex-col"
                                style={{ borderColor: `${stat.color}30` }}>
                                <stat.icon size={28} style={{ color: stat.color }} className="mb-3" />
                                <div className="text-3xl font-black font-orbitron text-white mb-1">{stat.value}</div>
                                <div className="text-xs text-gray-400 font-inter mb-1">{stat.label}</div>
                                <div className={`text-xs font-mono mt-auto ${stat.positive ? 'text-green-400' : 'text-yellow-400'}`}>{stat.sub}</div>
                            </motion.div>
                        </TiltCard>
                    ))}
                </div>
 
                <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 ${activeTab !== 'status' ? 'hidden md:grid' : ''}`}>
 
                    <div className="space-y-6">
                        <TwinPersonality key={refreshKey} />
                        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                            className="glass-panel p-6 rounded-2xl border border-cyberPink/30">
                            <h3 className="font-orbitron text-white text-sm uppercase tracking-widest mb-1">Your Personality Map</h3>
                            <p className="text-gray-500 text-xs mb-5 font-inter">Shows your 6 core psychological traits measured by your Digital Twin.</p>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={currentPersonalityData}>
                                        <PolarGrid stroke="#ffffff10" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                        <Radar name="You" dataKey="value" stroke="#ff5a00" fill="#ff5a00" fillOpacity={0.2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
 
                        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                            className="glass-panel p-6 rounded-2xl border border-cyberBlue/20">
                            <h3 className="font-orbitron text-white text-sm uppercase tracking-widest mb-5">Personality Breakdown</h3>
                            <div className="space-y-4">
                                {personalityBreakdown.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-xs font-inter text-gray-400 mb-1">
                                            <span>{item.label}</span>
                                            <span style={{ color: item.color }}>{item.value}% â€” {item.desc}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-[#120b18] rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1.5, delay: idx * 0.1 }}
                                                className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <StreakWidget />
                    </div>

                    <div className="space-y-6">
                        {view === 'hub' && (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}
                                className="glass-panel rounded-3xl border border-cyberPink/20 relative overflow-hidden flex flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyberNeon/10 via-[#050308] to-[#050308]" style={{ minHeight: '460px' }}>
                                
                                <div className="absolute top-4 left-4 font-mono text-xs text-cyberPink flex items-center gap-2 bg-cyberDark/80 p-2 rounded-lg border border-cyberPink/30">
                                    <Lock size={12} className="text-cyberPink" /><span className="animate-pulse">Your data is encrypted & private</span>
                                </div>

                                <div className="h-[250px] w-[250px] cursor-grab active:cursor-grabbing hover:scale-105 transition-transform duration-500 relative">
                                    <motion.div 
                                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} 
                                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                        className="absolute inset-0 rounded-full border border-cyberNeon/30"
                                    />
                                    <Canvas>
                                        <ambientLight intensity={1} />
                                        <directionalLight position={[2, 2, 5]} intensity={2} color="#ff5a00" />
                                        <directionalLight position={[-2, -2, -5]} intensity={2} color="#a200ff" />
                                        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
                                        <Sphere args={[1.5, 64, 64]}>
                                            <MeshDistortMaterial color="#050308" envMapIntensity={1} clearcoat={1} clearcoatRoughness={0.1} metalness={1} roughness={0.1} distort={0.4} speed={2} wireframe={true} />
                                        </Sphere>
                                    </Canvas>
                                </div>

                                <h2 className="font-orbitron text-2xl text-white font-black mt-4 mb-2 tracking-widest text-center">Your Digital Twin</h2>
                                <p className="text-gray-400 font-inter text-sm text-center mb-8 max-w-xs">A logical, calmer version of you. It never gets tired, never panics, and always gives you the smartest advice.</p>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button onClick={() => setView('chat')}
                                        className="bg-cyberDark border border-cyberNeon/30 text-cyberNeon rounded-2xl p-4 font-orbitron text-xs flex flex-col items-center gap-3 hover:bg-cyberNeon hover:text-black transition-all group">
                                        <div className="p-2 rounded-xl bg-cyberNeon/10 group-hover:bg-black/20"><MessageSquare size={20} /></div>
                                        <span>Twin Chat</span>
                                    </button>
                                    <button onClick={() => setView('scenario')}
                                        className="bg-cyberDark border border-cyberPink/30 text-cyberPink rounded-2xl p-4 font-orbitron text-xs flex flex-col items-center gap-3 hover:bg-cyberPink hover:text-white transition-all group">
                                        <div className="p-2 rounded-xl bg-cyberPink/10 group-hover:bg-black/20"><GitFork size={20} /></div>
                                        <span>Simulator</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {view === 'chat' && (
                            <div style={{ height: '460px' }}>
                                <ChatView onBack={() => setView('hub')} />
                            </div>
                        )}
                        {view === 'chat' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                className="mt-4 p-4 rounded-2xl border border-dashed border-cyberNeon/20 bg-cyberNeon/3 flex items-center justify-center min-h-[72px] group hover:border-cyberNeon/40 transition-all"
                            >
                                <div className="text-center">
                                    <p className="text-gray-600 text-[10px] font-mono uppercase tracking-widest">Sponsored Space</p>
                                    <p className="text-gray-500 text-xs font-inter mt-1">Your ad or announcement goes here â€” contact admin to feature content.</p>
                                </div>
                            </motion.div>
                        )}
                        {view === 'scenario' && (
                            <div style={{ minHeight: '600px', maxHeight: '800px' }}>
                                <ScenarioSimulator onBack={() => setView('hub')} />
                            </div>
                        )}
                        {view === 'scenario' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                className="mt-4 p-4 rounded-2xl border border-dashed border-cyberPink/20 bg-cyberPink/3 flex items-center justify-center min-h-[72px] hover:border-cyberPink/40 transition-all"
                            >
                                <div className="text-center">
                                    <p className="text-gray-600 text-[10px] font-mono uppercase tracking-widest">Sponsored Space</p>
                                    <p className="text-gray-500 text-xs font-inter mt-1">Promote your product, service, or initiative â€” visible only to active users.</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                            className="glass-panel p-6 rounded-2xl border border-cyberNeon/20">
                            <h3 className="font-orbitron text-white text-sm uppercase tracking-widest mb-1">This Week: Stress vs. Logic</h3>
                            <p className="text-gray-500 text-xs mb-5 font-inter">High logic = good decisions this day. High stress = risky choices.</p>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={currentWeeklyRiskData}>
                                        <defs>
                                            <linearGradient id="gLogic" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.6} />
                                                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gStress" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff5a00" stopOpacity={0.6} />
                                                <stop offset="95%" stopColor="#ff5a00" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" stroke="#555" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0a050d', borderColor: '#ff5a00', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                                        <Area type="monotone" dataKey="logic" stroke="#00e5ff" fill="url(#gLogic)" name="Logic Level" />
                                        <Area type="monotone" dataKey="stress" stroke="#ff5a00" fill="url(#gStress)" name="Stress Level" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-6 mt-3 text-xs font-mono">
                                <span className="text-[#00e5ff]">â— Logic Level</span>
                                <span className="text-[#ff5a00]">â— Stress Level</span>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                            className="glass-panel p-6 rounded-2xl border border-cyberPink/20">
                            <h3 className="font-orbitron text-white text-sm uppercase tracking-widest mb-1">Decision Quality</h3>
                            <p className="text-gray-500 text-xs mb-5 font-inter">Green = smart decisions your twin approved. Red = emotional decisions that backfired.</p>
                            <div className="h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentDecisionHistoryData}>
                                        <XAxis dataKey="week" stroke="#555" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0a050d', borderColor: '#a200ff', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                                        <Bar dataKey="good" fill="#22c55e" radius={[4, 4, 0, 0]} name="Smart Decisions" />
                                        <Bar dataKey="bad" fill="#ef4444" radius={[4, 4, 0, 0]} name="Poor Decisions" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <CompareWithPast key={refreshKey} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                    <div className={activeTab !== 'goals' ? 'hidden md:block' : ''}>
                        <GoalTracker key={`goals-${refreshKey}`} onUpdate={handleUpdate} />
                    </div>
                    <div className={activeTab !== 'journal' ? 'hidden md:block' : ''}>
                        <DecisionJournal key={`journal-${refreshKey}`} onUpdate={handleUpdate} />
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="font-orbitron text-xl text-white font-bold mb-2">ðŸ’¡ Your Twin's Advice for You Today</h2>
                    <p className="text-gray-400 font-inter text-sm mb-6">These are personalized recommendations based on your behavior patterns and data this week.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                        {aiSuggestions.map((suggestion, idx) => (
                            <TiltCard key={idx}>
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                    className="glass-panel p-6 rounded-2xl border h-full flex flex-col" style={{ borderColor: `${suggestion.color}30` }}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${suggestion.color}20` }}>
                                            <suggestion.icon size={20} style={{ color: suggestion.color }} />
                                        </div>
                                        <span className="font-mono text-xs uppercase px-2 py-0.5 rounded" style={{ color: suggestion.color, backgroundColor: `${suggestion.color}15` }}>{suggestion.type}</span>
                                    </div>
                                    <p className="text-gray-300 font-inter text-sm leading-relaxed flex-1">{suggestion.text}</p>
                                </motion.div>
                            </TiltCard>
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="font-orbitron text-xl text-white font-bold mb-2">ðŸ“‹ Your Recent Decisions</h2>
                    <p className="text-gray-400 font-inter text-sm mb-6">A log of choices you've made recently and how your twin rated them.</p>
                    <div className="glass-panel rounded-2xl border border-cyberBlue/15 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#0a050d] border-b border-white/5">
                                        <th className="p-4 font-orbitron text-xs text-gray-500 uppercase tracking-widest">Decision</th>
                                        <th className="p-4 font-orbitron text-xs text-gray-500 uppercase tracking-widest">Category</th>
                                        <th className="p-4 font-orbitron text-xs text-gray-500 uppercase tracking-widest">Twin's Verdict</th>
                                        <th className="p-4 font-orbitron text-xs text-gray-500 uppercase tracking-widest">Impact</th>
                                        <th className="p-4 font-orbitron text-xs text-gray-500 uppercase tracking-widest">When</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.decisions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500 font-inter text-sm italic">
                                                No decisions logged yet. Your journal is empty.
                                            </td>
                                        </tr>
                                    )}
                                    {data.decisions.map((d, idx) => (
                                        <motion.tr key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                                            className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                            <td className="p-4 text-white font-inter text-sm">{d.decision}</td>
                                            <td className="p-4">
                                                <span className="font-mono text-xs px-2 py-1 rounded bg-[#120b18] text-cyberBlue border border-cyberBlue/20">{d.type}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1.5 w-max text-xs font-mono font-bold`} style={{ color: d.rating.color }}>
                                                    {d.rating.score >= 4 ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                    {d.rating.label}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 capitalize`}>
                                                    {d.emotion}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 font-mono text-xs flex items-center gap-1"><Clock size={12} />{d.date}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="font-orbitron text-xl text-white font-bold mb-2">ðŸ“š Recommended Learning</h2>
                    <p className="text-gray-400 font-inter text-sm mb-6">Your twin picked these resources based on your personality profile and current performance.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            patienceVal < 60
                                ? { icon: BookOpen, title: 'How to Be More Patient', desc: `Your patience score is ${patienceVal}% â€” one of your growth areas. This guide covers practical daily techniques to build patience over 30 days and improve your decision quality under pressure.`, color: '#a200ff', tag: 'For You' }
                                : { icon: BookOpen, title: 'Mastering Decision Speed', desc: `Your patience is solid at ${patienceVal}%. The next skill to develop: knowing when to act fast vs slow. Learn the optimal decision timing framework for your personality type.`, color: '#a200ff', tag: 'For You' },
                            riskComfortVal < 50
                                ? { icon: Shield, title: 'Calculated Risk-Taking', desc: `Your risk comfort is ${riskComfortVal}% â€” naturally cautious. This works well for protection but can slow growth. Learn to identify when taking a calculated risk would significantly improve your outcomes.`, color: '#ff5a00', tag: 'Priority' }
                                : { icon: Shield, title: 'Managing Bold Decisions', desc: `Your risk tolerance is ${riskComfortVal}% â€” you lean bold. This guide helps you channel that boldness strategically: when to go all-in vs when to hold back for maximum long-term gains.`, color: '#ff5a00', tag: 'Priority' },
                            parseInt(data.stressAlerts) > 0
                                ? { icon: Lightbulb, title: 'Stress Management 101', desc: `You had ${data.stressAlerts} stress alert${parseInt(data.stressAlerts) !== 1 ? 's' : ''} this week. This resource teaches a simple 10-minute daily technique to keep stress spikes under control and protect your decision quality.`, color: '#00e5ff', tag: 'This Week' }
                                : logicPct < 60 && logicPct > 0
                                    ? { icon: Lightbulb, title: 'Logic-First Thinking', desc: `Your current logic efficiency is ${logicPct}%. This guide teaches a 3-step framework to pause emotional impulses and engage your analytical side before any major life decision.`, color: '#00e5ff', tag: 'Improve' }
                                    : { icon: Lightbulb, title: 'Advanced Goal Architecture', desc: `You're performing well logically (${logicPct > 0 ? logicPct + '%' : 'building up'}). Level up by learning how to set layered goals with milestones â€” the method high performers use to achieve 10x outcomes.`, color: '#00e5ff', tag: 'Level Up' },
                        ].map((item, idx) => (
                            <TiltCard key={idx}>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                    className="glass-panel p-6 rounded-2xl border cursor-pointer hover:shadow-xl transition-all h-full flex flex-col" style={{ borderColor: `${item.color}30` }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <item.icon size={32} style={{ color: item.color }} />
                                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: item.color, backgroundColor: `${item.color}15` }}>{item.tag}</span>
                                    </div>
                                    <h4 className="font-orbitron font-bold text-white text-sm mb-3">{item.title}</h4>
                                    <p className="text-gray-400 font-inter text-sm leading-relaxed flex-1">{item.desc}</p>
                                    <button className="mt-4 text-xs font-mono flex items-center gap-1 hover:underline" style={{ color: item.color }}>
                                        Read More <ChevronRight size={12} />
                                    </button>
                                </motion.div>
                            </TiltCard>
                        ))}
                    </div>
                </div>


                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> Database: Connected
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> AI Engine: Online
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                            <Lock size={12} className="text-cyberPink" /> Your data is fully encrypted
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setView('profile')} className="text-xs font-mono text-cyberBlue border border-cyberBlue/30 px-3 py-1.5 rounded-lg hover:bg-cyberBlue hover:text-black transition-all">Profile Settings</button>
                        <button onClick={() => setView('chat')} className="text-xs font-mono text-cyberNeon border border-cyberNeon/30 px-3 py-1.5 rounded-lg hover:bg-cyberNeon hover:text-black transition-all">Chat with Twin</button>
                        <button onClick={handleLogout} className="text-xs font-mono text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all flex items-center gap-1">
                            <LogOut size={12} /> Logout
                        </button>
                    </div>
                </div>
                
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

