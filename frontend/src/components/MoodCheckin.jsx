import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Frown, Smile, Meh, Sun, Moon, X } from 'lucide-react';

const MOODS = [
    { id: 'great', label: 'Great', emoji: '😄', color: '#22c55e', desc: 'Feeling amazing today!' },
    { id: 'good', label: 'Good', emoji: '🙂', color: '#00e5ff', desc: 'Pretty decent day' },
    { id: 'okay', label: 'Okay', emoji: '😐', color: '#ff5a00', desc: 'Getting through it' },
    { id: 'stressed', label: 'Stressed', emoji: '😰', color: '#f59e0b', desc: 'Feeling overwhelmed' },
    { id: 'bad', label: 'Bad', emoji: '😔', color: '#a200ff', desc: 'Tough day today' },
];

const QUESTIONS = [
    { id: 'sleep', question: 'How well did you sleep last night?', options: ['Very well (7-9 hrs)', 'Okay (5-7 hrs)', 'Poorly (< 5 hrs)'] },
    { id: 'energy', question: 'How is your energy level right now?', options: ['High energy 🚀', 'Moderate ⚡', 'Low / tired 😴'] },
    { id: 'focus', question: 'How focused do you feel today?', options: ['Very focused 🎯', 'Somewhat distracted', 'Can\'t focus at all'] },
];

const MoodCheckin = ({ onClose, onComplete }) => {
    const [step, setStep] = useState(0);
    const [selectedMood, setSelectedMood] = useState(null);
    const [answers, setAnswers] = useState({});
    const [aiTip, setAiTip] = useState('');
    const [fetchingTip, setFetchingTip] = useState(false);

    const handleMoodSelect = (mood) => {
        setSelectedMood(mood);
        setTimeout(() => setStep(1), 400);
    };

    const handleAnswer = async (questionId, answer) => {
        const newAnswers = { ...answers, [questionId]: answer };
        setAnswers(newAnswers);
        if (step < 3) {
            setTimeout(() => setStep(step + 1), 300);
        } else {
            const moodLabel = selectedMood?.label || 'Unknown';
            const moodDesc = selectedMood?.desc || '';
            const sleepAns = newAnswers.sleep || 'unknown';
            const energyAns = newAnswers.energy || 'unknown';
            const focusAns = newAnswers.focus || 'unknown';

            const aiMoodContext = `
[TODAY'S DAILY CHECK-IN — ${new Date().toLocaleDateString('en-PK')}]
Mood: ${moodLabel} — "${moodDesc}"
Sleep last night: ${sleepAns}
Energy level: ${energyAns}
Focus level: ${focusAns}

Behavioral Guidance:
${selectedMood?.id === 'stressed' ? '- User is stressed today. Be extra careful and calm in responses. Avoid overwhelming them. Flag risky decisions clearly.' : ''}
${selectedMood?.id === 'bad' ? '- User is having a bad day. Be empathetic and supportive. Do NOT push major decisions or advice. Just listen and comfort.' : ''}
${selectedMood?.id === 'great' ? '- User is in great mood and peak mental state. Great day for bold goals, important decisions, and motivation.' : ''}
${selectedMood?.id === 'good' ? '- User is in good baseline state. Balanced advice works well today.' : ''}
${selectedMood?.id === 'okay' ? '- User is just okay today. Be steady and practical. Avoid extremes.' : ''}
${sleepAns.includes('Poorly') ? '- User slept poorly. Cognitive performance may be lower. Keep advice simple and direct.' : ''}
${energyAns.includes('Low') ? '- User has low energy. Do not push heavy tasks or long analysis. Keep it short and kind.' : ''}
${focusAns.includes("Can't focus") ? '- User cannot focus today. Avoid complex multi-step instructions. Keep everything concise.' : ''}
`;

            const checkinData = {
                mood: selectedMood,
                answers: newAnswers,
                aiContext: aiMoodContext.trim(),
                date: new Date().toDateString(),
                timestamp: Date.now()
            };

            const history = JSON.parse(localStorage.getItem('moodHistory') || '[]');
            history.unshift(checkinData);
            if (history.length > 30) history.pop();
            localStorage.setItem('moodHistory', JSON.stringify(history));
            localStorage.setItem('lastCheckin', new Date().toDateString());
            localStorage.setItem('todayMoodContext', aiMoodContext.trim());

            try {
                const token = sessionStorage.getItem('token');
                if (token) {
                    const oldStreak = parseInt(localStorage.getItem('currentStreak') || '0');

                    const moodRes = await fetch('http://localhost:5000/api/auth/mood', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            moodHistory: history,
                            lastCheckinDate: new Date().toDateString()
                        })
                    });

                    let newStreak = oldStreak;
                    if (moodRes.ok) {
                        const moodData = await moodRes.json();
                        if (moodData.user) {
                            newStreak = moodData.user.currentStreak || 0;
                            localStorage.setItem('currentStreak', String(newStreak));
                            localStorage.setItem('longestStreak', String(moodData.user.longestStreak || 0));
                            sessionStorage.setItem('user', JSON.stringify(moodData.user));
                            window.dispatchEvent(new Event('twin-data-updated'));
                        }
                    }

                    try {
                        const checkinRewardRes = await fetch('http://localhost:5000/api/auth/reward', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ action: 'checkin' })
                        });
                        if (checkinRewardRes.ok) {
                            const rewardData = await checkinRewardRes.json();
                            if (rewardData.user) {
                                sessionStorage.setItem('user', JSON.stringify(rewardData.user));
                                window.dispatchEvent(new Event('twin-data-updated'));
                            }
                        }
                    } catch (e) {
                        console.error("Failed to claim checkin reward:", e);
                    }

                    if (newStreak > oldStreak) {
                        try {
                            const streakRewardRes = await fetch('http://localhost:5000/api/auth/reward', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ action: 'streak' })
                            });
                            if (streakRewardRes.ok) {
                                const rewardData = await streakRewardRes.json();
                                if (rewardData.user) {
                                    sessionStorage.setItem('user', JSON.stringify(rewardData.user));
                                    window.dispatchEvent(new Event('twin-data-updated'));
                                }
                            }
                        } catch (e) {
                            console.error("Failed to claim streak reward:", e);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to sync mood checkin to backend database:", err);
            }

            setStep(4);

            setFetchingTip(true);
            try {
                const user = (() => { try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; } })();
                const tipRes = await fetch('http://localhost:5000/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: `Based on my check-in today — mood: ${moodLabel}, sleep: ${sleepAns}, energy: ${energyAns}, focus: ${focusAns} — give me ONE specific, practical action I should do today to make the best of my mental state. Keep it to 2-3 sentences max.`,
                        history: [],
                        context: { username: user?.username },
                        moodContext: aiMoodContext.trim()
                    })
                });
                const tipData = await tipRes.json();
                setAiTip(tipData.response || '');
            } catch (e) {
                setAiTip('');
            } finally {
                setFetchingTip(false);
            }

            setTimeout(() => { onComplete(checkinData); onClose(); }, 4000);
        }
    };

    const getTwinAdvice = () => {
        if (!selectedMood) return '';
        if (selectedMood.id === 'stressed') return "I can see you're stressed. Let's make today's decisions extra carefully. I'll flag anything risky before you act on it.";
        if (selectedMood.id === 'bad') return "Difficult days are part of the journey. I recommend avoiding any major decisions today. Let's just talk if you need to.";
        if (selectedMood.id === 'great') return "Excellent! Your brain is in peak condition. Today is a great day to tackle that big decision you've been putting off.";
        if (selectedMood.id === 'good') return "Good baseline. You're in a solid state for logical thinking. Let's make the most of the day.";
        return "Okay days are valuable too. Steady and consistent — that's how you build great habits.";
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 40 }}
                className="bg-[#0a050d] border border-cyberPink/40 rounded-3xl p-8 w-full max-w-lg shadow-[0_0_60px_rgba(162,0,255,0.3)] relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyberNeon to-cyberPink flex items-center justify-center">
                        <Sun size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-orbitron font-bold text-white">Daily Check-In</h2>
                        <p className="text-gray-500 text-xs">Step {Math.min(step + 1, 4)} of 4</p>
                    </div>
                    <div className="ml-auto flex gap-1">
                        {[0,1,2,3].map(i => (
                            <div key={i} className={`w-8 h-1 rounded-full transition-all ${i <= step-1 ? 'bg-cyberNeon' : 'bg-[#120b18]'}`}></div>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div key="mood" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <h3 className="text-white font-inter text-xl font-semibold mb-2">How are you feeling right now?</h3>
                            <p className="text-gray-400 text-sm mb-8">Your Digital Twin adjusts its advice based on your mood.</p>
                            <div className="grid grid-cols-5 gap-3">
                                {MOODS.map(mood => (
                                    <motion.button key={mood.id} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        onClick={() => handleMoodSelect(mood)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${selectedMood?.id === mood.id ? 'border-opacity-100 bg-opacity-20' : 'border-white/10 hover:border-white/30'}`}
                                        style={{ borderColor: selectedMood?.id === mood.id ? mood.color : undefined, backgroundColor: selectedMood?.id === mood.id ? `${mood.color}20` : undefined }}>
                                        <span className="text-3xl">{mood.emoji}</span>
                                        <span className="text-xs font-mono" style={{ color: mood.color }}>{mood.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step >= 1 && step <= 3 && (
                        <motion.div key={`q${step}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-3xl">{MOODS.find(m => m.id === selectedMood?.id)?.emoji}</span>
                                <span className="font-mono text-xs" style={{ color: selectedMood?.color }}>Mood: {selectedMood?.label}</span>
                            </div>
                            <h3 className="text-white font-inter text-xl font-semibold mb-8">{QUESTIONS[step-1].question}</h3>
                            <div className="space-y-3">
                                {QUESTIONS[step-1].options.map((option, idx) => (
                                    <motion.button key={idx} whileHover={{ x: 8 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(QUESTIONS[step-1].id, option)}
                                        className="w-full text-left p-4 rounded-xl border border-white/10 text-gray-300 font-inter hover:border-cyberNeon/50 hover:text-white hover:bg-cyberNeon/5 transition-all">
                                        {option}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                            <div className="text-5xl mb-4">{selectedMood?.emoji}</div>
                            <h3 className="text-white font-orbitron font-bold text-xl mb-4">Your Twin Has Calibrated!</h3>
                            <div className="bg-[#120b18] p-5 rounded-2xl border text-left mb-4" style={{ borderColor: `${selectedMood?.color}40` }}>
                                <p className="text-sm font-mono mb-1" style={{ color: selectedMood?.color }}>Twin Analysis:</p>
                                <p className="text-gray-300 font-inter text-sm leading-relaxed">{getTwinAdvice()}</p>
                            </div>
                            {fetchingTip && (
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-3 h-3 border border-cyberNeon border-t-transparent rounded-full" />
                                    AI generating your daily action plan...
                                </div>
                            )}
                            {aiTip && !fetchingTip && (
                                <div className="bg-cyberNeon/5 border border-cyberNeon/30 p-4 rounded-2xl text-left">
                                    <p className="text-cyberNeon font-mono text-xs font-bold mb-2">⚡ TODAY'S TWIN ACTION:</p>
                                    <p className="text-gray-200 font-inter text-sm leading-relaxed">{aiTip}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default MoodCheckin;
