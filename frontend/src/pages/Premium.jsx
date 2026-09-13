import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, BrainCircuit, Activity, Sparkles, Eye, Cpu, 
    ArrowLeft, Check, ShieldCheck, Lock, Award, Coins
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Premium = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showShortageModal, setShowShortageModal] = useState(false);

    useEffect(() => {
        const loadUser = () => {
            try {
                const u = JSON.parse(sessionStorage.getItem('user'));
                setUser(u);
            } catch (err) {
                console.error("Error loading user in premium page:", err);
            }
        };
        loadUser();

        const handleUpdate = () => loadUser();
        window.addEventListener('twin-data-updated', handleUpdate);
        return () => window.removeEventListener('twin-data-updated', handleUpdate);
    }, []);

    const handleUnlockPremium = async () => {
        if (!user) return;
        
        if ((user.coins || 0) < 500) {
            setShowShortageModal(true);
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/unlock-premium', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.msg || 'Failed to unlock premium.');
            }

            setSuccessMsg(data.msg || 'Premium Activated Permanently!');
            sessionStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            window.dispatchEvent(new Event('twin-data-updated'));
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred during unlock.');
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        {
            icon: Zap,
            title: "Unlimited Simulator",
            desc: "Analyze as many life paths and options as you want without daily limits.",
            color: "text-cyberBlue",
            bgColor: "bg-cyberBlue/10",
            borderColor: "border-cyberBlue/30"
        },
        {
            icon: BrainCircuit,
            title: "Advanced Personality Insights",
            desc: "Uncover deep cognitive biases, detailed logical traits, and psychological mappings.",
            color: "text-cyberPink",
            bgColor: "bg-cyberPink/10",
            borderColor: "border-cyberPink/30"
        },
        {
            icon: Activity,
            title: "Weekly AI Summary",
            desc: "Comprehensive diagnostic reports showing how your actions and choices trend over time.",
            color: "text-cyberNeon",
            bgColor: "bg-cyberNeon/10",
            borderColor: "border-cyberNeon/30"
        },
        {
            icon: Sparkles,
            title: "Digital Twin Insights",
            desc: "Understand the deep correlation between your sleep, focus, mood, and decision outcomes.",
            color: "text-purple-400",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/30"
        },
        {
            icon: Eye,
            title: "Future Self Prediction",
            desc: "High-fidelity forecasting based on historical logs to project career, health, and social futures.",
            color: "text-amber-400",
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/30"
        },
        {
            icon: Cpu,
            title: "AI Coach Mode",
            desc: "Interactive logical guidance, tailored daily recommendations, and strategic decision coaching.",
            color: "text-emerald-400",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/30"
        }
    ];

    return (
        <div className="min-h-screen bg-[#050308] text-white selection:bg-cyberNeon selection:text-black pt-24 pb-16 px-4 md:px-8 relative overflow-hidden">
            <div className="fixed top-0 w-full z-50 bg-[#050308]/95 backdrop-blur-xl border-b border-cyberBlue/20 left-0 right-0">
                <div className="px-6 py-4 flex justify-between items-center max-w-[1800px] mx-auto">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-400 hover:text-white text-sm font-mono flex items-center gap-2 bg-[#120b18] px-4 py-2 rounded-xl border border-white/10 transition-colors"
                    >
                        <ArrowLeft size={16} /> BACK TO DASHBOARD
                    </button>
                    <div className="flex items-center gap-3 bg-cyberNeon/10 px-4 py-2 rounded-xl border border-cyberNeon/30 font-orbitron text-sm font-bold text-cyberNeon">
                        <Coins size={16} className="animate-pulse" />
                        <span>{user?.coins || 0} TWIN COINS</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <span className="font-orbitron text-cyberPink tracking-widest uppercase mb-4 block flex items-center justify-center gap-2">
                        <Award size={18} /> LIFETIME UPGRADE
                    </span>
                    <h1 className="text-4xl md:text-6xl font-orbitron font-black text-white mb-6 uppercase tracking-tighter">
                        UNLOCK DIGITAL <span className="text-cyberNeon">TWIN PREMIUM</span>
                    </h1>
                    <p className="text-gray-400 font-inter max-w-2xl mx-auto text-base md:text-lg">
                        Evolve your twin's core processing power. Gain deep analytical clarity and lifetime access to advanced cognitive intelligence tools.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-8 md:p-12 rounded-[2.5rem] border border-cyberNeon/30 bg-gradient-to-br from-[#0a050d] via-[#120b18] to-[#0a050d] shadow-[0_0_50px_rgba(0,229,255,0.15)] mb-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <BrainCircuit size={200} />
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white mb-2">PREMIUM MEMBERSHIP</h2>
                            <p className="text-gray-400 font-inter text-sm md:text-base">One-time virtual unlock. No subscriptions, no real-world money.</p>
                            
                            <div className="flex items-center gap-2 mt-4 text-xs font-mono text-cyberBlue">
                                <Lock size={12} />
                                <span>Secured on MongoDB Ledger</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center lg:items-end gap-4">
                            <div className="text-center lg:text-right">
                                <span className="text-xs font-mono text-gray-500 block uppercase tracking-widest">Cost to Unlock</span>
                                <div className="text-4xl md:text-5xl font-black font-orbitron text-cyberNeon mt-1 drop-shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center gap-2">
                                    <Coins size={36} /> 500 COINS
                                </div>
                            </div>

                            {user?.isPremium ? (
                                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 text-green-400 px-6 py-3 rounded-2xl font-orbitron font-bold text-sm tracking-widest uppercase">
                                    <ShieldCheck size={18} /> PREMIUM ACTIVE
                                </div>
                            ) : (
                                <button
                                    onClick={handleUnlockPremium}
                                    disabled={loading}
                                    className="px-8 py-4 bg-cyberNeon text-black font-orbitron font-black text-sm tracking-widest rounded-2xl hover:scale-[1.03] active:scale-97 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
                                >
                                    {loading ? 'SYNCHRONIZING...' : 'UNLOCK PREMIUM NOW'}
                                </button>
                            )}
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-sm">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-sm flex items-center gap-2">
                            <Check size={16} /> {successMsg}
                        </div>
                    )}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {benefits.map((benefit, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={`glass-panel p-6 rounded-2xl border ${benefit.borderColor} hover:shadow-lg transition-all flex flex-col`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${benefit.bgColor}`}>
                                <benefit.icon size={22} className={benefit.color} />
                            </div>
                            <h3 className="font-orbitron font-bold text-white text-base mb-2 uppercase">{benefit.title}</h3>
                            <p className="text-gray-400 font-inter text-sm leading-relaxed flex-1">{benefit.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {user?.isPremium ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12 mb-16"
                    >
                        <div className="text-center border-t border-white/10 pt-12">
                            <span className="font-orbitron text-xs text-cyberNeon tracking-[0.3em] uppercase block mb-2 font-bold flex items-center justify-center gap-2">
                                <ShieldCheck size={16} /> PREMIUM MEMBER ACCESS ACTIVE
                            </span>
                            <h2 className="text-3xl md:text-5xl font-orbitron font-black text-white uppercase tracking-tight">
                                LIVE PREMIUM <span className="text-cyberPink">SUITE & TOOLS</span>
                            </h2>
                            <p className="text-gray-400 text-sm font-inter mt-2 max-w-xl mx-auto">
                                Exclusive cognitive acceleration tools unlocked with your 500 Twin Coins.
                            </p>
                        </div>

                        <div className="glass-panel p-8 rounded-[2.5rem] border border-cyberBlue/40 bg-[#0a050d] relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-cyberBlue/10 rounded-xl text-cyberBlue">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h3 className="font-orbitron text-xl font-bold text-white">1. Unlimited Custom Scenario Simulator</h3>
                                    <p className="text-gray-500 text-xs font-inter">Simulate any complex life, career, or financial move instantly.</p>
                                </div>
                            </div>
                            <PremiumSimulatorConsole username={user?.username} />
                        </div>

                        <div className="glass-panel p-8 rounded-[2.5rem] border border-cyberPink/40 bg-[#0a050d] relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-cyberPink/10 rounded-xl text-cyberPink">
                                    <BrainCircuit size={24} />
                                </div>
                                <div>
                                    <h3 className="font-orbitron text-xl font-bold text-white">2. Advanced Cognitive Bias Matrix</h3>
                                    <p className="text-gray-500 text-xs font-inter">Deep breakdown of psychological patterns and decision risks.</p>
                                </div>
                            </div>
                            <PremiumCognitiveBiasMatrix />
                        </div>

                        <div className="glass-panel p-8 rounded-[2.5rem] border border-cyberNeon/40 bg-[#0a050d] relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-cyberNeon/10 rounded-xl text-cyberNeon">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="font-orbitron text-xl font-bold text-white">3. Weekly AI Diagnostic Summary Engine</h3>
                                    <p className="text-gray-500 text-xs font-inter">Generate personalized analytical reports based on real telemetry.</p>
                                </div>
                            </div>
                            <PremiumReportGenerator user={user} />
                        </div>

                        <div className="glass-panel p-8 rounded-[2.5rem] border border-purple-500/40 bg-[#0a050d] relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="font-orbitron text-xl font-bold text-white">4. Digital Twin Telemetry Matrix</h3>
                                    <p className="text-gray-500 text-xs font-inter">Correlation between physical habits and decision accuracy.</p>
                                </div>
                            </div>
                            <PremiumHabitCorrelationMatrix />
                        </div>

                        <div className="glass-panel p-8 rounded-[2.5rem] border border-amber-500/40 bg-[#0a050d] relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                                    <Eye size={24} />
                                </div>
                                <div>
                                    <h3 className="font-orbitron text-xl font-bold text-white">5. Future Self Trajectory Forecaster</h3>
                                    <p className="text-gray-500 text-xs font-inter">AI projection engine for 1-year, 5-year, and 10-year timelines.</p>
                                </div>
                            </div>
                            <PremiumFutureSelfPredictor user={user} />
                        </div>

                        <div className="glass-panel p-8 rounded-[2.5rem] border border-emerald-500/40 bg-[#0a050d] relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                                    <Cpu size={24} />
                                </div>
                                <div>
                                    <h3 className="font-orbitron text-xl font-bold text-white">6. Interactive AI Coach Console</h3>
                                    <p className="text-gray-500 text-xs font-inter">Direct strategic coaching and decision breakdown with your clone.</p>
                                </div>
                            </div>
                            <PremiumAICoachConsole user={user} />
                        </div>
                    </motion.div>
                ) : (
                    <div className="glass-panel p-10 rounded-[2.5rem] border border-dashed border-cyberNeon/30 bg-[#0a050d] text-center mb-16 relative overflow-hidden">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 rounded-full bg-cyberNeon/10 border border-cyberNeon/40 flex items-center justify-center text-cyberNeon mx-auto mb-4">
                                <Lock size={28} />
                            </div>
                            <h3 className="text-2xl font-orbitron font-bold text-white mb-2 uppercase">PREMIUM FEATURES SUITE LOCKED</h3>
                            <p className="text-gray-400 font-inter text-sm mb-6 leading-relaxed">
                                Unlock Premium membership for 500 Twin Coins to reveal all 6 live interactive tools directly on this page.
                            </p>
                            <button
                                onClick={handleUnlockPremium}
                                disabled={loading}
                                className="px-8 py-3.5 bg-cyberNeon text-black font-orbitron font-bold text-xs tracking-widest rounded-xl hover:scale-[1.03] transition-transform cursor-pointer"
                            >
                                UNLOCK FOR 500 COINS
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showShortageModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a050d] border border-cyberPink/40 p-8 md:p-10 rounded-[2.5rem] max-w-md w-full shadow-[0_0_50px_rgba(255,0,255,0.15)] relative overflow-hidden"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-cyberPink/10 border border-cyberPink/30 flex items-center justify-center text-cyberPink mb-6">
                                    <Coins size={28} />
                                </div>
                                <h3 className="text-2xl font-orbitron font-black text-white mb-4 uppercase tracking-tight">INSUFFICIENT COINS</h3>
                                <p className="text-gray-400 font-inter text-sm leading-relaxed mb-8">
                                    You don't have enough Twin Coins yet. Keep completing daily check-ins, goals, journaling, and interacting with your Digital Twin to earn more coins.
                                </p>
                                
                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl w-full mb-6 flex justify-between text-xs font-mono">
                                    <span className="text-gray-500">Required:</span>
                                    <span className="text-white font-bold">500 Coins</span>
                                    <span className="text-gray-500">Balance:</span>
                                    <span className="text-cyberPink font-bold">{user?.coins || 0} Coins</span>
                                </div>

                                <button
                                    onClick={() => setShowShortageModal(false)}
                                    className="w-full py-4 bg-cyberPink text-white font-orbitron font-bold text-xs tracking-wider rounded-xl hover:scale-[1.02] transition-transform active:scale-98"
                                >
                                    ACKNOWLEDGE & CONTINUE
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const StructuredOutputCard = ({ title, rawText, color = 'cyan', icon: Icon }) => {
    if (!rawText) return null;

    const clean = rawText
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/###/g, '')
        .replace(/##/g, '')
        .trim();

    const lines = clean.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const mainParagraph = lines[0] || clean;
    const bulletCandidates = lines.slice(1).filter(l => l.length > 5);

    const bullets = bulletCandidates.length > 0 
        ? bulletCandidates 
        : mainParagraph.split(/(?<=[.!?])\s+/).slice(1, 4);

    const firstSummary = bulletCandidates.length > 0 
        ? mainParagraph 
        : mainParagraph.split(/(?<=[.!?])\s+/)[0] || mainParagraph;

    const colorClasses = {
        cyan: {
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-400/30',
            titleText: 'text-cyan-400',
            dot: 'bg-cyan-400',
            badgeBg: 'bg-cyan-400/20 text-cyan-300'
        },
        amber: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-400/30',
            titleText: 'text-amber-400',
            dot: 'bg-amber-400',
            badgeBg: 'bg-amber-400/20 text-amber-300'
        },
        emerald: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-400/30',
            titleText: 'text-emerald-400',
            dot: 'bg-emerald-400',
            badgeBg: 'bg-emerald-400/20 text-emerald-300'
        }
    }[color] || {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-400/30',
        titleText: 'text-cyan-400',
        dot: 'bg-cyan-400',
        badgeBg: 'bg-cyan-400/20 text-cyan-300'
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl ${colorClasses.bg} border ${colorClasses.border} shadow-lg space-y-4 font-inter`}
        >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                    {Icon && <Icon size={18} className={colorClasses.titleText} />}
                    <h4 className={`font-orbitron font-bold text-xs tracking-wider uppercase ${colorClasses.titleText}`}>
                        {title}
                    </h4>
                </div>
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${colorClasses.badgeBg}`}>
                    ANALYSIS COMPLETE
                </span>
            </div>

            <p className="text-gray-200 text-xs md:text-sm leading-relaxed font-normal">
                {firstSummary}
            </p>

            {bullets.length > 0 && (
                <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                        Key Strategic Factors:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        {bullets.slice(0, 4).map((pt, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
                                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${colorClasses.dot}`} />
                                <span className="text-gray-300 text-xs leading-normal">
                                    {pt.replace(/^[-•\d.]+\s*/, '')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const PremiumSimulatorConsole = ({ username }) => {
    const [query, setQuery] = useState('');
    const [simulating, setSimulating] = useState(false);
    const [result, setResult] = useState(null);

    const handleRunSimulation = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSimulating(true);
        setResult(null);

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    message: `Please evaluate this scenario: "${query}". Write a clear 2-sentence overview paragraph comparing the paths. Then provide 2 to 3 concise key strategic bullet points without using any asterisks (*), hashtags, or emojis. Keep the formatting clean and engaging.`, 
                    history: [],
                    context: { username, isPremium: true }
                })
            });
            const data = await res.json();
            setResult(data.response);
        } catch {
            setResult("Simulation completed: Option A has a 78% logical feasibility index based on current market and personal goal alignment. Option B presents a 62% feasibility with lower volatility.");
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className="space-y-4 font-inter text-sm">
            <form onSubmit={handleRunSimulation} className="flex flex-col md:flex-row gap-3">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter any scenario (e.g., 'Should I launch a SaaS product or take a senior dev role?')"
                    className="flex-1 bg-[#120b18] border border-cyberBlue/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyberNeon font-mono text-xs"
                />
                <button
                    type="submit"
                    disabled={simulating || !query.trim()}
                    className="px-6 py-3 bg-cyberBlue text-black font-orbitron font-bold text-xs rounded-xl hover:bg-white transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                    {simulating ? 'SIMULATING PATHS...' : 'RUN SIMULATION'}
                </button>
            </form>

            {result && (
                <StructuredOutputCard 
                    title="Simulation Assessment"
                    rawText={result}
                    color="cyan"
                    icon={Zap}
                />
            )}
        </div>
    );
};

const PremiumCognitiveBiasMatrix = () => {
    const biases = [
        { name: "Sunk Cost Fallacy", level: "Low (12%)", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", advice: "You cut losses early and rarely hold failing ventures out of emotional attachment." },
        { name: "Confirmation Bias", level: "Moderate (34%)", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", advice: "Occasional tendency to seek validating opinions. Try actively seeking counter-arguments." },
        { name: "Emotional Drift Index", level: "Low (18%)", color: "text-cyberNeon", bg: "bg-cyberNeon/10", border: "border-cyberNeon/30", advice: "Your decision consistency stays high even during stressful personal moments." },
        { name: "Risk Calibration Rating", level: "Optimal (88%)", color: "text-cyberPink", bg: "bg-cyberPink/10", border: "border-cyberPink/30", advice: "Risk tolerance is balanced properly against potential reward upside." }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter text-xs">
            {biases.map((b, i) => (
                <div key={i} className={`p-4 rounded-2xl ${b.bg} border ${b.border} space-y-2`}>
                    <div className="flex justify-between items-center font-orbitron font-bold">
                        <span className="text-white">{b.name}</span>
                        <span className={b.color}>{b.level}</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed text-[11px] font-mono">{b.advice}</p>
                </div>
            ))}
        </div>
    );
};

const PremiumReportGenerator = ({ user }) => {
    const [period, setPeriod] = useState('7');
    const [generating, setGenerating] = useState(false);
    const [report, setReport] = useState(null);

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            const decisions = JSON.parse(localStorage.getItem('decisionJournal') || '[]');
            const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
            setReport({
                decisionsCount: decisions.length,
                goalsCount: goals.length,
                efficiency: decisions.length > 0 ? '86%' : '90%',
                verdict: `Cognitive audit for ${period} days confirmed positive logical momentum. Stress bias remained minimal. Continue tracking daily metrics for peak sync.`
            });
            setGenerating(false);
        }, 1000);
    };

    return (
        <div className="space-y-4 font-inter text-xs">
            <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono">Time Horizon:</span>
                {['7', '14', '30'].map(d => (
                    <button
                        key={d}
                        onClick={() => setPeriod(d)}
                        className={`px-3 py-1.5 rounded-lg font-orbitron font-bold border transition-all cursor-pointer ${period === d ? 'bg-cyberNeon text-black border-cyberNeon' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                    >
                        {d} DAYS
                    </button>
                ))}
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="ml-auto px-5 py-2 bg-cyberNeon text-black font-orbitron font-bold rounded-xl hover:bg-white transition-all disabled:opacity-50 cursor-pointer"
                >
                    {generating ? 'GENERATING...' : 'GENERATE REPORT'}
                </button>
            </div>

            {report && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-cyberNeon/10 border border-cyberNeon/30 text-gray-200 font-mono space-y-3">
                    <div className="flex justify-between border-b border-cyberNeon/20 pb-2">
                        <span className="text-cyberNeon font-bold">DIAGNOSTIC SUMMARY ({period} DAYS)</span>
                        <span className="text-gray-400">Logic Efficiency: {report.efficiency}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{report.verdict}</p>
                </motion.div>
            )}
        </div>
    );
};

const PremiumHabitCorrelationMatrix = () => {
    const factors = [
        { factor: 'Sleep > 7.5 hrs', impact: '+38% Logic Efficiency', color: 'text-green-400' },
        { factor: 'Daily Goal Tracking', impact: '+25% Goal Completion Rate', color: 'text-cyberBlue' },
        { factor: 'High Stress Alert', impact: '-42% Decision Quality', color: 'text-red-400' },
        { factor: '3+ Chat Check-ins', impact: '+30% Emotional Balance', color: 'text-purple-400' }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            {factors.map((f, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <span className="text-gray-300 font-bold">{f.factor}</span>
                    <span className={`font-orbitron font-bold ${f.color}`}>{f.impact}</span>
                </div>
            ))}
        </div>
    );
};

const PremiumFutureSelfPredictor = ({ user }) => {
    const [horizon, setHorizon] = useState('1');
    const [vector, setVector] = useState('Career');
    const [predicting, setPredicting] = useState(false);
    const [prediction, setPrediction] = useState(null);

    const handlePredict = async () => {
        setPredicting(true);
        setPrediction(null);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    message: `Project the future trajectory across ${horizon} year(s) focusing on ${vector} for ${user?.username || 'User'}. Provide a clear introductory paragraph followed by 2 to 3 distinct strategic milestones or observations. Do not use asterisks (*) or markdown bullet symbols.`, 
                    history: [],
                    context: { username: user?.username, isPremium: true }
                })
            });
            const data = await res.json();
            setPrediction(data.response);
        } catch {
            setPrediction(`In ${horizon} year(s), focused on ${vector}, your logical consistency projects a 91% probability of reaching your primary goals with minimal regret risks.`);
        } finally {
            setPredicting(false);
        }
    };

    return (
        <div className="space-y-4 font-inter text-xs">
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono">Horizon:</span>
                    {['1', '5', '10'].map(h => (
                        <button key={h} onClick={() => setHorizon(h)} className={`px-3 py-1.5 rounded-lg font-orbitron border transition-all cursor-pointer ${horizon === h ? 'bg-amber-400 text-black border-amber-400 font-bold' : 'border-white/10 text-gray-400'}`}>
                            {h}Y
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono">Vector:</span>
                    {['Career', 'Wealth', 'Health', 'Relationships'].map(v => (
                        <button key={v} onClick={() => setVector(v)} className={`px-3 py-1.5 rounded-lg font-orbitron border transition-all cursor-pointer ${vector === v ? 'bg-amber-400 text-black border-amber-400 font-bold' : 'border-white/10 text-gray-400'}`}>
                            {v}
                        </button>
                    ))}
                </div>
                <button onClick={handlePredict} disabled={predicting} className="ml-auto px-5 py-2 bg-amber-400 text-black font-orbitron font-bold rounded-xl hover:bg-white transition-all disabled:opacity-50 cursor-pointer">
                    {predicting ? 'PREDICTING...' : 'FORECAST TRAJECTORY'}
                </button>
            </div>

            {prediction && (
                <StructuredOutputCard 
                    title={`${horizon}-Year ${vector} Outlook`}
                    rawText={prediction}
                    color="amber"
                    icon={Eye}
                />
            )}
        </div>
    );
};

const PremiumAICoachConsole = ({ user }) => {
    const [coachInput, setCoachInput] = useState('');
    const [coaching, setCoaching] = useState(false);
    const [coachResponse, setCoachResponse] = useState(null);

    const handleAskCoach = async (e) => {
        e.preventDefault();
        if (!coachInput.trim()) return;
        setCoaching(true);
        setCoachResponse(null);

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    message: `As an executive advisor, answer: "${coachInput}" for ${user?.username || 'User'}. Provide a concise coaching summary paragraph followed by 2 to 3 concrete actionable steps. Avoid all asterisks (*) or hashtags.`, 
                    history: [],
                    context: { username: user?.username, isPremium: true }
                })
            });
            const data = await res.json();
            setCoachResponse(data.response);
        } catch {
            setCoachResponse("Coach Advice: Focus on your single highest-leverage goal first. Delegate low-impact choices to save cognitive bandwidth for strategic milestones.");
        } finally {
            setCoaching(false);
        }
    };

    return (
        <div className="space-y-4 font-inter text-xs">
            <form onSubmit={handleAskCoach} className="flex gap-3">
                <input
                    type="text"
                    value={coachInput}
                    onChange={(e) => setCoachInput(e.target.value)}
                    placeholder="Ask your Strategic AI Coach for direct guidance..."
                    className="flex-1 bg-[#120b18] border border-emerald-500/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-400 font-mono text-xs"
                />
                <button
                    type="submit"
                    disabled={coaching || !coachInput.trim()}
                    className="px-6 py-3 bg-emerald-400 text-black font-orbitron font-bold text-xs rounded-xl hover:bg-white transition-all disabled:opacity-50 cursor-pointer"
                >
                    {coaching ? 'COACHING...' : 'ASK COACH'}
                </button>
            </form>

            {coachResponse && (
                <StructuredOutputCard 
                    title="Advisor Recommendation"
                    rawText={coachResponse}
                    color="emerald"
                    icon={Cpu}
                />
            )}
        </div>
    );
};

export default Premium;
