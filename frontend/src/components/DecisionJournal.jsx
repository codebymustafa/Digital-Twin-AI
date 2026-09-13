import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Star, Clock, Trash2 } from 'lucide-react';

const DECISION_TYPES = ['Career', 'Finance', 'Health', 'Relationships', 'Social', 'Learning', 'Other'];

const getTwinRating = (decision, outcome) => {
    const text = (decision + ' ' + outcome).toLowerCase();
    if (text.match(/quit|leave|impulsive|angry|panic|drunk|3am|late night/)) {
        return { score: 2, label: 'Risky Move', color: '#ef4444', advice: 'Decisions made in emotional states have a 63% regret rate. Next time, wait 24 hours before acting.' };
    }
    if (text.match(/invest|save|plan|research|sleep|exercise|study|learn|practice/)) {
        return { score: 5, label: 'Excellent Decision', color: '#22c55e', advice: 'This is exactly the kind of forward-thinking decision your future self will thank you for. Keep this up!' };
    }
    if (text.match(/maybe|unsure|not sure|confused|random/)) {
        return { score: 3, label: 'Needs More Clarity', color: '#f59e0b', advice: 'Unclear decisions often reflect unclear goals. Try defining what success looks like before deciding.' };
    }
    return { score: 4, label: 'Solid Choice', color: '#00e5ff', advice: 'This looks like a reasonable, thought-out decision. Well done for taking time to log it.' };
};

const DecisionJournal = ({ onUpdate }) => {
    const [entries, setEntries] = useState(() => {
        try { return JSON.parse(localStorage.getItem('decisionJournal') || '[]'); } catch { return []; }
    });
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ decision: '', type: 'Career', outcome: '', emotion: 'calm' });

    const saveEntries = async (updated) => {
        setEntries(updated);
        localStorage.setItem('decisionJournal', JSON.stringify(updated));
        if (onUpdate) onUpdate();

        try {
            const token = sessionStorage.getItem('token');
            if (token) {
                await fetch('http://localhost:5000/api/auth/decisions', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ decisions: updated })
                });
            }
        } catch (err) {
            console.error("Failed to sync decisions to backend database:", err);
        }
    };

    const addEntry = async () => {
        if (!form.decision.trim()) return;
        const rating = getTwinRating(form.decision, form.outcome);
        const entry = {
            id: Date.now(),
            ...form,
            rating,
            date: new Date().toDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        await saveEntries([entry, ...entries]);
        setForm({ decision: '', type: 'Career', outcome: '', emotion: 'calm' });
        setShowAdd(false);

        try {
            const token = sessionStorage.getItem('token');
            if (token) {
                const rewardRes = await fetch('http://localhost:5000/api/auth/reward', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ action: 'journal' })
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
            console.error("Failed to claim journal reward:", e);
        }
    };

    const deleteEntry = (id) => saveEntries(entries.filter(e => e.id !== id));

    const EMOTIONS = [
        { id: 'calm', emoji: '😌', label: 'Calm' },
        { id: 'excited', emoji: '😄', label: 'Excited' },
        { id: 'anxious', emoji: '😰', label: 'Anxious' },
        { id: 'angry', emoji: '😠', label: 'Angry' },
        { id: 'confused', emoji: '😕', label: 'Confused' },
    ];

    const avgScore = entries.length > 0 ? (entries.reduce((s, e) => s + e.rating.score, 0) / entries.length).toFixed(1) : 0;

    return (
        <div className="glass-panel rounded-2xl border border-[#a200ff]/20 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <div>
                    <h3 className="font-orbitron text-white font-bold flex items-center gap-2">
                        <BookOpen size={18} className="text-[#a200ff]" /> Decision Journal
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                        {entries.length} entries · Avg Twin Score: <span className="text-[#a200ff] font-bold">{avgScore}/5</span>
                    </p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 text-xs font-mono bg-[#a200ff]/15 border border-[#a200ff]/30 text-[#a200ff] px-3 py-1.5 rounded-lg hover:bg-[#a200ff] hover:text-white transition-all">
                    <Plus size={14} /> Log Decision
                </button>
            </div>

            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-white/5 bg-[#0a050d]">
                        <div className="p-5 space-y-4">
                            <textarea value={form.decision} onChange={e => setForm({ ...form, decision: e.target.value })}
                                rows={3} placeholder="What decision did you make? e.g. I decided to turn down the job offer because the salary was too low."
                                className="w-full bg-[#120b18] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a200ff]/50 font-inter resize-none" />
                            <div className="grid grid-cols-2 gap-3">
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                    className="bg-[#120b18] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none font-inter">
                                    {DECISION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}
                                    placeholder="Expected outcome..."
                                    className="bg-[#120b18] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none font-inter" />
                            </div>
                            <div>
                                <label className="text-gray-500 text-xs font-mono mb-2 block">How were you feeling when you decided?</label>
                                <div className="flex gap-2 flex-wrap">
                                    {EMOTIONS.map(em => (
                                        <button key={em.id} onClick={() => setForm({ ...form, emotion: em.id })}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${form.emotion === em.id ? 'border-[#a200ff]/60 bg-[#a200ff]/20 text-[#a200ff]' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                                            {em.emoji} {em.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={addEntry} className="w-full bg-[#a200ff] text-white font-orbitron font-bold py-3 rounded-xl hover:bg-white hover:text-black transition-all text-sm">
                                Get Twin's Rating
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto custom-scrollbar">
                {entries.length === 0 && (
                    <div className="p-8 text-center text-gray-500 font-inter text-sm">
                        <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                        No decisions logged yet. Log your first decision and get your Twin's honest rating!
                    </div>
                )}
                {entries.map(entry => (
                    <div key={entry.id} className="p-5">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#a200ff]/15 text-[#a200ff]">{entry.type}</span>
                                    <span className="text-xs font-mono text-gray-500 flex items-center gap-1"><Clock size={10} /> {entry.date} · {entry.time}</span>
                                </div>
                                <p className="text-white font-inter text-sm leading-relaxed">{entry.decision}</p>
                            </div>
                            <button onClick={() => deleteEntry(entry.id)} className="text-gray-600 hover:text-red-400 ml-3 flex-shrink-0"><Trash2 size={14} /></button>
                        </div>
                        <div className="bg-[#120b18] rounded-xl p-4 border" style={{ borderColor: `${entry.rating.color}30` }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-orbitron text-xs font-bold" style={{ color: entry.rating.color }}>Twin Rating: {entry.rating.label}</span>
                                <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(s => (
                                        <Star key={s} size={12} fill={s <= entry.rating.score ? entry.rating.color : 'transparent'} stroke={entry.rating.color} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-400 text-xs font-inter leading-relaxed">{entry.rating.advice}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DecisionJournal;
