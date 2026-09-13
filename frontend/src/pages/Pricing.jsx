import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Check, X, Coins, Sparkles, Zap, BrainCircuit, 
    Activity, Eye, Cpu, ArrowRight, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingCard = ({ title, priceUnit, subPrice, description, features, neonColor, isPopular, delay, buttonText, buttonLink, badge }) => (
    <motion.div 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className={`relative glass-panel rounded-3xl p-8 flex flex-col border transition-all duration-300 ${
            isPopular 
                ? 'border-cyberPink/60 bg-gradient-to-b from-[#16081e] via-[#0e0614] to-[#0a040d] shadow-[0_0_35px_rgba(255,0,255,0.2)] transform md:-translate-y-4' 
                : 'border-white/10 bg-[#0a050d] hover:border-white/20'
        }`}
    >
        {isPopular && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyberPink text-white px-4 py-1 rounded-full text-xs font-orbitron tracking-widest neon-glow-pink flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                <Sparkles size={12} /> {badge || 'RECOMMENDED UNLOCK'}
            </div>
        )}
        
        <h3 className={`font-orbitron font-bold text-2xl mb-2 ${neonColor}`}>{title}</h3>
        <div className="text-3xl text-white font-orbitron font-black mb-3 flex items-center gap-2">
            {priceUnit} <span className="text-xs font-mono font-normal text-gray-400">{subPrice}</span>
        </div>
        <p className="text-gray-400 text-sm mb-6 font-inter min-h-[44px] leading-relaxed">{description}</p>
        
        <ul className="space-y-3.5 mb-8 flex-1">
            {features.map((feature, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-300 font-inter items-start">
                   {feature.included ? (
                       <Check className="text-cyberNeon shrink-0 mt-0.5" size={16} />
                   ) : (
                       <X className="text-gray-600 shrink-0 mt-0.5" size={16} />
                   )}
                   <span className={feature.included ? 'text-gray-200' : 'text-gray-600 line-through'}>{feature.text}</span>
                </li>
            ))}
        </ul>

        <Link 
            to={buttonLink} 
            className={`w-full text-center font-orbitron py-3.5 rounded-xl font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
                isPopular 
                    ? 'bg-cyberPink text-white hover:bg-white hover:text-black neon-glow-pink' 
                    : 'bg-transparent border border-white/20 text-white hover:border-cyberNeon hover:text-cyberNeon'
            }`}
        >
            {buttonText} <ArrowRight size={14} />
        </Link>
    </motion.div>
);

const SIX_TOOLS = [
    {
        icon: Zap,
        number: '01',
        title: 'Unlimited Scenario Simulator',
        desc: 'Test complex decisions and simulate life outcomes without any daily limit.',
        color: 'text-cyberBlue',
        border: 'border-cyberBlue/30',
        bg: 'bg-cyberBlue/10'
    },
    {
        icon: BrainCircuit,
        number: '02',
        title: 'Cognitive Bias Matrix',
        desc: 'Detect deep logical patterns, cognitive biases, and emotional risk indicators.',
        color: 'text-cyberPink',
        border: 'border-cyberPink/30',
        bg: 'bg-cyberPink/10'
    },
    {
        icon: Activity,
        number: '03',
        title: 'Weekly AI Diagnostic Summary',
        desc: 'Generate custom analytical reports of your choices, trends, and mental clarity.',
        color: 'text-cyberNeon',
        border: 'border-cyberNeon/30',
        bg: 'bg-cyberNeon/10'
    },
    {
        icon: Sparkles,
        number: '04',
        title: 'Habit-to-Decision Telemetry',
        desc: 'Correlate sleep, mood, focus, and lifestyle habits with decision success.',
        color: 'text-purple-400',
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/10'
    },
    {
        icon: Eye,
        number: '05',
        title: 'Future Self Trajectory Forecaster',
        desc: 'Project realistic 1-year, 5-year, and 10-year timelines based on real activity.',
        color: 'text-amber-400',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10'
    },
    {
        icon: Cpu,
        number: '06',
        title: 'Interactive AI Coach Console',
        desc: 'Real-time strategic coaching and decision breakdown with your digital clone.',
        color: 'text-emerald-400',
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/10'
    }
];

const COIN_ACTIVITIES = [
    { name: 'Daily Check-in', coins: '+5 to +15 Coins', freq: 'Daily Streak' },
    { name: 'Log Life Decision', coins: '+5 Coins', freq: 'Per Logged Entry' },
    { name: 'Complete Goal Task', coins: '+5 Coins', freq: 'Per Completed Goal' },
    { name: 'Twin Chat Interaction', coins: '+2 Coins', freq: 'Gradual Engagement' }
];

const Pricing = () => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        setToken(sessionStorage.getItem('token'));
        try {
            const u = JSON.parse(sessionStorage.getItem('user'));
            setUser(u);
        } catch (e) {}
    }, []);

    return (
        <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 relative z-10 w-full bg-[#050308] text-white">
            <div className="max-w-7xl mx-auto">
                
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <span className="font-orbitron text-xs md:text-sm text-cyberNeon tracking-[0.25em] uppercase mb-4 block flex items-center justify-center gap-2 font-bold">
                        <Coins size={18} className="text-amber-400 animate-pulse" /> INTERACTIVE SUITE & REWARDS
                    </span>
                    <h1 className="text-4xl md:text-6xl font-orbitron font-black text-white mb-6 uppercase tracking-tight">
                        PREMIUM <span className="text-cyberPink">FEATURES</span>
                    </h1>
                    <p className="text-gray-300 font-inter max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                        Earn Twin Coins through daily check-ins, goal tracking, and logging decisions to unlock our full 6-tool interactive AI suite.
                    </p>

                    {token && user && (
                        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full mt-6 text-xs font-mono">
                            <span className="text-gray-400">Your Balance:</span>
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                                <Coins size={13} /> {user.coins || 0} Coins
                            </span>
                            <span className="text-gray-600">|</span>
                            <span className={user.isPremium ? 'text-green-400 font-bold' : 'text-cyberNeon font-bold'}>
                                {user.isPremium ? 'PREMIUM UNLOCKED' : 'STANDARD TIER'}
                            </span>
                        </div>
                    )}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
                    <PricingCard 
                        title="Starter Twin"
                        priceUnit="FREE"
                        subPrice="Default Tier"
                        neonColor="text-gray-300"
                        description="Standard cognitive twin with daily check-ins, goal tracking, and baseline chat."
                        delay={0.1}
                        buttonText={token ? "VIEW DASHBOARD" : "EXPLORE FREE"}
                        buttonLink={token ? "/dashboard" : "/register"}
                        features={[
                            { text: "Standard Persona Alignment", included: true },
                            { text: "Daily Mood and Journal Tracking", included: true },
                            { text: "Goal Completion Tracker", included: true },
                            { text: "Stock and Financial Intelligence Feed", included: true },
                            { text: "Standard Scenario Simulator (3/day)", included: true },
                            { text: "Unlimited Scenario Simulator", included: false },
                            { text: "Full 6-Tool Interactive AI Suite", included: false },
                        ]}
                    />
                    
                    <PricingCard 
                        title="Twin Premium"
                        priceUnit="500 COINS"
                        subPrice="Lifetime Unlock"
                        neonColor="text-cyberPink"
                        isPopular={true}
                        badge="100% FREE VIA COINS"
                        description="Earn 500 Twin Coins through natural activity to permanently unlock the complete 6-tool suite."
                        delay={0.2}
                        buttonText={user?.isPremium ? "OPEN PREMIUM SUITE" : (token ? "UNLOCK WITH COINS" : "LOGIN TO UNLOCK")}
                        buttonLink={token ? "/premium" : "/login"}
                        features={[
                            { text: "1. Unlimited Custom Scenario Simulator", included: true },
                            { text: "2. Advanced Cognitive Bias Matrix", included: true },
                            { text: "3. Weekly AI Diagnostic Summary Engine", included: true },
                            { text: "4. Habit-to-Decision Telemetry Matrix", included: true },
                            { text: "5. Future Self Trajectory Forecaster", included: true },
                            { text: "6. Interactive AI Coach Console", included: true },
                            { text: "Permanent Lifetime Access (No Subscription)", included: true },
                        ]}
                    />

                    <PricingCard 
                        title="System Admin"
                        priceUnit="ADMIN"
                        subPrice="Role-Based"
                        neonColor="text-cyberBlue"
                        description="Administrative management, user analytics, coin adjustments, and system broadcasts."
                        delay={0.3}
                        buttonText={token ? "ADMIN DASHBOARD" : "ADMIN AUTH"}
                        buttonLink={token ? "/admin" : "/login"}
                        features={[
                            { text: "Full Admin Management Hub", included: true },
                            { text: "Live User Telemetry and Search", included: true },
                            { text: "Twin Coin Leaderboard and Adjustments", included: true },
                            { text: "Global Broadcast and Alerts Dispatch", included: true },
                            { text: "System Integrity and Security Center", included: true },
                            { text: "User Moderation with Confirmation Modal", included: true },
                            { text: "Real-time Message Activity (24H)", included: true },
                        ]}
                    />
                </div>

                <div className="max-w-6xl mx-auto mb-20">
                    <div className="text-center mb-10">
                        <span className="font-orbitron text-xs text-cyberPink tracking-widest uppercase block mb-2 font-bold flex items-center justify-center gap-2">
                            <Award size={16} /> THE 6-TOOL EXECUTIVE SUITE
                        </span>
                        <h2 className="text-2xl md:text-4xl font-orbitron font-black text-white uppercase">
                            WHAT UNLOCKS AT <span className="text-cyberNeon">500 TWIN COINS</span>
                        </h2>
                        <p className="text-gray-400 font-inter text-sm max-w-xl mx-auto mt-2">
                            All 6 tools run live on your authenticated dashboard with personalized AI recommendations.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SIX_TOOLS.map((tool, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.07 }}
                                className={`glass-panel p-6 rounded-2xl border ${tool.border} bg-[#0a050d] hover:scale-[1.02] transition-transform`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tool.bg}`}>
                                        <tool.icon size={22} className={tool.color} />
                                    </div>
                                    <span className="text-xs font-orbitron font-bold text-gray-500">TOOL {tool.number}</span>
                                </div>
                                <h3 className="font-orbitron font-bold text-white text-base mb-2 uppercase">{tool.title}</h3>
                                <p className="text-gray-400 font-inter text-xs leading-relaxed">{tool.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto glass-panel p-8 md:p-10 rounded-3xl border border-white/10 bg-[#0a050d]">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        <div>
                            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block mb-1 font-bold">
                                NO REAL MONEY REQUIRED
                            </span>
                            <h3 className="text-2xl font-orbitron font-bold text-white uppercase">HOW TO EARN TWIN COINS</h3>
                            <p className="text-gray-400 text-sm font-inter mt-1">
                                Twin Coins are rewarded through regular, positive habits within your Digital Twin.
                            </p>
                        </div>
                        <Link 
                            to={token ? "/dashboard" : "/register"}
                            className="px-6 py-3 bg-cyberNeon text-black font-orbitron font-bold text-xs tracking-wider rounded-xl hover:bg-white transition-all whitespace-nowrap"
                        >
                            {token ? "GO TO DASHBOARD" : "GET STARTED FREE"}
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {COIN_ACTIVITIES.map((act, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                <span className="text-gray-400 text-xs font-inter block mb-1">{act.name}</span>
                                <span className="text-cyberNeon font-orbitron font-bold text-sm block mb-1">{act.coins}</span>
                                <span className="text-gray-500 font-mono text-[10px] block">{act.freq}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Pricing;
