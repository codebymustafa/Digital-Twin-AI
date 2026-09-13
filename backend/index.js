import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import User from "./models/User.js";
import Chat from "./models/Chat.js";
import askHF from "./models/aiService.js";
import connectiondb from "./Configuration/dbConnection.js";

import authRoutes from "./routes/auth.js";
import cloneRoutes from "./routes/clone.js";
import aiRoutes from "./routes/ai.js";
import chatRoutes from "./routes/chat.js";
import psxRoutes from "./routes/psx.js";
import adminRoutes from "./routes/admin.js";

import { isPSXRelated, getMarketContextForAI } from "./services/psxService.js";
import { detectTopics, extractWikiTopic, extractBookQuery } from "./services/topicDetector.js";
import {
  buildContextString,
  getInvestmentContext,
  getWikipediaSummary,
  searchBooks,
  getTimeContext,
  getCoinPrice,
  getIslamicDate
} from "./services/liveDataService.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/clone", cloneRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/psx", psxRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("🚀 Digital Twin Server Running"));

connectiondb();

async function buildSocketLiveContext(message, personality) {
  const topics = detectTopics(message);
  let liveCtx = "";

  liveCtx += getTimeContext(message);

  if (isPSXRelated(message)) {
    try {
      const psxContext = await getMarketContextForAI();
      liveCtx += psxContext;
      liveCtx += `\n\nINSTRUCTIONS FOR PSX ANSWERS:
1. Use the live PSX data above to answer with REAL, SPECIFIC numbers.
2. When asked if it's a good time to invest:
   - Monthly >3%: Bullish — potentially good entry for long-term investors.
   - Near 52-week high: high risk of short-term pullback, advise caution.
   - Monthly <-3%: Correction — risky short-term, possible discount long-term.
3. For specific stocks: give price, daily change, 1-month trend, 52-week range.
4. Consider user Risk Tolerance (${personality?.riskTaking ?? 50}/100) in advice.
5. ALWAYS end investment advice with: "⚠️ Investing carries risk. Consult a SECP-registered financial advisor."`;
    } catch (e) {
    }
  }

  const isFinance = isPSXRelated(message) || topics.includes("gold") || topics.includes("currency") || topics.includes("fuel") || topics.includes("crypto");
  if (isFinance) {
    try { liveCtx += await getInvestmentContext(); } catch { /* skip */ }
  }

  if (topics.includes("wikipedia")) {
    const wikiTopic = extractWikiTopic(message);
    if (wikiTopic) {
      try {
        const wiki = await getWikipediaSummary(wikiTopic);
        if (wiki) liveCtx += `\n[WIKIPEDIA: ${wiki.title}]\n${wiki.extract}\nSource: ${wiki.url}`;
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

  if (topics.includes("books")) {
    const bookQuery = extractBookQuery(message);
    if (bookQuery) {
      try {
        const books = await searchBooks(bookQuery);
        if (books?.length) {
          liveCtx += `\n[OPEN LIBRARY: "${bookQuery}"]\n` +
            books.map((b, i) => `  ${i + 1}. "${b.title}" by ${b.author} (${b.year})`).join("\n");
        }
      } catch { /* skip */ }
    }
  }

  const standardTopics = topics.filter(t => !["wikipedia", "books"].includes(t));
  if (standardTopics.length > 0) {
    try { liveCtx += await buildContextString(standardTopics, message); } catch { /* skip */ }
  }

  if (topics.includes("crypto")) {
    const specificCoinMatch = message.match(/\b(shib(?:a)?(?:\s*inu)?|avax|avalanche|litecoin|ltc|polkadot|dot|chainlink|link|uniswap|uni|tron|trx|matic|polygon|ton|near|sui|pepe|floki|kas|kaspa|injective|inj|sei|render|rndr)\b/i);
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

function buildSystemPrompt(user, mode, moodContext) {
  const p = user.personality || {};
  const riskTaking = p.riskTaking ?? 50;
  const introvertExtrovert = p.introvertExtrovert ?? 50;
  const interests = p.interests ?? [];
  const goals = p.goals ?? [];
  const moodHistory = p.behaviorTrends?.moodHistory ?? [];
  const dailyChats = p.behaviorTrends?.dailyChats ?? 0;
  const twinVoice = user.twinVoice || 'Analyst';

  const recentMoods = moodHistory.slice(-7);
  const stressCount = recentMoods.filter(m => m === "stressed" || m === "bad").length;
  const moodTrend = stressCount >= 4 ? "high-stress week" : stressCount >= 2 ? "moderate stress" : "stable/positive";

  let voiceInstruction = "";
  if (twinVoice === "Stoic") {
    voiceInstruction = "SYNTHESIS VOICE PERSONA — STOIC: Adopt a calm, grounded, Marcus Aurelius/Epictetus stoic tone. Help the user distinguish what is within their control from what is not. Emphasize emotional resilience, clarity, and mental discipline.";
  } else if (twinVoice === "Motivator") {
    voiceInstruction = "SYNTHESIS VOICE PERSONA — MOTIVATOR: Adopt a high-energy, empowering, action-oriented coaching tone. Focus on immediate breakthroughs, strong encouragement, relentless positivity, and eliminating self-doubt.";
  } else {
    voiceInstruction = "SYNTHESIS VOICE PERSONA — ANALYST: Adopt a highly logical, precise, data-driven analytical tone. Use structured reasoning, clear metrics, probability assessments, and objective steps.";
  }

  let prompt = `You are Digital Twin — the intelligent, logical, and calm AI version of ${user.username}.
You can answer ALL types of questions: general knowledge, science, math, coding, history, philosophy, career, health, relationships, finance, Pakistan news, cricket, prayer times, space, books, and casual chat.
You have real-time access to live data: PSX stock market, gold prices, currency rates, Pakistan news, cricket scores, prayer times, Pakistan holidays, NASA space data, air quality, weather, Wikipedia, and OpenLibrary.

[DIGITAL TWIN IDENTITY PROFILE — ${user.username}]
Personality:
  • Voice Synthesis Mode: ${twinVoice}
  • Risk Tolerance: ${riskTaking}/100 — ${riskTaking >= 70 ? "bold and risk-tolerant; recommend ambitious options first" : riskTaking <= 30 ? "cautious and risk-averse; recommend safe, stable options first" : "balanced; present both safe and bold options"}
  • Social Style: ${introvertExtrovert}/100 — ${introvertExtrovert >= 70 ? "extroverted; enjoys collaborative, social-based strategies" : introvertExtrovert <= 30 ? "introverted; prefers solo, deep-focus, independent strategies" : "ambivert; flexible approach"}
${interests.length ? `  • Interests: ${interests.join(", ")}` : ""}
${goals.length ? `  • Goals: ${goals.join(", ")}` : ""}

Behavioral Telemetry:
  • Recent mood trend (7 days): ${moodTrend}
  • Daily chat activity: ${dailyChats > 0 ? `${dailyChats} interactions — active user` : "new/inactive user"}
  
[VOICE SYNTHESIS INSTRUCTION]
${voiceInstruction}

Decision Rules:
  • Always tailor investment advice to the user's risk profile (${riskTaking}/100)
  • For introverted users (score: ${introvertExtrovert}): suggest solo, self-directed approaches
  • For extroverted users: suggest community, mentorship, team-based approaches
  • During high-stress weeks: be extra gentle, avoid overwhelming complexity
  • Mode: ${mode || "normal"}

Be warm, natural, and direct. Address ${user.username} by name occasionally. Never refuse normal questions.`;

  if (moodContext && typeof moodContext === "string" && moodContext.trim()) {
    prompt += `\n\n${moodContext}\n\nIMPORTANT: Always factor in the user's current mood, energy, and focus levels above. Adapt your tone, advice depth, and urgency accordingly.`;
  }

  return prompt;
}

io.on("connection", (socket) => {
  socket.on("join", ({ userId }) => {
    if (!userId) return;
    socket.join(userId);
  });

  socket.on("send_message", async (data) => {
    const { userId, message, mode, moodContext } = data;
    if (!userId || !message) return;

    try {
      const user = await User.findById(userId);
      if (!user) return;

      let chat = await Chat.findOne({ userId });
      if (!chat) chat = new Chat({ userId, messages: [] });
      if (!chat.messages) chat.messages = [];

      chat.messages.push({ role: "user", content: message });

      let systemPrompt = buildSystemPrompt(user, mode, moodContext);

      const asksAboutPast = /\b(past|history|previously|last time|remember|recall|what did i|what was my|yesterday|ago|before|discussed|we talk)\b/i.test(message);
      const asksAboutFuture = /\b(predict|future|forecast|will happen|will it|prediction|expect|next year|in 2027|in 2030)\b/i.test(message);

      if ((asksAboutPast || asksAboutFuture) && chat.messages.length > 1) {
          const previousMessages = chat.messages.slice(0, -1);
          const stopWords = new Set(['what', 'did', 'i', 'say', 'about', 'you', 'remember', 'recall', 'the', 'a', 'is', 'to', 'was', 'my', 'past', 'history', 'time', 'we', 'talk']);
          const queryKeywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
          let matchedTurns = [];
          
          if (queryKeywords.length > 0) {
              for (let i = 0; i < previousMessages.length - 1; i++) {
                  const msg = previousMessages[i];
                  if (msg.role === 'user') {
                      const text = msg.content.toLowerCase();
                      const matches = queryKeywords.some(kw => text.includes(kw));
                      if (matches) {
                          const nextMsg = previousMessages[i + 1];
                          matchedTurns.push(`- User: "${msg.content}" (Date: ${msg.timestamp ? new Date(msg.timestamp).toDateString() : 'Past'})\n  Twin: "${nextMsg ? nextMsg.content : ''}"`);
                          if (matchedTurns.length >= 8) break;
                      }
                  }
              }
          }
          
          if (matchedTurns.length === 0) {
              const sliceCount = Math.min(previousMessages.length, 20);
              const recentMessages = previousMessages.slice(-sliceCount);
              matchedTurns = recentMessages.map(m => `- ${m.role === 'user' ? 'User' : 'Twin'}: "${m.content}"`);
          }
          
          systemPrompt += `\n\n[USER PAST CHAT RECORDS & HISTORY (MATCHED)]\n${matchedTurns.join('\n')}`;
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

      const liveCtx = await buildSocketLiveContext(message, user.personality);
      if (liveCtx) {
        systemPrompt += `\n\n[LIVE REAL-TIME DATA — use this to answer accurately]${liveCtx}`;
      }

      const historyForAI = chat.messages
        .slice(-9, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      const replyText = await askHF(message, historyForAI, systemPrompt);

      chat.messages.push({ role: "assistant", content: replyText, emotion: "neutral" });
      await chat.save();

      try {
        user.personality.behaviorTrends.dailyChats = (user.personality.behaviorTrends.dailyChats || 0) + 1;
        await user.save();
      } catch { /* non-critical */ }

      io.to(userId).emit("receive_message", {
        message: replyText,
        emotion: "neutral",
        risk_assessment: "N/A",
        timestamp: new Date(),
      });

    } catch (error) {
      console.error("Socket AI/DB Error:", error.message);
      io.to(userId).emit("receive_message", {
        message: "I'm having a quick glitch. Please send your message again!",
        emotion: "neutral",
        risk_assessment: "N/A",
        timestamp: new Date(),
      });
    }
  });

  socket.on("disconnect", () => {
  });
});

app.set("io", io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});