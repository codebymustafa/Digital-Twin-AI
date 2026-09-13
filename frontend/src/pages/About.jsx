import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ArrowRight, Code2, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <div className="min-h-screen pt-32 pb-40 px-6 relative z-10 w-full bg-[#050308] overflow-hidden">
            <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
                <div className="w-full h-full bg-[radial-gradient(circle_at_50%_20%,_var(--tw-gradient-stops))] from-cyberNeon/20 via-transparent to-transparent"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-16"
                >
                    <span className="font-orbitron text-cyberPink tracking-[0.4em] uppercase mb-4 block font-bold text-sm drop-shadow-[0_0_10px_#ff007f]">
                        ORIGIN STORY & CREDITS
                    </span>
                    <h1 className="text-5xl md:text-7rem font-orbitron font-black text-white mb-6 uppercase tracking-tighter drop-shadow-[0_0_40px_rgba(0,229,255,0.3)]">
                        THE BLUEPRINT
                    </h1>
                    <p className="text-gray-400 font-inter max-w-2xl mx-auto text-lg leading-relaxed">
                        No corporate fluff here. Just the raw backstory of how Jasir Ali Khan and M. Mustafa built Digital Twin AI from a late-night spark into a full-scale cognitive engine.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="glass-panel p-10 md:p-16 rounded-[3rem] border border-cyberNeon/30 bg-[#0a050d]/90 backdrop-blur-2xl space-y-8 shadow-[0_0_80px_rgba(0,229,255,0.1)] relative"
                >
                    <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                        <div className="p-3 rounded-2xl bg-cyberNeon/10 border border-cyberNeon/30 text-cyberNeon">
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h2 className="font-orbitron font-bold text-xl text-white">THE BLUEPRINT ARCHITECTS</h2>
                            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Jasir Ali Khan × M. Mustafa</p>
                        </div>
                    </div>

                    <div className="font-inter text-gray-300 text-lg leading-relaxed space-y-6">
                        <p>
                            <span className="text-4xl font-orbitron text-cyberNeon float-left mr-3 mt-1 font-black">I</span>t all started when <strong className="text-cyberPink font-orbitron">Jasir Ali Khan</strong> dropped the initial idea: <em className="text-white">"What if everyone had an intelligent AI clone to offload decision fatigue, track cognitive clarity, and handle daily brain fog?"</em> He pitched the vision, and <strong className="text-white font-orbitron">M. Mustafa</strong> locked in immediately—both agreed this was the future.
                        </p>

                        <p>
                            <strong className="text-cyberPink font-orbitron">Jasir Ali Khan</strong> jumped straight into action, designing the core UI/UX and frontend vibe. He built the entire aesthetic theme, sleek dark mode glassmorphism, responsive navigation bar, footer, styling tokens, and 50% of the User Dashboard interface. Every smooth animation, glowing cyberpunk layout, and modern component visual owes its polish to Jasir's frontend mastery.
                        </p>

                        <p>
                            Simultaneously, <strong className="text-white font-orbitron">M. Mustafa</strong> took full charge of the backend engine and overall system architecture. He built the complete REST API network, integrated the real-time AI Twin chatbot models, managed database schemas, implemented session security & auth, and crafted the end-to-end user experience logic that brings the application to life.
                        </p>

                        <p>
                            Together, <strong className="text-cyberPink font-orbitron">Jasir Ali Khan</strong> and <strong className="text-white font-orbitron">M. Mustafa</strong> turned a bold concept into **Digital Twin AI**—a state-of-the-art cognitive partner engineered for real-time clarity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-white/10">
                        <div className="p-6 rounded-2xl bg-white/5 border border-cyberPink/30 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-cyberPink/20 flex items-center justify-center font-orbitron font-black text-cyberPink text-lg border border-cyberPink/40 shrink-0">
                                <Code2 size={22} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-orbitron font-bold text-white text-lg">Jasir Ali Khan</h4>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <span className="px-2.5 py-1 rounded-md bg-cyberPink/20 text-cyberPink font-mono text-[11px] font-bold border border-cyberPink/30 uppercase">Co-Founder</span>
                                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-gray-300 font-mono text-[11px] border border-white/10">Lead UI/UX & Frontend Architect</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-cyberNeon/30 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-cyberNeon/20 flex items-center justify-center font-orbitron font-black text-cyberNeon text-lg border border-cyberNeon/40 shrink-0">
                                <Cpu size={22} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-orbitron font-bold text-white text-lg">M. Mustafa</h4>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <span className="px-2.5 py-1 rounded-md bg-cyberNeon/20 text-cyberNeon font-mono text-[11px] font-bold border border-cyberNeon/30 uppercase">Co-Founder</span>
                                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-gray-300 font-mono text-[11px] border border-white/10">AI & Systems Lead Architect</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="text-center mt-16">
                    <Link to="/register" className="inline-flex items-center gap-3 px-10 py-5 bg-cyberNeon text-black font-orbitron font-black rounded-2xl hover:bg-white transition-all shadow-[0_0_30px_rgba(0,229,255,0.4)] text-lg">
                        LAUNCH YOUR TWIN <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default About;


