import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitFork, ArrowRight, Brain, AlertTriangle, CheckCircle, Info, ArrowLeft } from 'lucide-react';

const ScenarioSimulator = ({ onBack }) => {
    const [scenarios, setScenarios] = useState({
        A: '',
        B: ''
    });
    const [result, setResult] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const handleSimulate = async () => {
        if (!scenarios.A || !scenarios.B) return;
        setIsSimulating(true);
        setResult(null);

        try {
            const token = sessionStorage.getItem('token');
            const user = (() => { try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; } })();
            
            const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
            const todayMood = moodHistory[0]?.mood?.id || 'neutral';
            const todayEnergy = moodHistory[0]?.answers?.energy || 'Moderate ⚡';

            const res = await fetch('http://localhost:5000/api/ai/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    optionA: scenarios.A,
                    optionB: scenarios.B,
                    userPersonality: {
                        riskTaking: user?.personality?.riskTaking ?? 50,
                        goals: user?.personality?.goals ?? [],
                        interests: user?.personality?.interests ?? [],
                        introvertExtrovert: user?.personality?.introvertExtrovert ?? 50,
                    },
                    todayMood,
                    todayEnergy,
                })
            });

            if (!res.ok) {
                throw new Error('Simulation API request failed.');
            }

            const data = await res.json();
            setResult({
                winner: data.winner,
                scoreA: data.scoreA,
                scoreB: data.scoreB,
                reason: (data.reason || '').replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/[*_#`]/g, '').trim()
            });

            try {
                const rewardRes = await fetch('http://localhost:5000/api/auth/reward', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({ action: 'scenario_run' })
                });
                if (rewardRes.ok) {
                    const rewardData = await rewardRes.json();
                    if (rewardData.user) {
                        sessionStorage.setItem('user', JSON.stringify(rewardData.user));
                        window.dispatchEvent(new Event('twin-data-updated'));
                    }
                }
            } catch (e) {
            }
        } catch (err) {
            console.error('Simulation error:', err);
            const evaluateLocal = (text) => {
                const t = text.toLowerCase();
                let score = 50;
                ['study', 'learn', 'work', 'save', 'invest', 'sleep', 'exercise', 'health', 'prepare', 'career', 'budget', 'plan', 'long-term', 'research', 'calm', 'patience'].forEach(w => { if (t.includes(w)) score += 12; });
                ['gamble', 'yolo', 'all in', 'impulsive', 'ignore', 'spend all', 'quit without', 'lazy', 'procrastinate', 'rush', 'angry', 'fomo'].forEach(w => { if (t.includes(w)) score -= 15; });
                return Math.max(10, Math.min(95, score));
            };
            const rawA = evaluateLocal(scenarios.A);
            const rawB = evaluateLocal(scenarios.B);
            const total = Math.max(1, rawA + rawB);
            let sA = Math.round((rawA / total) * 100);
            sA = Math.min(88, Math.max(12, sA));
            const sB = 100 - sA;
            const fallbackWinner = sA >= sB ? 'A' : 'B';
            setResult({
                winner: fallbackWinner,
                scoreA: sA,
                scoreB: sB,
                reason: `Path ${fallbackWinner === 'A' ? 'Alpha' : 'Beta'} scores higher (${fallbackWinner === 'A' ? sA : sB}% vs ${fallbackWinner === 'A' ? sB : sA}%). It provides greater stability and strategic alignment with your goals.`
            });
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="glass-panel p-8 rounded-3xl border border-cyberBlue/20 bg-[#0a050d] h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="text-gray-500 hover:text-cyberBlue text-sm font-mono bg-[#120b18] px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft size={13} /> Back
                        </button>
                    )}
                    <div>
                        <h2 className="font-orbitron text-xl text-white font-bold flex items-center gap-2">
                            <GitFork className="text-cyberBlue" /> Scenario Simulator
                        </h2>
                        <p className="text-gray-500 text-xs font-mono mt-1 uppercase">Quantum Path Analysis</p>
                    </div>
                </div>
                <div className="p-2 rounded-full bg-white/5 border border-white/10 group cursor-help">
                    <Info size={14} className="text-gray-500 group-hover:text-cyberBlue" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative">
                <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[2px] bg-white/10" />

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-mono text-cyberBlue uppercase tracking-widest">Path Alpha</span>
                        {result && result.winner === 'A' && <span className="text-[10px] bg-cyberBlue/10 text-cyberBlue px-2 py-0.5 rounded border border-cyberBlue/30">LOGICAL WINNER</span>}
                    </div>
                    <textarea 
                        value={scenarios.A} 
                        onChange={(e) => setScenarios({...scenarios, A: e.target.value})}
                        placeholder="Ex: Stay at current job and ask for a raise..."
                        className="w-full h-32 bg-[#120b18] border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-cyberBlue/50 transition-all resize-none"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-mono text-cyberPink uppercase tracking-widest">Path Beta</span>
                        {result && result.winner === 'B' && <span className="text-[10px] bg-cyberPink/10 text-cyberPink px-2 py-0.5 rounded border border-cyberPink/30">LOGICAL WINNER</span>}
                    </div>
                    <textarea 
                        value={scenarios.B} 
                        onChange={(e) => setScenarios({...scenarios, B: e.target.value})}
                        placeholder="Ex: Resign and start a freelance agency..."
                        className="w-full h-32 bg-[#120b18] border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-cyberPink/50 transition-all resize-none"
                    />
                </div>
            </div>

            <button 
                onClick={handleSimulate}
                disabled={isSimulating || !scenarios.A || !scenarios.B}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyberBlue to-cyberPink text-black font-orbitron font-black text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale mb-8 overflow-hidden relative"
            >
                {isSimulating ? (
                    <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-white/30" />
                ) : null}
                {isSimulating ? 'PROCESSORS OVERCLOCKED...' : 'INITIALIZE SIMULATION'}
            </button>

            <AnimatePresence>
                {result && !isSimulating && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="flex-1 bg-white/2 rounded-2xl p-6 border border-white/5"
                    >
                        <h3 className="font-mono text-xs text-cyberBlue font-bold mb-4 flex items-center gap-2">
                             TWIN VERDICT:
                        </h3>
                        <p className="text-gray-300 text-sm font-inter leading-relaxed mb-6">
                            {result.reason}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`bg-[#120b18] p-3 rounded-xl border ${result.winner === 'A' ? 'border-cyberBlue/40' : 'border-white/5'}`}>
                                <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase flex items-center gap-1">
                                    Path A Evaluation (100% Total) {result.winner === 'A' && <CheckCircle size={10} className="text-cyberBlue" />}
                                </div>
                                <div className={`text-xl font-orbitron ${result.winner === 'A' ? 'text-cyberBlue' : 'text-white'}`}>{result.scoreA}%</div>
                                <div className="w-full h-1 bg-[#0a050d] rounded-full mt-2 overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${result.scoreA}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-cyberBlue" />
                                </div>
                            </div>
                            <div className={`bg-[#120b18] p-3 rounded-xl border ${result.winner === 'B' ? 'border-cyberPink/40' : 'border-white/5'}`}>
                                <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase flex items-center gap-1">
                                    Path B Evaluation (100% Total) {result.winner === 'B' && <CheckCircle size={10} className="text-cyberPink" />}
                                </div>
                                <div className={`text-xl font-orbitron ${result.winner === 'B' ? 'text-cyberPink' : 'text-white'}`}>{result.scoreB}%</div>
                                <div className="w-full h-1 bg-[#0a050d] rounded-full mt-2 overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${result.scoreB}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-cyberPink" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScenarioSimulator;
