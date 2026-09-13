import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, X, BellOff, Volume2 } from 'lucide-react';

const FocusMode = ({ onClose }) => {
    const [phase, setPhase] = useState('Inhale');
    const [counter, setCounter] = useState(4);

    useEffect(() => {
        const timer = setInterval(() => {
            setCounter(c => {
                if (c === 1) {
                    if (phase === 'Inhale') { setPhase('Hold'); return 4; }
                    if (phase === 'Hold') { setPhase('Exhale'); return 4; }
                    if (phase === 'Exhale') { setPhase('Stay'); return 4; }
                    setPhase('Inhale'); return 4;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-[#050308]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-white"
        >
            <button onClick={onClose} className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <X size={24} />
            </button>

            <div className="text-center mb-12">
                <div className="flex justify-center mb-4 text-cyberNeon">
                    <Wind size={40} className="animate-pulse" />
                </div>
                <h1 className="font-orbitron text-2xl font-black tracking-widest mb-2 uppercase">Neural Recalibration</h1>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">Box Breathing Active</p>
            </div>

            <div className="relative flex items-center justify-center mb-12">
                <motion.div 
                    animate={{ 
                        scale: phase === 'Inhale' ? 1.5 : phase === 'Exhale' ? 1 : phase === 'Hold' ? 1.5 : 1,
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                    className="w-64 h-64 rounded-full border-4 border-cyberNeon/20 absolute"
                />
                <motion.div 
                    animate={{ 
                        scale: phase === 'Inhale' ? 1.2 : phase === 'Exhale' ? 0.8 : phase === 'Hold' ? 1.2 : 0.8,
                    }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                    className="w-48 h-48 rounded-full bg-gradient-to-tr from-cyberNeon/20 to-cyberPink/20 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(102,252,241,0.2)]"
                >
                    <div className="text-5xl font-orbitron font-black mb-1">{counter}</div>
                    <div className="text-[10px] font-mono tracking-[0.5em] uppercase text-gray-400">{phase}</div>
                </motion.div>
            </div>

            <div className="max-w-md w-full grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                    <BellOff size={18} className="text-gray-500" />
                    <span className="text-[10px] font-mono text-gray-400 uppercase">Silent Mode</span>
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                    <Volume2 size={18} className="text-gray-500" />
                    <span className="text-[10px] font-mono text-gray-400 uppercase">Binaural Beats</span>
                </div>
            </div>

            <p className="mt-12 text-gray-600 text-[10px] font-inter uppercase tracking-widest text-center max-w-sm leading-relaxed">
                "Logic requires a calm vessel. By regulating your breath, you reset your nervous system for peak cognitive performance."
            </p>
        </motion.div>
    );
};

export default FocusMode;
