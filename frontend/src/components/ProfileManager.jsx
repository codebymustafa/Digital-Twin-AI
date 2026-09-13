import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User, Shield, Sliders, Download, Save, ChevronLeft,
    Activity, Lock, MessageSquare, Volume2, ShieldCheck, Check, X, Sparkles, Heart
} from 'lucide-react';

const ProfileManager = ({ onBack, onChat, user: initialUser }) => {
    const [user, setUser] = useState(initialUser);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    const [editData, setEditData] = useState({
        username: user?.username || '',
        nickname: user?.nickname || '',
        bio: user?.bio || 'Thinking, learning, and making better decisions every day.',
        avatar: user?.avatar || ''
    });

    const [settings, setSettings] = useState(() => {
        const savedLocal = (() => {
            try { return JSON.parse(localStorage.getItem('twinSettings') || '{}'); } catch { return {}; }
        })();
        return {
            logicWeight: user?.settings?.logicWeight ?? savedLocal.logicWeight ?? 85,
            ambitionScale: user?.settings?.ambitionScale ?? savedLocal.ambitionScale ?? 90,
            twinVoice: user?.twinVoice || user?.settings?.twinVoice || savedLocal.twinVoice || 'Analyst',
            syncFrequency: 'Real-time'
        };
    });

    useEffect(() => {
        if (initialUser) {
            setUser(initialUser);
            setEditData({
                username: initialUser.username || '',
                nickname: initialUser.nickname || '',
                bio: initialUser.bio || 'Thinking, learning, and making better decisions every day.',
                avatar: initialUser.avatar || ''
            });
        }
    }, [initialUser]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: editData.username,
                    nickname: editData.nickname,
                    bio: editData.bio,
                    avatar: editData.avatar,
                    twinVoice: settings.twinVoice,
                    settings: {
                        logicWeight: Number(settings.logicWeight),
                        ambitionScale: Number(settings.ambitionScale),
                        twinVoice: settings.twinVoice
                    }
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Failed to save');

            localStorage.setItem('twinSettings', JSON.stringify({
                logicWeight: Number(settings.logicWeight),
                ambitionScale: Number(settings.ambitionScale),
                twinVoice: settings.twinVoice
            }));

            const updatedUser = {
                ...user,
                ...data.user,
                twinVoice: settings.twinVoice,
                settings: {
                    logicWeight: Number(settings.logicWeight),
                    ambitionScale: Number(settings.ambitionScale),
                    twinVoice: settings.twinVoice
                }
            };
            setUser(updatedUser);
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            setIsEditing(false);
            setSaveStatus('success');
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('twin-data-updated'));
        } catch (err) {
            console.error('Profile save error:', err);
            localStorage.setItem('twinSettings', JSON.stringify({
                logicWeight: Number(settings.logicWeight),
                ambitionScale: Number(settings.ambitionScale),
                twinVoice: settings.twinVoice
            }));
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadData = () => {
        const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
        const decisions = JSON.parse(localStorage.getItem('decisionJournal') || '[]');
        const userName = user?.username || 'User';
        const content = `DIGITAL TWIN PROFILE SUMMARY\nUser: ${userName}\nLogic: ${settings.logicWeight}%\nAmbition: ${settings.ambitionScale}%\nVoice: ${settings.twinVoice}\nDecisions Logged: ${decisions.length}\nGoals Tracked: ${goals.length}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `twin_profile_${userName.toLowerCase()}_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className='max-w-6xl mx-auto py-8 md:py-10 px-4 md:px-6'>
            <div className='flex justify-between items-center mb-8'>
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={onBack}
                    className='flex items-center gap-2 text-cyberNeon hover:text-white transition-colors font-orbitron text-xs md:text-sm group cursor-pointer'
                >
                    <ChevronLeft size={18} className='group-hover:-translate-x-1 transition-transform' /> BACK TO DASHBOARD
                </motion.button>
                {onChat && (
                    <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={onChat}
                        className='flex items-center gap-2 px-4 py-2 rounded-xl bg-cyberNeon/10 border border-cyberNeon/40 text-cyberNeon hover:bg-cyberNeon hover:text-black font-orbitron text-xs font-bold transition-all cursor-pointer'
                    >
                        <MessageSquare size={14} /> CHAT WITH TWIN
                    </motion.button>
                )}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
                <div className='lg:col-span-4 space-y-6'>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className='glass-panel p-6 md:p-8 rounded-[2rem] border border-white/10 flex flex-col items-center text-center relative overflow-hidden'
                    >
                        <div className='relative mb-5 group cursor-pointer' onClick={() => setIsEditing(true)}>
                            <div className='w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr from-cyberNeon to-cyberPink flex items-center justify-center text-4xl font-black text-white shadow-[0_0_30px_rgba(0,229,255,0.25)] overflow-hidden border-2 border-white/20'>
                                {editData.avatar ? (
                                    <img src={editData.avatar} alt='Avatar' className='w-full h-full object-cover' />
                                ) : (
                                    user?.username?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                            <div className='absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                                <span className='text-[10px] text-white font-mono uppercase'>Edit</span>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className='w-full space-y-4'>
                                <div className='flex flex-col items-center gap-2 mb-2'>
                                    <label className='text-[11px] font-mono text-gray-400 uppercase tracking-wider cursor-pointer hover:text-cyberNeon transition-colors'>
                                        Upload Custom Photo
                                        <input
                                            type='file'
                                            accept='image/*'
                                            className='hidden'
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setEditData({ ...editData, avatar: reader.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                    <div className='flex gap-2'>
                                        {[
                                            'https://images.unsplash.com/photo-1614728263952-84ea206f99b6?w=200&h=200&fit=crop',
                                            'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&h=200&fit=crop',
                                            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop'
                                        ].map((img, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setEditData({ ...editData, avatar: img })}
                                                className={`w-9 h-9 rounded-full border-2 cursor-pointer transition-all ${editData.avatar === img ? 'border-cyberNeon scale-110' : 'border-white/10 hover:border-white/40'}`}
                                            >
                                                <img src={img} className='w-full h-full rounded-full object-cover' alt='preset' />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className='text-left space-y-1'>
                                    <label className='text-[11px] text-gray-400 font-inter'>Username</label>
                                    <input
                                        className='w-full bg-[#120b18] border border-white/10 p-2.5 rounded-xl text-white font-inter text-sm outline-none focus:border-cyberNeon'
                                        placeholder='Username'
                                        value={editData.username}
                                        onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                    />
                                </div>
                                <div className='text-left space-y-1'>
                                    <label className='text-[11px] text-gray-400 font-inter'>Nickname (Optional)</label>
                                    <input
                                        className='w-full bg-[#120b18] border border-white/10 p-2.5 rounded-xl text-white font-inter text-sm outline-none focus:border-cyberBlue'
                                        placeholder='Nickname'
                                        value={editData.nickname}
                                        onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                                    />
                                </div>
                                <div className='text-left space-y-1'>
                                    <label className='text-[11px] text-gray-400 font-inter'>Personal Bio</label>
                                    <textarea
                                        className='w-full bg-[#120b18] border border-white/10 p-2.5 rounded-xl text-xs text-gray-300 font-inter resize-none h-20 outline-none focus:border-cyberPink'
                                        placeholder='A sentence about your goals or mindset...'
                                        value={editData.bio}
                                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                    />
                                </div>
                                <div className='flex gap-2 pt-2'>
                                    <button onClick={() => { setIsEditing(false); setSaveStatus(null); }} className='flex-1 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-semibold border border-white/10'>Cancel</button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className='flex-1 py-2 rounded-xl bg-cyberNeon text-[#050308] text-xs font-bold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer'
                                    >
                                        {isSaving ? 'Saving...' : 'Save Profile'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className='text-2xl md:text-3xl font-orbitron font-bold text-white mb-1'>{user?.username}</h2>
                                {user?.nickname && <p className='text-cyberNeon text-xs font-mono mb-2'>"{user.nickname}"</p>}
                                <p className='text-gray-400 text-xs md:text-sm font-inter leading-relaxed mb-5 max-w-xs'>{user?.bio || 'Thinking, learning, and making better decisions every day.'}</p>
                                <button onClick={() => setIsEditing(true)} className='px-5 py-2 rounded-xl border border-white/15 text-xs font-orbitron text-gray-300 hover:text-white hover:border-cyberNeon transition-all cursor-pointer'>
                                    EDIT PROFILE
                                </button>
                            </>
                        )}

                        <div className='mt-8 w-full p-4 rounded-2xl bg-white/5 border border-white/5 text-left'>
                            <p className='text-gray-400 text-xs font-inter mb-1'>Account Status</p>
                            <div className='flex justify-between items-center mb-1'>
                                <span className='text-green-400 font-mono text-xs flex items-center gap-1.5 font-semibold'>
                                    <ShieldCheck size={14} /> Active & Protected
                                </span>
                                <span className='text-gray-400 font-mono text-xs'>{user?.isPremium ? 'Premium Tier' : 'Standard Tier'}</span>
                            </div>
                        </div>
                    </motion.div>

                    <div className='glass-panel p-6 rounded-[2rem] border border-white/5 space-y-3'>
                        <button
                            onClick={handleDownloadData}
                            className='w-full py-3.5 px-4 bg-cyberBlue/10 border border-cyberBlue/30 rounded-xl text-cyberBlue font-orbitron text-xs flex items-center justify-center gap-2 hover:bg-cyberBlue hover:text-black transition-all group cursor-pointer font-bold'
                        >
                            <Download size={16} className='group-hover:translate-y-0.5 transition-transform' /> DOWNLOAD MY DATA SUMMARY
                        </button>
                    </div>
                </div>

                <div className='lg:col-span-8 space-y-6'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='glass-panel p-6 md:p-8 rounded-[2rem] border border-white/10 relative'
                    >
                        <div className='flex items-center gap-3.5 mb-8'>
                            <div className='p-3 bg-cyberPink/15 rounded-xl text-cyberPink'>
                                <Sliders size={22} />
                            </div>
                            <div>
                                <h3 className='text-xl md:text-2xl font-orbitron font-bold text-white'>AI Twin Preferences & Behavior</h3>
                                <p className='text-gray-400 text-xs md:text-sm font-inter'>Adjust how your twin reasons, speaks, and guides your daily choices.</p>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
                            <div className='space-y-6'>
                                <div className='space-y-3 text-left'>
                                    <div className='flex justify-between items-center'>
                                        <label className='text-xs md:text-sm font-inter font-semibold text-gray-200'>Decision Logic Weight</label>
                                        <span className='text-cyberNeon font-mono text-base font-bold'>{settings.logicWeight}%</span>
                                    </div>
                                    <input
                                        type='range'
                                        min='20'
                                        max='100'
                                        className='w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-cyberNeon'
                                        value={settings.logicWeight}
                                        onChange={(e) => setSettings({ ...settings, logicWeight: Number(e.target.value) })}
                                    />
                                    <div className='flex justify-between text-[11px] font-mono text-gray-500'>
                                        <span>Intuitive & Emotional</span>
                                        <span>Calm & Calculated</span>
                                    </div>
                                    <p className='text-gray-400 text-xs font-inter leading-relaxed'>
                                        Higher values favor cold probability, patience, and long-term security.
                                    </p>
                                </div>

                                <div className='space-y-3 text-left pt-2'>
                                    <div className='flex justify-between items-center'>
                                        <label className='text-xs md:text-sm font-inter font-semibold text-gray-200'>Ambition & Growth Drive</label>
                                        <span className='text-cyberPink font-mono text-base font-bold'>{settings.ambitionScale}%</span>
                                    </div>
                                    <input
                                        type='range'
                                        min='20'
                                        max='100'
                                        className='w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-cyberPink'
                                        value={settings.ambitionScale}
                                        onChange={(e) => setSettings({ ...settings, ambitionScale: Number(e.target.value) })}
                                    />
                                    <div className='flex justify-between text-[11px] font-mono text-gray-500'>
                                        <span>Steady & Balanced</span>
                                        <span>High Target & Intense</span>
                                    </div>
                                    <p className='text-gray-400 text-xs font-inter leading-relaxed'>
                                        Higher ambition encourages you to aim for bigger targets and embrace productive challenges.
                                    </p>
                                </div>
                            </div>

                            <div className='space-y-5 text-left'>
                                <div>
                                    <label className='text-xs md:text-sm font-inter font-semibold text-gray-200 block mb-2'>AI Conversation Style</label>
                                    <div className='grid grid-cols-3 gap-2 mb-3'>
                                        {['Analyst', 'Stoic', 'Motivator'].map((voice) => (
                                            <button
                                                key={voice}
                                                type='button'
                                                onClick={() => setSettings({ ...settings, twinVoice: voice })}
                                                className={`py-2.5 px-2 rounded-xl text-xs font-orbitron border transition-all cursor-pointer text-center ${
                                                    settings.twinVoice === voice
                                                        ? 'bg-cyberNeon text-black border-cyberNeon font-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                                                        : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white bg-white/3'
                                                }`}
                                            >
                                                {voice}
                                            </button>
                                        ))}
                                    </div>
                                    <div className='p-3.5 rounded-xl bg-white/5 border border-white/5'>
                                        <p className='text-xs text-gray-300 font-inter'>
                                            {settings.twinVoice === 'Analyst' && 'Analyst: Delivers structured, evidence-based reasoning focused on numbers and trade-offs.'}
                                            {settings.twinVoice === 'Stoic' && 'Stoic: Focuses on calmness, emotional control, and focusing solely on what you can influence.'}
                                            {settings.twinVoice === 'Motivator' && 'Motivator: Encouraging and action-driven, pushing you to execute without overthinking.'}
                                        </p>
                                    </div>
                                </div>

                                <div className='p-4 rounded-xl bg-white/5 border border-white/5'>
                                    <div className='flex justify-between items-center text-xs'>
                                        <span className='text-gray-400 font-inter'>Synchronization Rate</span>
                                        <span className='text-cyberBlue font-mono font-bold tracking-wider'>Instant (Live)</span>
                                    </div>
                                    <p className='text-gray-500 text-[11px] font-inter mt-1'>Updates immediately across your Dashboard, Twin Chat, and Simulator.</p>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className='w-full py-4 bg-cyberNeon text-[#050308] font-orbitron font-black text-sm md:text-base rounded-xl shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:bg-white transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50'
                        >
                            <Save size={18} />
                            {isSaving ? 'SAVING PREFERENCES...' : 'SAVE PREFERENCES'}
                        </motion.button>
                        {saveStatus === 'success' && (
                            <p className='text-green-400 font-inter text-xs text-center mt-3 font-semibold'>
                                ✓ All preferences and conversation styles saved successfully.
                            </p>
                        )}
                        {saveStatus === 'error' && (
                            <p className='text-amber-400 font-inter text-xs text-center mt-3 font-semibold'>
                                Note: Preferences saved locally to your device.
                            </p>
                        )}
                    </motion.div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='glass-panel p-5 rounded-2xl border border-white/5 flex gap-4 items-center'>
                            <div className='p-3 bg-cyberNeon/10 rounded-xl text-cyberNeon'>
                                <Activity size={24} />
                            </div>
                            <div>
                                <h4 className='text-white font-orbitron font-bold text-sm'>Decision Engine</h4>
                                <p className='text-xs text-gray-400 font-inter'>Configured at {settings.logicWeight}% logic weighting.</p>
                            </div>
                        </div>
                        <div className='glass-panel p-5 rounded-2xl border border-white/5 flex gap-4 items-center'>
                            <div className='p-3 bg-cyberPink/10 rounded-xl text-cyberPink'>
                                <Heart size={24} />
                            </div>
                            <div>
                                <h4 className='text-white font-orbitron font-bold text-sm'>Voice Persona</h4>
                                <p className='text-xs text-gray-400 font-inter'>Speaking in {settings.twinVoice} tone.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileManager;