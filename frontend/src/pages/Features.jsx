import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Eye, Database, TerminalSquare, BrainCircuit, Activity, Lock, Cpu, Globe, Fingerprint, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TiltCard = ({ children, className }) => {
    const ref = useRef(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const rY = ((mouseX / width) - 0.5) * 30;
        const rX = ((mouseY / height) - 0.5) * -30;
        setRotateX(rX);
        setRotateY(rY);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ rotateX, rotateY }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ perspective: 1000 }}
            className={`w-full ${className}`}
        >
            <div style={{ transformStyle: 'preserve-3d' }} className="w-full h-full">
                {children}
            </div>
        </motion.div>
    );
};

const FeatureBlock = ({ icon: Icon, title, description, color, alignLeft, subFeatures }) => {
    return (
        <div className={`flex flex-col ${alignLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16 min-h-[80vh] py-20 border-b border-white/5`}>
            <div className="flex-1 w-full relative group perspective-1000">
                <TiltCard>
                    <div className="glass-panel p-16 rounded-3xl h-[600px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 hover:shadow-2xl bg-[#0a050d]" style={{ borderColor: color, boxShadow: `0 0 40px ${color}20` }}>
                        <div className="absolute inset-0 bg-gradient-to-t" style={{ backgroundImage: `linear-gradient(to top, ${color}20, transparent)` }}></div>
                        <Icon size={180} style={{ color: color }} className="drop-shadow-[0_0_20px_var(--tw-shadow-color)] shadow-current mb-8 transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono opacity-50 uppercase tracking-widest" style={{ color: color }}>
                            <TerminalSquare size={14} /> FEATURE_{title.split(' ')[0].toUpperCase()}
                        </div>
                    </div>
                </TiltCard>
            </div>
            <div className="flex-1 space-y-8">
                <motion.h2
                    initial={{ opacity: 0, x: alignLeft ? 100 : -100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="text-5xl md:text-7xl font-orbitron font-black leading-none drop-shadow-lg"
                    style={{ color: color }}
                >
                    {title}
                </motion.h2>
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="space-y-6 text-xl text-gray-300 font-inter leading-relaxed"
                >
                    {description.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                    ))}
                </motion.div>
                {subFeatures && (
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.6 }} className="space-y-4 mt-8 pt-8 border-t border-white/10">
                        {subFeatures.map((sub, idx) => (
                            <div key={idx} className="flex items-start gap-4 group">
                                <CheckCircle2 size={20} style={{ color: color }} className="mt-1 flex-shrink-0 group-hover:scale-125 transition-transform" />
                                <div>
                                    <span className="font-orbitron font-bold text-white text-sm block mb-1">{sub.title}</span>
                                    <span className="text-gray-400 text-sm font-inter">{sub.desc}</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const Features = () => {
    return (
        <div className="min-h-screen pt-32 pb-24 px-6 relative z-10 bg-[#050308] overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-32"
                >
                    <span className="font-orbitron font-bold tracking-widest text-[#00e5ff] mb-6 block uppercase drop-shadow-[0_0_10px_#00e5ff]">Core Capabilities</span>
                    <h1 className="text-6xl md:text-[6rem] font-orbitron font-black neon-text text-white mb-8">WHAT YOUR <span className="text-[#ff5a00] drop-shadow-[0_0_20px_#ff5a00]">TWIN CAN DO</span></h1>
                    <p className="text-gray-400 font-inter max-w-4xl mx-auto text-2xl leading-relaxed">
                        Every part of your Digital Twin has been built to help you think clearer, decide smarter, and grow faster. Here's a clear breakdown of what's working behind the scenes — and what it does for you.
                    </p>
                </motion.div>

                <div className="mb-40 glass-panel p-10 md:p-16 rounded-[3rem] border border-[#a200ff]/30 shadow-[0_0_50px_rgba(162,0,255,0.15)] bg-[#050308]">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-orbitron font-bold text-white mb-4">HUMAN THINKING <span className="text-[#a200ff]">VS</span> YOUR DIGITAL TWIN</h2>
                        <p className="text-gray-400 max-w-3xl mx-auto text-lg">The human brain is incredible — but it gets tired, stressed, and emotional. Here's what changes when you have a calm, logical version of yourself always ready to help.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#a200ff]/50 to-transparent"></div>

                        <div className="space-y-6 pr-0 md:pr-10">
                            <h3 className="font-orbitron text-red-400 text-2xl font-bold mb-6 flex items-center gap-3"><AlertTriangle size={24} /> When You're Thinking Alone</h3>
                            {[
                                { title: "Stress Takes Over", desc: "When you're under pressure, your brain shifts into survival mode and stops thinking long-term. This is why most panic-driven financial decisions end in regret." },
                                { title: "You Forget the Details", desc: "Human memory fades fast — up to 40% of information is lost within 48 hours. Meeting notes, plans, and past decisions blur over time." },
                                { title: "Decision Fatigue Sets In", desc: "After making hundreds of choices throughout the day, your thinking quality drops. That's when you're most likely to make a decision you'll regret." },
                                { title: "Emotions Override Logic", desc: "Arguments escalate, impulsive purchases happen, and important conversations go sideways — all because emotions react faster than reason." },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-[#120b18] p-6 rounded-2xl border border-red-500/20 hover:border-red-500/50 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                    <h4 className="font-orbitron text-red-400 font-bold text-lg mb-2">{item.title}</h4>
                                    <p className="text-gray-400 text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6 pl-0 md:pl-10">
                            <h3 className="font-orbitron text-cyberNeon text-2xl font-bold mb-6 flex items-center gap-3"><BrainCircuit size={24} /> With Your Digital Twin</h3>
                            {[
                                { title: "Always Calm & Logical", desc: "Your Digital Twin doesn't panic. It looks at your situation clearly, offers balanced options, and helps you make decisions from a calm, rational place." },
                                { title: "Remembers Everything", desc: "Every conversation, goal, and decision you've shared is stored securely. Your Twin can reference things you discussed weeks or months ago." },
                                { title: "Consistent Quality, Always", desc: "Whether it's your first question of the day or your hundredth, you get the same clear, thoughtful response — no fatigue, no drop in quality." },
                                { title: "Spots Emotional Patterns", desc: "When your messages show signs of stress or impulsive thinking, your Twin gently flags it: 'It looks like you might want to sleep on this one.'" },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-cyberNeon/10 p-6 rounded-2xl border border-cyberNeon/30 hover:border-cyberNeon/80 transition-all shadow-[0_0_20px_rgba(255,90,0,0.1)]">
                                    <h4 className="font-orbitron text-cyberNeon font-bold text-lg mb-2 flex items-center gap-2"><Cpu size={16} /> {item.title}</h4>
                                    <p className="text-gray-300 text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <FeatureBlock
                    alignLeft={true}
                    color="#a200ff"
                    icon={Shield}
                    title="Your Privacy, Protected"
                    description={[
                        "Everything you share with your Digital Twin stays completely private. Your conversations, personality profile, and personal goals are stored securely — no one else can see them.",
                        "We use industry-standard encryption to protect your data both when it's stored and when it's being sent. Even our own team can't read your private chats.",
                        "Think of it as a private journal that's also incredibly smart."
                    ]}
                    subFeatures={[
                        { title: "End-to-End Encryption", desc: "Your data is encrypted before it even leaves your device. Our servers only see secured, unreadable data." },
                        { title: "Your Own Private Space", desc: "Your profile and conversations are completely isolated from other users — there's no mixing of data." },
                        { title: "Delete Anytime", desc: "If you ever want to remove your account, all your data is permanently deleted within 24 hours across all our systems." },
                    ]}
                />

                <FeatureBlock
                    alignLeft={false}
                    color="#00e5ff"
                    icon={Zap}
                    title="Instant Real-Time Chat"
                    description={[
                        "Talk to your Digital Twin and get responses instantly — no waiting, no delays. We use WebSocket technology to keep a live, always-open connection between you and your Twin.",
                        "It feels like texting a friend who responds immediately, not like using a slow AI tool that makes you wait. The connection stays alive the whole time you're using the app.",
                        "Fast, smooth, and always responsive — the way good communication should feel."
                    ]}
                    subFeatures={[
                        { title: "Zero Delay Responses", desc: "Messages are delivered and processed instantly — you'll never be left staring at a loading spinner." },
                        { title: "Stays Connected", desc: "The connection is kept alive throughout your session. Even if your internet briefly drops, your messages queue and deliver automatically." },
                        { title: "Separate Channels", desc: "Chat, mood tracking, and scenario simulation all run on separate streams so nothing slows anything else down." },
                    ]}
                />

                <FeatureBlock
                    alignLeft={true}
                    color="#ff5a00"
                    icon={Eye}
                    title="See Your Emotions Visualized"
                    description={[
                        "Your Digital Twin doesn't just text back — it also shows you how you're feeling through a live 3D visualization that reacts to your conversation in real time.",
                        "When you're calm and focused, the visualization is smooth and steady. When you're stressed or anxious, it shifts and changes — giving you a visual mirror of your emotional state.",
                        "It's a unique way to understand yourself that goes beyond words."
                    ]}
                    subFeatures={[
                        { title: "Color-Coded Emotional States", desc: "Blue = Calm, Orange = Focused, Red = Stressed, Purple = Creative, White = Neutral — easy to read at a glance." },
                        { title: "Reacts to Your Conversation", desc: "The visualization changes dynamically as the tone of your conversation shifts — smooth when you're calm, more active when you're worked up." },
                        { title: "Review Past Emotions", desc: "Look back at old conversations and see how your emotional state evolved over time, helping you spot patterns." },
                    ]}
                />

                <FeatureBlock
                    alignLeft={false}
                    color="#ffffff"
                    icon={Database}
                    title="Remembers Everything You've Shared"
                    description={[
                        "Your Digital Twin builds a genuine memory of your goals, decisions, concerns, and growth over time. It doesn't treat every conversation like a fresh start.",
                        "If you talked about a career worry months ago and bring it up again today, your Twin already has the context — it connects the dots for you and offers deeper, more relevant insights.",
                        "The longer you use it, the better it knows you."
                    ]}
                    subFeatures={[
                        { title: "Pattern Recognition", desc: "Over weeks and months, your Twin notices patterns in your decisions and emotional state, and reflects them back to you." },
                        { title: "Rich Contextual Answers", desc: "When you ask something new, your Twin scans your history to give you a more relevant, personalized answer." },
                        { title: "Your Decision History", desc: "Download a complete record of your conversations and decisions anytime — great for personal reflection or professional reviews." },
                    ]}
                />

                <div className="mt-40 mb-20 glass-panel p-10 md:p-16 rounded-[3rem] border border-cyberBlue/20 shadow-[0_0_50px_rgba(0,229,255,0.1)] bg-[#050308]">
                    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
                        <Lock size={60} className="text-cyberBlue mx-auto mb-6" />
                        <h2 className="text-4xl md:text-6xl font-orbitron font-bold text-white mb-6">BUILT WITH <span className="text-cyberBlue">TRUST</span> IN MIND</h2>
                        <p className="text-gray-400 max-w-3xl mx-auto text-xl leading-relaxed">
                            Beyond just keeping your data safe, we've built multiple layers of protection to make sure Digital Twin is always a positive, healthy experience for you.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: Shield, title: "Safe by Design", desc: "Your Digital Twin will never encourage harmful actions, illegal activity, or manipulative behavior. These boundaries are hard-coded and can never be overridden — no matter how a question is phrased.", color: "#a200ff" },
                            { icon: Activity, title: "Emotional Safety Alerts", desc: "If the system detects signs of serious emotional distress — like repeated crisis-related messages — it automatically surfaces mental health resources and encourages you to reach out to a professional.", color: "#ff5a00" },
                            { icon: Fingerprint, title: "Only You Can Access It", desc: "Your account is protected by secure JWT authentication. Only you can log in and access your Twin. Biometric support is in development for mobile.", color: "#00e5ff" },
                            { icon: Globe, title: "Compliant with Privacy Laws", desc: "We fully comply with GDPR, CCPA, and other international data protection laws. Your data belongs to you — request full deletion at any time.", color: "#a200ff" },
                            { icon: BrainCircuit, title: "Encourages Healthy Use", desc: "If you're using the app very heavily, the system will gently suggest taking a break. We want Digital Twin to be a helpful tool, not a dependency.", color: "#ff5a00" },
                            { icon: Lock, title: "Full Transparency", desc: "We keep tamper-proof logs of every data access event. You can see exactly when and why your data was accessed — complete transparency, always.", color: "#00e5ff" },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                className="bg-[#120b18] p-8 rounded-2xl border group hover:shadow-xl transition-all"
                                style={{ borderColor: `${item.color}30` }}
                            >
                                <item.icon size={36} style={{ color: item.color }} className="mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="font-orbitron font-bold text-white text-lg mb-3">{item.title}</h4>
                                <p className="text-gray-400 text-sm font-inter leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center py-20">
                    <h2 className="text-4xl md:text-6xl font-orbitron text-white font-black mb-8">READY TO TRY IT <span className="text-cyberNeon">FOR FREE?</span></h2>
                    <p className="text-gray-400 font-inter text-xl max-w-2xl mx-auto mb-12">All these features are live and ready for you — it takes less than a minute to get started.</p>
                    <Link to="/register" className="inline-flex items-center gap-4 bg-cyberNeon text-[#050308] font-orbitron font-bold py-6 px-16 rounded-xl hover:bg-white transition-all text-xl shadow-[0_0_30px_rgba(255,90,0,0.5)]">
                        GET STARTED FREE <ArrowRight size={24} />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default Features;
