import express from 'express';
import askHF from '../models/aiService.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { getMarketContextForAI, isPSXRelated, getKSE100 } from '../services/psxService.js';
import { detectTopics, extractWikiTopic, extractBookQuery } from '../services/topicDetector.js';
import {
    buildContextString, getInvestmentContext, extractPrayerCity,
    getWikipediaSummary, searchBooks, getIslamicDate, getCoinPrice, getPrayerTimes
} from '../services/liveDataService.js';

const router = express.Router();

async function buildLiveContext(message, personality = null) {
    const topics = detectTopics(message);
    let liveCtx = '';

    if (isPSXRelated(message)) {
        try {
            liveCtx += await getMarketContextForAI();
            liveCtx += `\n\nINSTRUCTIONS FOR PSX ANSWERS:
1. Use the live PSX data above to answer with REAL, SPECIFIC numbers.
2. When asked if it's a good time to invest:
   - Monthly >3%: Bullish â€” potentially good entry for long-term investors.
   - Near 52-week high: high risk of short-term pullback, advise caution.
   - Monthly <-3%: Correction phase â€” risky short-term, possible discount long-term.
3. For specific stocks: give current price, daily change, 1-month trend, 52-week range.
4. Consider user Risk Tolerance (${personality?.riskTaking ?? 50}/100) in advice.
5. ALWAYS end investment advice with: "âš ï¸ Investing carries risk. Consult a SECP-registered financial advisor."`;
        } catch (e) {
        }
    }

    const isFinanceQuery = isPSXRelated(message) || topics.includes('gold') || topics.includes('currency') || topics.includes('fuel') || topics.includes('crypto');
    if (isFinanceQuery) {
        try {
            liveCtx += await getInvestmentContext();
        } catch { /* skip */ }
    }

    if (topics.includes('wikipedia')) {
        const wikiTopic = extractWikiTopic(message);
        if (wikiTopic) {
            try {
                const wiki = await getWikipediaSummary(wikiTopic);
                if (wiki) {
                    liveCtx += `\n[WIKIPEDIA: ${wiki.title}]\n${wiki.extract}\nSource: ${wiki.url}`;
                }
            } catch { /* skip */ }
        }
    }

    if (topics.includes('books')) {
        const bookQuery = extractBookQuery(message);
        if (bookQuery) {
            try {
                const books = await searchBooks(bookQuery);
                if (books?.length) {
                    liveCtx += `\n[OPEN LIBRARY BOOK RESULTS for "${bookQuery}"]\n` +
                        books.map((b,i) => `  ${i+1}. "${b.title}" by ${b.author} (${b.year})${b.subject ? ` â€” ${b.subject}` : ''}`).join('\n');
                }
            } catch { /* skip */ }
        }
    }

    if (topics.includes('islamic')) {
        try {
            const islamicDate = await getIslamicDate();
            if (islamicDate) {
                const eventsNote = islamicDate.holidays?.length ? `\nIslamic Events Today: ${islamicDate.holidays.join(', ')}` : '';
                liveCtx += `\n[ISLAMIC / HIJRI DATE]\nToday is ${islamicDate.formatted} (${islamicDate.hijriWeekday})\nMonth: ${islamicDate.hijriMonth} | Year: ${islamicDate.hijriYear} AH${eventsNote}\nSource: aladhan.com | Cross-reference: Hamariweb.com/islamiccalendar`;
            }
        } catch { /* skip */ }
    }

    if (topics.includes('prayer') || topics.includes('islamic')) {
        try {
            const prayerCity = extractPrayerCity(message) || 'Karachi';
            const prayerData = await getPrayerTimes(prayerCity);
            if (prayerData) {
                liveCtx += `\n[PRAYER TIMES â€” ${prayerCity}${prayerData.country ? ', ' + prayerData.country : ''} | ${prayerData.date}]\nFajr: ${prayerData.Fajr} | Sunrise: ${prayerData.Sunrise} | Dhuhr: ${prayerData.Dhuhr} | Asr: ${prayerData.Asr} | Maghrib: ${prayerData.Maghrib} | Isha: ${prayerData.Isha}\nSource: Aladhan.com (accurate astronomical calculation)`;
            }
        } catch { /* skip */ }
    }

    const standardTopics = topics.filter(t => !['wikipedia', 'books'].includes(t));
    if (standardTopics.length > 0) {
        try {
            liveCtx += await buildContextString(standardTopics, message);
        } catch { /* skip */ }
    }

    if (topics.includes('crypto')) {
        const specificCoinMatch = message.match(/\b(shib(?:a)?(?:\s*inu)?|avax|avalanche|litecoin|ltc|polkadot|dot|chainlink|link|uniswap|uni|tron|trx|matic|polygon|ton|near|sui|pepe|floki|kas|kaspa|injective|inj|sei|render|rndr|bitcoin|btc|ethereum|eth|solana|sol|xrp|bnb|doge(?:coin)?|cardano|ada)\b/i);
        if (specificCoinMatch) {
            try {
                const coinData = await getCoinPrice(specificCoinMatch[1]);
                if (coinData) {
                    const chg = coinData.change24h !== null ? ` | 24h: ${coinData.change24h >= 0 ? '+' : ''}${coinData.change24h}%` : '';
                    liveCtx += `\n[SPECIFIC COIN: ${coinData.name} (${coinData.symbol})]\nPrice: $${coinData.usd?.toLocaleString()} USD | PKR ${coinData.pkr?.toLocaleString()}${chg}\nSource: ${coinData.source}`;
                }
            } catch { /* skip */ }
        }
    }

    return liveCtx;
}

router.post('/chat', async (req, res) => {
    const { message, history = [], context, moodContext } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
        const userId = context?.userId;
        let personality = context?.personality || null;
        if (!personality && userId) {
            try {
                const dbUser = await User.findById(userId);
                if (dbUser) personality = dbUser.personality;
            } catch (e) { /* skip */ }
        }

        const riskTaking = personality?.riskTaking ?? 50;
        const introvertExtrovert = personality?.introvertExtrovert ?? 50;
        const interests = personality?.interests ?? [];
        const goals = personality?.goals ?? [];

        let systemPrompt = `You are Digital Twin, a highly capable, warm, and intelligent AI assistant â€” the logical, calm version of the user.
You can answer ALL types of questions: coding, science, math, general knowledge, history, philosophy, relationships, career, health, casual chat, Pakistan news, sports, finance, space, religion, books, and more.
You have real-time access to live data including: PSX stock market, gold prices, currency rates, Pakistan news, cricket scores, prayer times, Pakistan holidays, NASA space data, air quality, weather, and Wikipedia knowledge.
Be conversational, precise, and helpful. Keep answers concise unless detail is needed.

SOURCE CITATION RULE: At the end of every answer that uses live data, news, prices, or factual information from external sources, you MUST add a line like:
**Sources:** [Source1], [Source2] â€” listing where the information came from (e.g. BBC Sport, CoinGecko, ARY News, aladhan.com, etc).`;

        if (context?.username) {
            systemPrompt += `\n\nThe user's name is ${context.username}. Address them by name occasionally.`;
        }

        systemPrompt += `\n\n[USER PERSONALITY PROFILE]
- Risk Tolerance: ${riskTaking}/100 (${riskTaking >= 70 ? 'bold, risk-tolerant' : riskTaking <= 30 ? 'cautious, risk-averse' : 'balanced'})
- Social Style: ${introvertExtrovert}/100 (${introvertExtrovert >= 70 ? 'extroverted â€” enjoys social, team-based solutions' : introvertExtrovert <= 30 ? 'introverted â€” prefers solo, deep-focus strategies' : 'ambivert â€” flexible'})${interests.length ? `\n- Interests: ${interests.join(', ')}` : ''}${goals.length ? `\n- Goals: ${goals.join(', ')}` : ''}
Tailor all advice to match this personality profile. Introverts get solo strategies; extroverts get collaborative suggestions. Risk-averse users get safer options highlighted first.`;

        if (moodContext && typeof moodContext === 'string' && moodContext.trim()) {
            systemPrompt += `\n\n${moodContext}\n\nIMPORTANT: Always factor in the user's current mood, energy, and focus levels above when crafting your response. Adapt tone, advice depth, and urgency accordingly.`;
        }

        const asksAboutPast = /\b(past|history|previously|last time|remember|recall|what did i|what was my|yesterday|ago|before|discussed|we talk)\b/i.test(message);
        const asksAboutFuture = /\b(predict|future|forecast|will happen|will it|prediction|expect|next year|in 2027|in 2030)\b/i.test(message);

        if ((asksAboutPast || asksAboutFuture) && userId) {
            try {
                const dbChat = await Chat.findOne({ userId });
                if (dbChat && dbChat.messages && dbChat.messages.length > 0) {
                    const stopWords = new Set(['what', 'did', 'i', 'say', 'about', 'you', 'remember', 'recall', 'the', 'a', 'is', 'to', 'was', 'my', 'past', 'history', 'time', 'we', 'talk']);
                    const queryKeywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
                    let matchedTurns = [];
                    
                    if (queryKeywords.length > 0) {
                        for (let i = 0; i < dbChat.messages.length - 1; i++) {
                            const msg = dbChat.messages[i];
                            if (msg.role === 'user') {
                                const text = msg.content.toLowerCase();
                                const matches = queryKeywords.some(kw => text.includes(kw));
                                if (matches) {
                                    const nextMsg = dbChat.messages[i + 1];
                                    matchedTurns.push(`- User: "${msg.content}" (Date: ${msg.timestamp ? new Date(msg.timestamp).toDateString() : 'Past'})\n  Twin: "${nextMsg ? nextMsg.content : ''}"`);
                                    if (matchedTurns.length >= 8) break;
                                }
                            }
                        }
                    }
                    
                    if (matchedTurns.length === 0) {
                        const sliceCount = Math.min(dbChat.messages.length, 20);
                        const recentMessages = dbChat.messages.slice(-sliceCount);
                        matchedTurns = recentMessages.map(m => `- ${m.role === 'user' ? 'User' : 'Twin'}: "${m.content}"`);
                    }
                    
                    systemPrompt += `\n\n[USER PAST CHAT RECORDS & HISTORY (MATCHED)]\n${matchedTurns.join('\n')}`;
                }
            } catch (e) {
            }
        }

        if (asksAboutFuture) {
            systemPrompt += `\n\n[SPECIAL PROTOCOL: FUTURE PREDICTION]
The user is asking you for a future prediction or forecast.
1. Use all available live real-time data, news, and current trends to make a grounded, logical prediction.
2. Consider the user's past records and choices (if any) to project their personal trajectory.
3. Tailor the prediction specifically to the user's personality:
   - For Risk-Tolerant users (risk comfort >= 65): Highlight high-growth potential, bold avenues, and calculated risk-taking.
   - For Risk-Averse users (risk comfort <= 35): Focus on long-term stability, wealth preservation, and risk mitigation strategies.
   - For Introverts: Focus on independent ventures, remote work trends, or solo self-learning.
   - For Extroverts: Highlight networking, partnerships, community leadership, and social growth.
4. Give a realistic, encouraging, yet logical prediction. Be clear, realistic, and do not use generic AI boilerplate warnings unless required.`;
        }

        const liveCtx = await buildLiveContext(message, personality);
        if (liveCtx) {
            systemPrompt += `\n\n[LIVE REAL-TIME DATA â€” use this to answer accurately]${liveCtx}`;
        }

        const formattedHistory = (history || [])
            .filter(m => m.role && m.content)
            .map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }))
            .slice(-10);

        const reply = await askHF(message.trim(), formattedHistory, systemPrompt);
        return res.json({ response: reply });

    } catch (error) {
        console.error('AI Route Error:', error.message);
        return res.status(500).json({ error: 'Neural link interrupted. Please try again.' });
    }
});


router.post('/local', async (req, res) => {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: 'Message is required.' });
    }
        const localSys = `You are Local Twin, a helpful AI assistant for users without login.
Answer general knowledge questions helpfully, warmly, and accurately on any topic.
If the question is about deep stock trading, investments, or PSX portfolio recommendations, provide a brief helpful overview and explicitly suggest: "💡 Note: For deeper personalized analysis, risk profiling, and full investment simulations, log in to use your full Digital Twin Chat."
Always end your response with:
Sources: [List specific sources used, e.g. Wikipedia, BBC News, PSX, OpenMeteo, Aladhan, CoinGecko, or General Knowledge].
Do not choose, promote, or discuss self-harm, suicide, violence, death, or illegal acts.`;
    try {
        const liveCtx = await buildLiveContext(message, null);
        const finalPrompt = liveCtx ? localSys + '\n\n[LIVE DATA]\n' + liveCtx : localSys;
        const formattedHistory = history.filter(m => m.role && m.content).slice(-6).map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }));
        const reply = await askHF(message.trim(), formattedHistory, finalPrompt);
        return res.json({ response: reply });
    } catch (error) {
        console.error('Local AI Error:', error.message);
        return res.status(500).json({ error: 'AI service unavailable. Please try again.' });
    }
});

router.post('/simulate', async (req, res) => {
    const { optionA, optionB, userPersonality, todayMood, todayEnergy } = req.body;

    if (!optionA || !optionB) {
        return res.status(400).json({ error: 'Both options are required.' });
    }

    const forbiddenPatterns = /(suicide|kill myself|self-harm|harm myself|end my life|die|murder|overdose|cut myself|hang myself)/i;
    if (forbiddenPatterns.test(optionA) || forbiddenPatterns.test(optionB)) {
        return res.json({
            refused: true,
            winner: null,
            scoreA: 0,
            scoreB: 0,
            reason: "Digital Twin AI cannot simulate or choose options involving suicide, self-harm, violence, or death. If you or someone you know is going through a difficult time, please reach out to trusted mental health professionals or emergency support services immediately."
        });
    }

    try {
        const riskTaking = Number(userPersonality?.riskTaking ?? 50);
        const goals = userPersonality?.goals ?? [];

        const evaluateText = (text) => {
            const clean = text.toLowerCase().trim();
            let base = 50;
            const highValue = ['study', 'learn', 'work', 'save', 'invest', 'sleep', 'exercise', 'health', 'prepare', 'career', 'budget', 'plan', 'long-term', 'research', 'calm', 'patience', 'skill', 'build', 'discipline', 'education', 'family'];
            const penalty = ['gamble', 'yolo', 'all in', 'impulsive', 'ignore', 'spend all', 'quit without', 'lazy', 'procrastinate', 'rush', 'angry', 'fomo', 'reckless', 'waste', 'borrow', 'debt'];

            highValue.forEach(word => {
                if (clean.includes(word)) base += 9;
            });
            penalty.forEach(word => {
                if (clean.includes(word)) base -= 12;
            });

            if (clean.length > 25) base += 3;
            return base;
        };

        let rawA = evaluateText(optionA);
        let rawB = evaluateText(optionB);

        if (riskTaking > 60) {
            if (/invest|crypto|business|startup|venture|launch/i.test(optionA)) rawA += 6;
            if (/invest|crypto|business|startup|venture|launch/i.test(optionB)) rawB += 6;
        } else if (riskTaking < 40) {
            if (/save|stable|secure|safe|keep|steady/i.test(optionA)) rawA += 6;
            if (/save|stable|secure|safe|keep|steady/i.test(optionB)) rawB += 6;
        }

        const isFinA = isPSXRelated(optionA);
        const isFinB = isPSXRelated(optionB);
        if (isFinA || isFinB) {
            try {
                const kse = await getKSE100();
                const chg = kse?.dayChangePct || 0;
                if (isFinA) rawA += Math.round(chg * 2);
                if (isFinB) rawB += Math.round(chg * 2);
            } catch { /* skip */ }
        }

        if (rawA === rawB) {
            const hashA = optionA.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const hashB = optionB.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            if (hashA >= hashB) rawA += 3;
            else rawB += 3;
        }

        const total = Math.max(1, rawA + rawB);
        let scoreA = Math.round((rawA / total) * 100);
        scoreA = Math.min(88, Math.max(12, scoreA));
        const scoreB = 100 - scoreA;
        const winner = scoreA >= scoreB ? 'A' : 'B';

        const systemPrompt = `You are an objective life decision simulator.
Analyze Option A versus Option B logically.
Provide a clear, cohesive explanation in 2 to 3 calm, human sentences explaining why Option ${winner} is the superior choice for long term stability and progress.
Do not use any emojis, asterisks, bullet points, numbering, or "Important:" labels. Write only smooth standard text.`;

        const promptText = `Evaluate Option A: "${optionA}" vs Option B: "${optionB}". Option ${winner} won with ${winner === 'A' ? scoreA : scoreB}% versus ${winner === 'A' ? scoreB : scoreA}%.`;
        let aiReason = '';
        try {
            aiReason = await askHF(promptText, [], systemPrompt);
            aiReason = aiReason.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
            aiReason = aiReason.replace(/[*_#`]/g, '').trim();
        } catch (e) {
            aiReason = `Option ${winner} demonstrates greater strategic value and reduces operational risk compared to the alternative. It offers a more sustainable path aligned with balanced decision making.`;
        }

        return res.json({
            winner,
            scoreA,
            scoreB,
            reason: aiReason || `Option ${winner} provides a more resilient balance between immediate effort and long term outcome.`
        });

    } catch (error) {
        console.error('Simulation Route Error:', error.message);
        return res.status(500).json({ error: 'Simulation processor interrupted. Please try again.' });
    }
});

export default router;

