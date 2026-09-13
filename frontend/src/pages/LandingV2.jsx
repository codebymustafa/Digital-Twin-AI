import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, BrainCircuit, Fingerprint, Zap, 
  Database, ChevronDown, Radio, Sparkles 
} from 'lucide-react';

const ParticleNetwork = () => {
  const points = useRef();
  const particleCount = 4000;
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++) {
       pos[i*3] = (Math.random() - 0.5) * 40;
       pos[i*3+1] = (Math.random() - 0.5) * 40;
       pos[i*3+2] = (Math.random() - 0.5) * 20;
       col[i*3] = i % 2 === 0 ? 0.0 : 1.0; 
       col[i*3+1] = i % 2 === 0 ? 0.9 : 0.0; 
       col[i*3+2] = i % 2 === 0 ? 1.0 : 0.9; 
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (points.current) {
        points.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        points.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.4} sizeAttenuation />
    </points>
  );
};

const Typewriter = ({ text, delay = 0 }) => {
    const [displayed, setDisplayed] = useState("");
    useEffect(() => {
        let i = 0;
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                if (i < text.length) {
                    setDisplayed(prev => prev + text.charAt(i));
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 40);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timer);
    }, [text, delay]);
    return <span>{displayed}<span className="animate-pulse">_</span></span>;
};

const LandingV2 = () => {
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 0.4], [0, -200]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const scaleHero = useTransform(scrollYProgress, [0, 0.4], [1, 0.9]);


    return (
        <div className="min-h-screen bg-[#050308] text-white selection:bg-cyberNeon selection:text-black">
            
            <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Canvas camera={{ position: [0, 0, 10] }}>
                        <ParticleNetwork />
                    </Canvas>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050308]/40 to-[#050308]" />
                </div>
                
                <motion.div style={{ y: yHero, opacity: opacityHero, scale: scaleHero }} className="relative z-10 text-center px-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyberNeon/30 bg-cyberNeon/5 text-cyberNeon text-[10px] sm:text-xs font-mono mb-8 tracking-[0.3em] animate-pulse uppercase"
                    >
                        <Radio size={14} className="animate-pulse" /> Now Live — Meet Your Digital Twin
                    </motion.div>
                    
                    <h1 className="text-[12vw] sm:text-[10vw] lg:text-[8rem] font-orbitron font-black text-white leading-none tracking-tighter mb-4 uppercase">
                        Digital <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyberNeon via-white to-cyberPink">Twin AI</span>
                    </h1>
                    
                    <p className="text-gray-400 font-inter text-lg md:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed h-[3em]">
                        <Typewriter text="A version of you that doesn't panic. A version of you that never makes mistakes. A version of you that is ready." delay={1000} />
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link to="/login" className="group relative px-12 py-5 bg-cyberNeon text-black font-orbitron font-black rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.4)] hover:shadow-[0_0_80px_rgba(0,229,255,0.6)] transition-all flex items-center gap-3 text-lg overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
                            GET STARTED <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                        <Link to="/features" className="px-12 py-5 border border-white/10 glass-panel text-white font-orbitron font-bold rounded-2xl hover:bg-white hover:text-black transition-all text-lg group">
                            SEE FEATURES <Sparkles size={18} className="inline ml-2 group-hover:rotate-180 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
                
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
                    <ChevronDown size={32} className="text-white" />
                </div>
            </section>

            <section className="py-40 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <span className="font-mono text-cyberPink text-xs tracking-[0.5em] uppercase">How We Started</span>
                        <h2 className="text-5xl md:text-7xl font-orbitron font-black tracking-tighter leading-tight">
                            YOUR SMARTER SELF, <br/> <span className="text-cyberNeon">ALWAYS AVAILABLE.</span>
                        </h2>
                        <p className="text-xl text-gray-400 font-inter leading-relaxed">
                            We all have moments of clarity — when we think calmly, decide wisely, and see situations clearly. Digital Twin was built to capture that version of you and make it available 24/7, even when life gets overwhelming.
                        </p>
                        <div className="flex gap-10">
                            <div>
                                <h4 className="text-white font-orbitron font-black text-4xl mb-1">2026</h4>
                                <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest">Founded</p>
                            </div>
                            <div>
                                <h4 className="text-white font-orbitron font-black text-4xl mb-1">0%</h4>
                                <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest">Cognitive Decay</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, skew: 5, scale: 0.9 }}
                        whileInView={{ opacity: 1, skew: 0, scale: 1 }}
                        className="relative"
                    >
                        <div className="absolute -inset-10 bg-cyberPink/10 blur-[100px] rounded-full" />
                        <div className="glass-panel p-1 border border-white/5 rounded-[3rem] overflow-hidden">
                             <img src="/neural_core.png" alt="Neural Core" className="w-full h-[600px] object-cover brightness-90 contrast-110" />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#050308] via-transparent to-transparent" />
                             <div className="absolute bottom-10 left-10 right-10 p-6 glass-panel border-white/10 rounded-2xl">
                                <p className="font-mono text-[10px] text-cyberNeon mb-2 uppercase tracking-widest">Core Status: Calibrated</p>
                                <p className="text-sm text-white font-inter">The neural engine processing your behavioral vectors with 98.9% parity.</p>
                             </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="py-40 bg-white/[0.02] relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-32">
                        <h2 className="text-4xl md:text-6xl font-orbitron font-black mb-6 uppercase">How Your Twin <span className="text-cyberNeon">Gets to Know You</span></h2>
                        <p className="text-gray-500 font-inter text-xl max-w-2xl mx-auto">4 simple steps — from signing up to having a Digital Twin that truly knows you.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { step: "01", title: "You Tell Us About Yourself", desc: "Answer a quick onboarding questionnaire about your personality, goals, and preferences.", icon: Fingerprint, color: "#00e5ff" },
                            { step: "02", title: "We Build Your Profile", desc: "Your personality data is securely stored and used to personalize every interaction.", icon: Database, color: "#ff5a00" },
                            { step: "03", title: "Your Twin Comes Alive", desc: "Live data feeds, mood tracking, and real-time chat connect to your personalized AI Twin.", icon: Zap, color: "#a200ff" },
                            { step: "04", title: "It Learns as You Grow", desc: "The more you interact, the better your Twin understands you — and the more useful it becomes.", icon: BrainCircuit, color: "#4ade80" },
                        ].map((s, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="glass-panel p-10 rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all group"
                            >
                                <span className="text-6xl font-orbitron font-black opacity-10 group-hover:opacity-40 transition-opacity mb-8 block" style={{ color: s.color }}>{s.step}</span>
                                <div className="p-4 rounded-2xl bg-white/5 w-max mb-6">
                                    <s.icon size={24} style={{ color: s.color }} />
                                </div>
                                <h3 className="text-xl font-orbitron font-bold text-white mb-4">{s.title}</h3>
                                <p className="text-gray-500 text-sm font-inter leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-40 relative flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyberNeon/15 via-transparent to-transparent pointer-events-none" />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    whileInView={{ opacity: 1, scale: 1 }} 
                    viewport={{ once: true }}
                    className="max-w-4xl px-6 relative z-10"
                >
                    <h2 className="text-6xl md:text-[8rem] font-orbitron font-black text-white leading-none tracking-tighter mb-10 drop-shadow-[0_0_30px_rgba(0,229,255,0.3)] uppercase">
                        Your Smarter Self <br/> <span className="text-cyberPink italic">Is One Click Away.</span>
                    </h2>
                    <p className="text-2xl text-gray-400 font-inter mb-16 max-w-2xl mx-auto">
                        Join users who are making better decisions with their Digital Twin. Free to start, no credit card needed.
                    </p>
                    <div className="relative group inline-block">
                        <div className="absolute -inset-2 bg-gradient-to-r from-cyberNeon to-cyberPink rounded-2xl blur-xl opacity-40 group-hover:opacity-100 transition-opacity animate-pulse" />
                        <Link to="/login" className="relative px-20 py-8 bg-black border border-white/20 text-white font-orbitron font-black text-3xl rounded-2xl hover:bg-white hover:text-black transition-all block">
                            GET STARTED FREE
                        </Link>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default LandingV2;
