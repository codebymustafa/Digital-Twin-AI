import React, { useState, useEffect } from 'react';
import { Download, Share2, Award, CheckCircle, TrendingUp, Cpu, Check } from 'lucide-react';

const WeeklyReportCard = () => {
    const [stats, setStats] = useState([
        { label: 'Total Decisions', value: '0', icon: CheckCircle, color: '#00e5ff' },
        { label: 'Logic Efficiency', value: '0%', icon: Cpu, color: '#ff5a00' },
        { label: 'Goal Progress', value: '0%', icon: TrendingUp, color: '#a200ff' },
    ]);
    const [periodText, setPeriodText] = useState('');
    const [verdictText, setVerdictText] = useState('');
    const [globalRank, setGlobalRank] = useState('Top 50%');
    const [copiedNotification, setCopiedNotification] = useState(false);

    useEffect(() => {
        const decisions = JSON.parse(localStorage.getItem('decisionJournal') || '[]');
        const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');

        const today = new Date();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const options = { month: 'short', day: 'numeric' };
        const periodStr = `${sevenDaysAgo.toLocaleDateString('en-US', options)} - ${today.toLocaleDateString('en-US', options)}`;
        setPeriodText(periodStr);

        const avgScore = decisions.length > 0
            ? (decisions.reduce((s, e) => s + (e.rating?.score || 3), 0) / decisions.length)
            : 0;
        const logicPct = decisions.length > 0 ? Math.round((avgScore / 5) * 100) : 0;

        let goalProgressPct = 0;
        if (goals.length > 0) {
            const totalSteps = goals.reduce((sum, g) => sum + (g.steps?.length || 0), 0);
            const completedSteps = goals.reduce((sum, g) => sum + (g.steps?.filter(s => s.done).length || 0), 0);
            const completedGoals = goals.filter(g => g.completed).length;
            goalProgressPct = totalSteps > 0 
                ? Math.round((completedSteps / totalSteps) * 100) 
                : Math.round((completedGoals / goals.length) * 100);
        }

        const decisionCountVal = String(decisions.length);

        setStats([
            { label: 'Total Decisions', value: decisionCountVal, icon: CheckCircle, color: '#00e5ff' },
            { label: 'Logic Efficiency', value: `${logicPct}%`, icon: Cpu, color: '#ff5a00' },
            { label: 'Goal Progress', value: `${goalProgressPct}%`, icon: TrendingUp, color: '#a200ff' },
        ]);

        let verdict = "";
        if (decisions.length === 0 && goals.length === 0) {
            verdict = "Neural core initialized. Log your first decisions in the Decision Journal and set goals to unlock your cognitive efficiency analysis.";
        } else {
            const averageScore = decisions.reduce((s, e) => s + (e.rating?.score || 3), 0) / (decisions.length || 1);
            const riskyCount = decisions.filter(d => d.rating?.label === 'Risky Move' || d.emotion === 'anxious').length;
            const calmCount = decisions.filter(d => d.emotion === 'calm' || d.emotion === 'confident').length;

            if (averageScore >= 4.0) {
                verdict = `Your twin confirms exceptional logic sync this week. By keeping emotional biases low and assessing options carefully, you achieved a logic efficiency of ${logicPct}%. Maintain this disciplined approach.`;
            } else if (riskyCount > 0) {
                verdict = `We detected ${riskyCount} risky decision vector(s) recently. Impulsive choices or heightened emotional state lowered your efficiency. Recommendation: Wait 24 hours on career or finance moves.`;
            } else if (calmCount > decisions.length / 2) {
                verdict = `Solid cognitive baseline. Your calm mental state during decisions has protected you from regret patterns. Continue logging goals and choices to further refine your silicon mirror.`;
            } else {
                verdict = `Evolving neural state across ${decisions.length} logged decision(s). Recommendation: Focus on breaking down larger goals into smaller daily steps.`;
            }
        }
        setVerdictText(verdict);

        let rank = "Top 50%";
        if (decisions.length === 0) rank = "Awaiting Log Entries";
        else if (logicPct >= 90) rank = "Top 5%";
        else if (logicPct >= 80) rank = "Top 10%";
        else if (logicPct >= 70) rank = "Top 20%";
        else if (logicPct >= 50) rank = "Top 35%";
        else rank = "Top 50%";
        setGlobalRank(rank);
    }, []);

    const handleExportReport = () => {
        let userObj = {};
        try { userObj = JSON.parse(sessionStorage.getItem('user') || '{}'); } catch {}
        const username = userObj.username || 'Neural Pioneer';

        const content = `
===================================================================
                  DIGITAL TWIN OS — WEEKLY REPORT
===================================================================
User: ${username.toUpperCase()}
Report Period: ${periodText}
Generated Date: ${new Date().toLocaleString()}

-------------------------------------------------------------------
METRICS SUMMARY:
-------------------------------------------------------------------
• Total Logged Decisions: ${stats[0].value}
• Logic Efficiency:      ${stats[1].value}
• Goal Progress:         ${stats[2].value}
• Global Twin Rank:      ${globalRank}

-------------------------------------------------------------------
DIGITAL TWIN VERDICT:
-------------------------------------------------------------------
"${verdictText}"

===================================================================
CONFIDENTIAL REPORT. GENERATED BY DIGITAL TWIN AI OS.
===================================================================
`;

        const blob = new Blob([content.trim()], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly_twin_report_${username.toLowerCase()}_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleShareReport = async () => {
        let userObj = {};
        try { userObj = JSON.parse(sessionStorage.getItem('user') || '{}'); } catch {}
        const username = userObj.username || 'User';

        const shareSummary = `📊 Digital Twin Weekly Report for ${username}:\n• Logic Efficiency: ${stats[1].value}\n• Goal Progress: ${stats[2].value}\n• Total Decisions: ${stats[0].value}\n• Verdict: "${verdictText}"\n\nGenerated by Digital Twin OS.`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Weekly Twin Report - ${username}`,
                    text: shareSummary
                });
                return;
            } catch (e) {
            }
        }

        try {
            await navigator.clipboard.writeText(shareSummary);
            setCopiedNotification(true);
            setTimeout(() => setCopiedNotification(false), 3000);
        } catch (e) {
            console.error("Clipboard copy failed:", e);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-3xl border border-cyberNeon/30 relative overflow-hidden bg-[#0a050d] group">
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,#ff5a00_0%,transparent_50%)]" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h2 className="font-orbitron text-xl text-white font-bold flex items-center gap-2">
                        <Award className="text-cyberNeon" /> Weekly Twin Report
                    </h2>
                    <p className="text-gray-500 text-xs font-mono mt-1 uppercase tracking-widest">Period: {periodText}</p>
                </div>
                <div className="flex items-center gap-2">
                    {copiedNotification && (
                        <span className="text-[10px] font-mono text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded flex items-center gap-1 animate-pulse">
                            <Check size={10} /> Copied!
                        </span>
                    )}
                    <button 
                        onClick={handleShareReport}
                        title="Share Report"
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                        <Share2 size={16} />
                    </button>
                    <button 
                        onClick={handleExportReport}
                        title="Export Report"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyberNeon/10 border border-cyberNeon/30 text-cyberNeon text-xs font-mono hover:bg-cyberNeon hover:text-black transition-all cursor-pointer font-bold"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
                {stats.map((s, i) => (
                    <div key={i} className="bg-[#120b18] border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <s.icon size={14} style={{ color: s.color }} />
                            <span className="text-gray-500 text-[10px] font-mono uppercase">{s.label}</span>
                        </div>
                        <div className="text-2xl font-orbitron font-black text-white">{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-cyberNeon/5 border border-cyberNeon/20 p-4 rounded-2xl relative z-10">
                <h3 className="text-cyberNeon font-mono text-xs font-bold mb-2 flex items-center gap-1">
                    <TrendingUp size={14} /> TWIN VERDICT:
                </h3>
                <p className="text-gray-300 text-sm font-inter leading-relaxed">
                    "{verdictText}"
                </p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a050d] bg-gradient-to-tr from-cyberNeon to-cyberPink flex items-center justify-center text-[10px] text-white font-bold">
                            #{i}
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-[#0a050d] bg-[#120b18] flex items-center justify-center text-[10px] text-gray-500 font-bold">
                        +5
                    </div>
                </div>
                <span className="text-xs font-mono text-gray-600">Global Twin Rank: <span className="text-white">{globalRank}</span></span>
            </div>
        </div>
    );
};

export default WeeklyReportCard;
