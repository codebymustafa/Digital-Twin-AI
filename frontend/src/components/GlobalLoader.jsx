import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

const GlobalLoader = ({ children }) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <AnimatePresence>
                {loading && (
                    <motion.div 
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="fixed inset-0 z-[100000] bg-cyberBg flex flex-col items-center justify-center overflow-hidden"
                    >
                        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255, 90, 0, 0.2) 1px, transparent 1px)', backgroundSize: '100% 4px' }} />
                        
                        <motion.div 
                            animate={{ y: ['-100vh', '100vh'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-transparent to-cyberNeon/50 z-10"
                        />

                        <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
                            className="relative z-20 flex flex-col items-center"
                        >
                            <div className="relative">
                                <BrainCircuit size={100} className="text-cyberNeon" />
                                <BrainCircuit size={100} className="text-cyberPink absolute inset-0 blur-sm animate-pulse" />
                            </div>
                            
                            <div className="mt-8 font-orbitron text-cyberNeon tracking-[0.3em] uppercase text-xl flex flex-col items-center gap-2">
                                <span>Scanning Neural Map</span>
                                <div className="flex gap-1">
                                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }}>.</motion.span>
                                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}>.</motion.span>
                                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.6 }}>.</motion.span>
                                </div>
                            </div>
                            <div className="w-64 h-2 bg-cyberDark mt-8 rounded-full overflow-hidden border border-cyberNeon/30">
                                <motion.div 
                                    className="h-full bg-cyberNeon"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2.2, ease: "easeInOut" }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {!loading && children}
        </>
    );
};

export default GlobalLoader;
