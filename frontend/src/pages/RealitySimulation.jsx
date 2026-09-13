import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Cpu } from 'lucide-react';

const RealitySimulation = () => {
    const [scenario, setScenario] = useState('');
    const [simulating, setSimulating] = useState(false);
    const [result, setResult] = useState(null);

    const data = [
        { year: '2025', optionA: 10, optionB: 10 },
        { year: '2026', optionA: 20, optionB: 15 },
        { year: '2027', optionA: 40, optionB: 25 },
        { year: '2028', optionA: 60, optionB: 50 },
        { year: '2029', optionA: 75, optionB: 80 },
        { year: '2030', optionA: 95, optionB: 120 },
    ];

    const handleSimulate = (e) => {
        e.preventDefault();
        if(!scenario) return;
        setSimulating(true);
        setResult(null);
        
        setTimeout(() => {
            setSimulating(false);
            setResult({
                title: "Simulation Complete: " + scenario,
                analysis: "Based on your risk profile and logic vectors, Option A provides stable growth but Option B scales exponentially if initial resistance is overcome."
            });
        }, 3000);
    }

    return (
        <div className="min-h-screen p-8 text-white relative flex flex-col items-center">
            <Link to="/dashboard" className="absolute top-8 left-8 text-cyberNeon flex items-center gap-2 hover:text-white transition-colors">
                <ArrowLeft /> <span className="font-orbitron tracking-widest text-sm">Return</span>
            </Link>

            <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl text-cyberPink font-orbitron neon-text mb-2 text-center"
            >
                Reality Simulator
            </motion.h1>
            <p className="text-gray-400 font-inter mb-10">Predicting multiversal outcome vectors based on digital clone DNA</p>

            <form onSubmit={handleSimulate} className="w-full max-w-3xl flex gap-4 mb-10">
                <input 
                    type="text" 
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="Enter collision scenario (e.g., Job vs Startup, Relocate vs Stay)"
                    className="flex-1 bg-cyberDark/50 border border-cyberBlue p-4 rounded-xl text-lg outline-none focus:border-cyberPink font-inter transition-all"
                />
                <button 
                  type="submit"
                  disabled={simulating || !scenario}
                  className="bg-cyberPink text-cyberDark font-orbitron px-8 py-4 rounded-xl font-bold hover:bg-white transition-all neon-glow-pink disabled:opacity-50"
                >
                    {simulating ? 'Processing...' : 'Run Simulation'}
                </button>
            </form>

            <AnimatePresence>
                {simulating && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 text-cyberNeon"
                    >
                        <Cpu className="animate-spin text-cyberPink" size={40} />
                        <span className="font-orbitron tracking-widest animate-pulse">Calculating Temporal Timelines...</span>
                    </motion.div>
                )}

                {result && (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full max-w-5xl glass-panel p-8 rounded-3xl"
                    >
                        <h2 className="text-2xl font-orbitron text-cyberNeon mb-4">{result.title}</h2>
                        <p className="text-gray-300 font-inter leading-relaxed mb-8">{result.analysis}</p>

                        <div className="h-80 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2833" />
                                    <XAxis dataKey="year" stroke="#45a29e" />
                                    <YAxis stroke="#45a29e" />
                                    <Tooltip contentStyle={{ backgroundColor: '#0b0c10', borderColor: '#ff00ff', borderRadius: '10px' }} />
                                    <Area type="monotone" dataKey="optionA" stroke="#66fcf1" fill="#66fcf1" fillOpacity={0.5} name="Option A (Traditional)" />
                                    <Area type="monotone" dataKey="optionB" stroke="#ff00ff" fill="#ff00ff" fillOpacity={0.5} name="Option B (High Risk)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default RealitySimulation;
