import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, CheckCircle, Circle, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORIES = ['Career', 'Health', 'Finance', 'Relationships', 'Learning', 'Personal'];

const GoalTracker = ({ onUpdate }) => {
    const [goals, setGoals] = useState(() => {
        try { return JSON.parse(localStorage.getItem('userGoals') || '[]'); } catch { return []; }
    });
    const [showAdd, setShowAdd] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: '', category: 'Career', deadline: '', steps: [''] });

    const saveGoals = async (updated) => {
        setGoals(updated);
        localStorage.setItem('userGoals', JSON.stringify(updated));
        if (onUpdate) onUpdate();

        try {
            const token = sessionStorage.getItem('token');
            if (token) {
                await fetch('http://localhost:5000/api/auth/goals', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ goals: updated })
                });
            }
        } catch (err) {
            console.error("Failed to sync goals to backend database:", err);
        }
    };

    const addGoal = () => {
        if (!newGoal.title.trim()) return;
        const goal = {
            id: Date.now(),
            ...newGoal,
            steps: newGoal.steps.filter(s => s.trim()).map(s => ({ text: s, done: false })),
            createdAt: new Date().toDateString(),
            completed: false,
        };
        saveGoals([goal, ...goals]);
        setNewGoal({ title: '', category: 'Career', deadline: '', steps: [''] });
        setShowAdd(false);
    };

    const toggleStep = async (goalId, stepIdx) => {
        let isNewlyCompleted = false;
        const updated = goals.map(g => {
            if (g.id !== goalId) return g;
            const steps = g.steps.map((s, i) => i === stepIdx ? { ...s, done: !s.done } : s);
            const completed = steps.every(s => s.done);
            if (completed && !g.completed) {
                isNewlyCompleted = true;
            }
            return { ...g, steps, completed };
        });
        await saveGoals(updated);

        if (isNewlyCompleted) {
            try {
                const token = sessionStorage.getItem('token');
                if (token) {
                    const rewardRes = await fetch('http://localhost:5000/api/auth/reward', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ action: 'goal_completed', goalId: String(goalId) })
                    });
                    if (rewardRes.ok) {
                        const rewardData = await rewardRes.json();
                        if (rewardData.user) {
                            sessionStorage.setItem('user', JSON.stringify(rewardData.user));
                            window.dispatchEvent(new Event('twin-data-updated'));
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to claim goal completion reward:", e);
            }
        }
    };

    const deleteGoal = (goalId) => saveGoals(goals.filter(g => g.id !== goalId));

    const completedCount = goals.filter(g => g.completed).length;
    const colors = { Career: '#ff5a00', Health: '#22c55e', Finance: '#00e5ff', Relationships: '#a200ff', Learning: '#f59e0b', Personal: '#ec4899' };

    return (
        <div className="glass-panel rounded-2xl border border-[#ff5a00]/20 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <div>
                    <h3 className="font-orbitron text-white font-bold flex items-center gap-2">
                        <Target size={18} className="text-[#ff5a00]" /> My Goals
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">{completedCount}/{goals.length} completed</p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 text-xs font-mono bg-[#ff5a00]/15 border border-[#ff5a00]/30 text-[#ff5a00] px-3 py-1.5 rounded-lg hover:bg-[#ff5a00] hover:text-black transition-all">
                    <Plus size={14} /> Add Goal
                </button>
            </div>

            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-white/5 bg-[#0a050d]">
                        <div className="p-5 space-y-4">
                            <input value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                placeholder="What is your goal? e.g. Learn React in 30 days"
                                className="w-full bg-[#120b18] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ff5a00]/50 font-inter" />
                            <div className="grid grid-cols-2 gap-3">
                                <select value={newGoal.category} onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                                    className="bg-[#120b18] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none font-inter">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input type="date" value={newGoal.deadline} onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    className="bg-[#120b18] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none font-inter" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-gray-500 text-xs font-mono">Break it into small steps:</label>
                                {newGoal.steps.map((step, idx) => (
                                    <input key={idx} value={step} onChange={e => { const s = [...newGoal.steps]; s[idx] = e.target.value; setNewGoal({ ...newGoal, steps: s }); }}
                                        placeholder={`Step ${idx + 1}...`}
                                        className="w-full bg-[#120b18] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none font-inter" />
                                ))}
                                <button onClick={() => setNewGoal({ ...newGoal, steps: [...newGoal.steps, ''] })}
                                    className="text-xs text-gray-500 hover:text-white font-mono flex items-center gap-1">
                                    <Plus size={12} /> Add step
                                </button>
                            </div>
                            <button onClick={addGoal} className="w-full bg-[#ff5a00] text-black font-orbitron font-bold py-3 rounded-xl hover:bg-white transition-all text-sm">
                                Save Goal
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {goals.length === 0 && (
                    <div className="p-8 text-center text-gray-500 font-inter text-sm">
                        <Target size={32} className="mx-auto mb-3 opacity-30" />
                        No goals yet. Add your first goal to get started!
                    </div>
                )}
                {goals.map(goal => {
                    const progress = goal.steps.length > 0 ? Math.round((goal.steps.filter(s => s.done).length / goal.steps.length) * 100) : 0;
                    const color = colors[goal.category] || '#ff5a00';
                    return (
                        <div key={goal.id} className={`p-5 ${goal.completed ? 'opacity-60' : ''}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color, backgroundColor: `${color}20` }}>{goal.category}</span>
                                        {goal.completed && <span className="text-xs font-mono text-green-400 flex items-center gap-1"><Trophy size={10} /> Done!</span>}
                                        {goal.deadline && <span className="text-xs font-mono text-gray-500">📅 {goal.deadline}</span>}
                                    </div>
                                    <h4 className={`font-inter font-semibold text-sm ${goal.completed ? 'line-through text-gray-500' : 'text-white'}`}>{goal.title}</h4>
                                </div>
                                <button onClick={() => deleteGoal(goal.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-3">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="mb-3">
                                <div className="flex justify-between text-xs font-mono mb-1">
                                    <span className="text-gray-500">Progress</span>
                                    <span style={{ color }}>{progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#120b18] rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }}
                                        className="h-full rounded-full" style={{ backgroundColor: color }} />
                                </div>
                            </div>
                            {goal.steps.length > 0 && (
                                <div className="space-y-1.5">
                                    {goal.steps.map((step, idx) => (
                                        <button key={idx} onClick={() => toggleStep(goal.id, idx)}
                                            className="w-full flex items-center gap-2 text-xs font-inter text-left hover:text-white transition-colors">
                                            {step.done ? <CheckCircle size={14} className="text-green-400 flex-shrink-0" /> : <Circle size={14} className="text-gray-600 flex-shrink-0" />}
                                            <span className={step.done ? 'line-through text-gray-500' : 'text-gray-300'}>{step.text}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GoalTracker;
