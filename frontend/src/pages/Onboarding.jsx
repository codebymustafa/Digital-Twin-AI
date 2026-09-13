import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BrainCircuit, Heart, Target, Zap, CheckCircle, ArrowRight, ArrowLeft, Sparkles, User } from 'lucide-react';

const INTERESTS_OPTIONS = [
    { icon: '💻', label: 'Technology' }, { icon: '💰', label: 'Finance' }, { icon: '🏋️', label: 'Fitness' },
    { icon: '🎨', label: 'Creativity' }, { icon: '📚', label: 'Learning' }, { icon: '🌍', label: 'Travel' },
    { icon: '🚀', label: 'Startups' }, { icon: '🧠', label: 'Psychology' }, { icon: '🎵', label: 'Music' },
    { icon: '⚽', label: 'Sports' }, { icon: '🍳', label: 'Cooking' }, { icon: '📸', label: 'Photography' },
];

const GOALS_OPTIONS = [
    { icon: '💼', label: 'Build a career I love' }, { icon: '🏦', label: 'Achieve financial freedom' },
    { icon: '💪', label: 'Improve my health' }, { icon: '🤝', label: 'Build better relationships' },
    { icon: '🧘', label: 'Reduce stress & anxiety' }, { icon: '📖', label: 'Learn new skills' },
    { icon: '🏠', label: 'Buy my own home' }, { icon: '🌟', label: 'Start my own business' },
];

const STEPS = [
    { id: 'welcome', title: 'Welcome to Digital Twin OS', icon: BrainCircuit, color: '#ff5a00' },
    { id: 'social', title: 'Are you more of an introvert or extrovert?', icon: User, color: '#a200ff' },
    { id: 'risk', title: 'How comfortable are you with taking risks?', icon: Zap, color: '#00e5ff' },
    { id: 'interests', title: 'What are you interested in?', icon: Heart, color: '#ff5a00' },
    { id: 'goals', title: 'What do you want to achieve?', icon: Target, color: '#a200ff' },
    { id: 'done', title: 'Your Twin is Ready!', icon: Sparkles, color: '#00e5ff' },
];

const Onboarding = () => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        introvertExtrovert: '50',
        riskTaking: '50',
        interests: [],
        goals: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const totalSteps = STEPS.length - 1;
    const progress = step === 0 ? 0 : ((step) / (STEPS.length - 1)) * 100;

    const toggleInterest = (label) => {
        setFormData(f => ({
            ...f,
            interests: f.interests.includes(label) ? f.interests.filter(i => i !== label) : [...f.interests, label]
        }));
    };

    const toggleGoal = (label) => {
        setFormData(f => ({
            ...f,
            goals: f.goals.includes(label) ? f.goals.filter(g => g !== label) : [...f.goals, label]
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/clone/onboard', {
                introvertExtrovert: formData.introvertExtrovert,
                riskTaking: formData.riskTaking,
                interests: formData.interests,
                goals: formData.goals
            }, { headers: { 'x-auth-token': token } });
            if (res.data) {
                const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
                const updatedUser = {
                    ...res.data,
                    id: res.data._id || res.data.id,
                    role: currentUser.role || 'user'
                };
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (err) {
        }
        setIsSubmitting(false);
        navigate('/dashboard');
    };

    const currentStep = STEPS[step];

    const getSocialLabel = (val) => {
        const v = parseInt(val);
        if (v < 20) return 'Strong Introvert 🌙';
        if (v < 40) return 'Mostly Introvert';
        if (v < 60) return 'Balanced Ambivert ⚖️';
        if (v < 80) return 'Mostly Extrovert';
        return 'Strong Extrovert ☀️';
    };

    const getRiskLabel = (val) => {
        const v = parseInt(val);
        if (v < 20) return 'Very Cautious 🛡️';
        if (v < 40) return 'Careful Thinker';
        if (v < 60) return 'Balanced Risk-Taker ⚖️';
        if (v < 80) return 'Risk Comfortable';
        return 'Bold Risk-Taker 🚀';
    };

    return (
        <div className="min-h-screen bg-[#050308] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
                    style={{ background: `radial-gradient(circle, ${currentStep.color}15 0%, transparent 70%)` }} />
            </div>

            <div className="w-full max-w-xl relative z-10">
                {step > 0 && step < STEPS.length - 1 && (
                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-mono text-gray-600 mb-2">
                            <span>Step {step} of {totalSteps - 1}</span>
                            <span style={{ color: currentStep.color }}>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-1 bg-[#120b18] rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
                                className="h-full rounded-full" style={{ backgroundColor: currentStep.color }} />
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35 }}
                        className="bg-[#0a050d]/90 backdrop-blur-xl border rounded-3xl p-8 md:p-10"
                        style={{ borderColor: `${currentStep.color}40` }}>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${currentStep.color}20`, border: `1px solid ${currentStep.color}40` }}>
                                <currentStep.icon size={28} style={{ color: currentStep.color }} />
                            </div>
                            <div>
                                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">
                                    {step === 0 ? 'Getting Started' : step === STEPS.length - 1 ? 'All Done!' : `Question ${step} of ${totalSteps - 1}`}
                                </p>
                                <h2 className="font-orbitron font-bold text-white text-lg leading-tight">{currentStep.title}</h2>
                            </div>
                        </div>

                        {step === 0 && (
                            <div className="space-y-5">
                                <p className="text-gray-300 font-inter leading-relaxed">
                                    Welcome! In the next few steps, I'll ask you 4 simple questions to build your <span className="text-[#ff5a00] font-bold">Digital Twin</span> — a smarter, calmer version of you that helps with decisions.
                                </p>
                                <div className="space-y-3">
                                    {['Takes about 2 minutes', 'No wrong answers — be honest', 'Your data is private & encrypted', 'You can update your answers anytime'].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-gray-400 font-inter">
                                            <CheckCircle size={16} className="text-[#ff5a00] flex-shrink-0" /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div>
                                <p className="text-gray-400 font-inter text-sm mb-6">
                                    This helps your Twin understand whether you make decisions based on solitude and deep thinking, or based on social energy and group input.
                                </p>
                                <input type="range" min="0" max="100" value={formData.introvertExtrovert}
                                    onChange={e => setFormData({ ...formData, introvertExtrovert: e.target.value })}
                                    className="w-full h-3 rounded-lg appearance-none cursor-pointer mb-4"
                                    style={{ accentColor: '#a200ff' }} />
                                <div className="flex justify-between text-xs text-gray-500 mb-4">
                                    <span>Full Introvert</span>
                                    <span>Full Extrovert</span>
                                </div>
                                <div className="bg-[#120b18] rounded-2xl p-5 border text-center" style={{ borderColor: '#a200ff40' }}>
                                    <div className="text-4xl font-black font-orbitron text-white mb-1">{formData.introvertExtrovert}%</div>
                                    <div className="font-orbitron font-bold" style={{ color: '#a200ff' }}>{getSocialLabel(formData.introvertExtrovert)}</div>
                                    <p className="text-gray-500 text-xs mt-2 font-inter">
                                        {parseInt(formData.introvertExtrovert) < 50 ? 'You recharge alone. You think deeply before acting.' : 'You gain energy from people. You make decisions socially.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <p className="text-gray-400 font-inter text-sm mb-6">
                                    This helps your Twin know when to push you to take a leap, and when to hold you back from reckless choices.
                                </p>
                                <input type="range" min="0" max="100" value={formData.riskTaking}
                                    onChange={e => setFormData({ ...formData, riskTaking: e.target.value })}
                                    className="w-full h-3 rounded-lg appearance-none cursor-pointer mb-4"
                                    style={{ accentColor: '#00e5ff' }} />
                                <div className="flex justify-between text-xs text-gray-500 mb-4">
                                    <span>Very Cautious</span>
                                    <span>Very Bold</span>
                                </div>
                                <div className="bg-[#120b18] rounded-2xl p-5 border text-center" style={{ borderColor: '#00e5ff40' }}>
                                    <div className="text-4xl font-black font-orbitron text-white mb-1">{formData.riskTaking}%</div>
                                    <div className="font-orbitron font-bold" style={{ color: '#00e5ff' }}>{getRiskLabel(formData.riskTaking)}</div>
                                    <p className="text-gray-500 text-xs mt-2 font-inter">
                                        {parseInt(formData.riskTaking) < 50 ? 'You prefer safe, researched choices. Your Twin will protect you from impulsive moves.' : 'You embrace risk. Your Twin will help you calculate which risks are actually worth it.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div>
                                <p className="text-gray-400 font-inter text-sm mb-5">Pick all that apply. Your Twin will give advice that's relevant to your world.</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {INTERESTS_OPTIONS.map(item => (
                                        <button key={item.label} onClick={() => toggleInterest(item.label)}
                                            className={`p-3 rounded-xl border text-sm font-inter transition-all flex flex-col items-center gap-1 ${formData.interests.includes(item.label) ? 'border-[#ff5a00]/60 bg-[#ff5a00]/15 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                                            <span className="text-2xl">{item.icon}</span>
                                            <span className="text-xs">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {formData.interests.length > 0 && (
                                    <p className="text-xs text-[#ff5a00] font-mono mt-3">✓ {formData.interests.length} selected: {formData.interests.join(', ')}</p>
                                )}
                            </div>
                        )}

                        {step === 4 && (
                            <div>
                                <p className="text-gray-400 font-inter text-sm mb-5">What do you want to achieve? Select your top goals.</p>
                                <div className="space-y-2">
                                    {GOALS_OPTIONS.map(item => (
                                        <button key={item.label} onClick={() => toggleGoal(item.label)}
                                            className={`w-full p-4 rounded-xl border text-sm font-inter transition-all flex items-center gap-3 text-left ${formData.goals.includes(item.label) ? 'border-[#a200ff]/60 bg-[#a200ff]/15 text-white' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}>
                                            <span className="text-xl flex-shrink-0">{item.icon}</span>
                                            <span>{item.label}</span>
                                            {formData.goals.includes(item.label) && <CheckCircle size={16} className="text-[#a200ff] ml-auto flex-shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="text-center py-2">
                                <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: 2, duration: 0.6 }} className="text-6xl mb-5">🎉</motion.div>
                                <p className="text-gray-300 font-inter mb-6 leading-relaxed">
                                    Your Digital Twin has been built! It now knows your personality, interests, and goals. Head to your Dashboard to meet it.
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-xs text-left mb-6">
                                    <div className="bg-[#120b18] p-3 rounded-xl border border-[#ff5a00]/20">
                                        <p className="text-gray-500 font-mono mb-1">PERSONALITY</p>
                                        <p className="text-white font-inter">{getSocialLabel(formData.introvertExtrovert)}</p>
                                    </div>
                                    <div className="bg-[#120b18] p-3 rounded-xl border border-[#00e5ff]/20">
                                        <p className="text-gray-500 font-mono mb-1">RISK PROFILE</p>
                                        <p className="text-white font-inter">{getRiskLabel(formData.riskTaking)}</p>
                                    </div>
                                    <div className="bg-[#120b18] p-3 rounded-xl border border-[#a200ff]/20">
                                        <p className="text-gray-500 font-mono mb-1">INTERESTS</p>
                                        <p className="text-white font-inter">{formData.interests.slice(0, 3).join(', ') || 'None selected'}</p>
                                    </div>
                                    <div className="bg-[#120b18] p-3 rounded-xl border border-[#ff5a00]/20">
                                        <p className="text-gray-500 font-mono mb-1">GOALS</p>
                                        <p className="text-white font-inter">{formData.goals.length} selected</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-8 gap-4">
                            {step > 0 && step < STEPS.length - 1 && (
                                <button onClick={() => setStep(s => s - 1)}
                                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all font-orbitron text-sm">
                                    <ArrowLeft size={16} /> Back
                                </button>
                            )}
                            {step < STEPS.length - 2 && (
                                <button onClick={() => setStep(s => s + 1)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-orbitron font-bold text-sm ml-auto text-black hover:text-white transition-all"
                                    style={{ backgroundColor: currentStep.color }}>
                                    {step === 0 ? 'Begin' : 'Next'} <ArrowRight size={16} />
                                </button>
                            )}
                            {step === STEPS.length - 2 && (
                                <button onClick={() => setStep(s => s + 1)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-orbitron font-bold text-sm ml-auto text-white transition-all bg-gradient-to-r from-[#ff5a00] to-[#a200ff]">
                                    Build My Twin <Sparkles size={16} />
                                </button>
                            )}
                            {step === STEPS.length - 1 && (
                                <button onClick={handleSubmit} disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white transition-all bg-gradient-to-r from-[#00e5ff] to-[#a200ff] disabled:opacity-70">
                                    {isSubmitting ? 'Setting up...' : <>Go to Dashboard <ArrowRight size={16} /></>}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
