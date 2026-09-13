import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Info, Zap, Shield, Target, Compass } from 'lucide-react';

const computePersonality = () => {
    const decisions = JSON.parse(localStorage.getItem('decisionJournal') || '[]');
    const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
    const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');

    if (decisions.length === 0 && goals.length === 0) {
        return {
            type: 'The Blank Slate',
            label: 'NEURAL INITIALIZATION',
            icon: Fingerprint,
            color: '#ffffff',
            desc: 'Interact with your journal and goals to reveal your twin\'s core identity. Every decision you log shapes who your Digital Twin becomes.',
            traits: ['Analyzing...', 'Awaiting Data', 'Stable']
        };
    }

    const riskCount = decisions.filter(d => d.type === 'Finance').length;
    const workCount = goals.filter(g => g.category === 'Career').length;
    const logicAvg = decisions.length > 0
        ? decisions.reduce((acc, d) => acc + (d.rating?.score || 3), 0) / decisions.length
        : 0;
    const stressCount = moodHistory.filter(m => m.mood?.id === 'stressed' || m.mood?.id === 'bad').length;
    const calmCount = moodHistory.filter(m => m.mood?.id === 'great' || m.mood?.id === 'good').length;
    const completedGoals = goals.filter(g => g.completed).length;
    const streak = parseInt(localStorage.getItem('currentStreak') || '0');

    if (logicAvg >= 4 && decisions.length >= 3) {
        return {
            type: 'The Strategist',
            label: 'HIGH LOGIC SYNC',
            icon: Target,
            color: '#00e5ff',
            desc: `Your twin operates with precision. Emotional bias is low (avg score ${logicAvg.toFixed(1)}/5), and long-term planning is your greatest strength. ${completedGoals > 0 ? `${completedGoals} goal${completedGoals > 1 ? 's' : ''} completed confirms this.` : ''}`,
            traits: ['Logical', 'Patient', 'Calculated']
        };
    } else if (riskCount > 2 || (goals.some(g => g.category === 'Finance') && decisions.some(d => d.emotion === 'excited'))) {
        return {
            type: 'The High Roller',
            label: 'RISK TOLERANCE PEAK',
            icon: Zap,
            color: '#ff5a00',
            desc: `Your twin isn't afraid to bet big. ${riskCount} finance-related decision${riskCount !== 1 ? 's' : ''} detected. While growth is fast, watch out for financial burnout.`,
            traits: ['Bold', 'Impulsive', 'Ambitious']
        };
    } else if (workCount > 2 || completedGoals > 3) {
        return {
            type: 'The Architect',
            label: 'CONSTRUCTION MODE',
            icon: Shield,
            color: '#a200ff',
            desc: `You are building a future with solid foundations. ${workCount} career goals logged. Goal completion rate is strong${completedGoals > 0 ? ` — ${completedGoals} done` : ''}. Your goal density is in the top 10%.`,
            traits: ['Persistent', 'Visionary', 'Focus']
        };
    } else if (stressCount > calmCount && stressCount > 1) {
        return {
            type: 'The Overcomer',
            label: 'RESILIENCE MODE',
            icon: Shield,
            color: '#f59e0b',
            desc: `You've been facing tough days (${stressCount} stressed check-ins), yet you keep logging decisions and goals. That is resilience in action. Your twin sees the pattern — push through.`,
            traits: ['Resilient', 'Grounded', 'Fighter']
        };
    } else if (streak >= 5) {
        return {
            type: 'The Consistent One',
            label: 'STREAK MASTER',
            icon: Target,
            color: '#22c55e',
            desc: `${streak}-day streak detected. Consistency is your superpower. Your twin has learned your patterns well — the habit loop is forming strongly.`,
            traits: ['Disciplined', 'Steady', 'Reliable']
        };
    } else {
        return {
            type: 'The Explorer',
            label: 'HYBRID COGNITION',
            icon: Compass,
            color: '#22c55e',
            desc: 'Balanced and curious. You are testing different life paths to find the most efficient trajectory. Keep logging your decisions to refine your twin\'s accuracy.',
            traits: ['Adaptive', 'Curious', 'Evolving']
        };
    }
};

const TwinPersonality = ({ refreshKey }) => {
    const [personality, setPersonality] = useState(() => computePersonality());

    useEffect(() => {
        setPersonality(computePersonality());
    }, [refreshKey]);

    useEffect(() => {
        const handleStorage = () => {
            setPersonality(computePersonality());
        };
        window.addEventListener('storage', handleStorage);
        window.addEventListener('twin-data-updated', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('twin-data-updated', handleStorage);
        };
    }, []);

    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-[#0a050d] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                <Info size={16} className="text-gray-500 cursor-help" />
            </div>
            
            <div 
                className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000"
                style={{ background: `radial-gradient(circle at 50% 50%, ${personality.color} 0%, transparent 70%)` }}
            />

            <div className="flex flex-col items-center text-center relative z-10">
                <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-1000 rotate-3 group-hover:rotate-0"
                    style={{ backgroundColor: `${personality.color}15`, border: `1px solid ${personality.color}40`, boxShadow: `0 0 20px ${personality.color}20` }}
                >
                    <personality.icon size={32} style={{ color: personality.color }} className="animate-pulse" />
                </div>

                <h3 className="font-orbitron font-black text-white text-lg tracking-widest mb-1 italic">
                    {personality.type}
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: personality.color }}>
                    {personality.label}
                </span>

                <p className="text-gray-400 text-xs font-inter leading-relaxed mb-6 px-4">
                    {personality.desc}
                </p>

                <div className="flex gap-2 flex-wrap justify-center">
                    {personality.traits.map((trait, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-500 text-[10px] font-mono uppercase tracking-widest">
                            {trait}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TwinPersonality;
