import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, X, Shield, Clock, AlertTriangle } from 'lucide-react';

const OverthinkinShield = () => {
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const check = () => {
            const hour = new Date().getHours();
            const isDismissedToday = localStorage.getItem('shieldDismissed') === new Date().toDateString();
            const isNightTime = hour >= 22 || hour < 5;
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            if (isNightTime && !isDismissedToday && !dismissed) {
                setShow(true);
            }
        };
        check();
        const interval = setInterval(check, 60000);
        return () => clearInterval(interval);
    }, [dismissed]);

    const handleDismiss = () => {
        localStorage.setItem('shieldDismissed', new Date().toDateString());
        setDismissed(true);
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-6 left-6 z-[1600] max-w-sm"
                >
                    <div className="bg-[#0a050d] border border-[#a200ff]/60 rounded-2xl p-5 shadow-[0_0_40px_rgba(162,0,255,0.4)]">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#a200ff]/20 flex items-center justify-center flex-shrink-0">
                                <Moon size={20} className="text-[#a200ff]" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-orbitron font-bold text-[#a200ff] text-sm">🛡️ Overthinking Shield</h3>
                                    <button onClick={handleDismiss} className="text-gray-600 hover:text-white ml-2"><X size={16} /></button>
                                </div>
                                <p className="text-xs font-mono text-gray-400 mt-1 mb-3">It's {currentTime} — late night detected</p>
                                <p className="text-gray-300 text-xs font-inter leading-relaxed mb-4">
                                    Your brain is in <span className="text-[#a200ff] font-bold">low-logic mode</span> right now. Studies show decisions made after 10 PM have a <span className="text-red-400">70% higher regret rate</span>. I recommend saving all big decisions for tomorrow morning.
                                </p>
                                <div className="bg-[#120b18] rounded-xl p-3 border border-[#a200ff]/20 mb-4">
                                    <p className="text-xs font-mono text-[#a200ff] mb-1">Tonight, only allow yourself to:</p>
                                    <ul className="text-xs text-gray-400 space-y-1">
                                        <li>✅ Chat with your Twin for clarity</li>
                                        <li>✅ Write in your Decision Journal</li>
                                        <li>✅ Review your goals</li>
                                        <li>❌ Make major financial decisions</li>
                                        <li>❌ Send angry messages</li>
                                        <li>❌ Quit or resign anything</li>
                                    </ul>
                                </div>
                                <button onClick={handleDismiss}
                                    className="w-full bg-[#a200ff] text-white font-orbitron text-xs font-bold py-2 rounded-lg hover:bg-white hover:text-black transition-all">
                                    I Understand — Rest Mode Activated
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OverthinkinShield;
