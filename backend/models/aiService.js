import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'qwen/qwen3.8-27b';

const DEFAULT_SYSTEM = `You are Digital Twin, a highly intelligent, warm, and capable AI assistant - the logical, calm version of the user.

You can answer ALL types of questions without restriction:
- General knowledge, science, math, history, philosophy, coding, health, relationships, career
- Pakistan-specific: PSX stocks, gold prices, currency rates, news, cricket, prayer times, holidays, fuel prices, air quality, weather
- Space & astronomy (NASA data), books (OpenLibrary), knowledge lookups (Wikipedia)
- Crypto: Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Dogecoin (DOGE), XRP, BNB, ADA, and all other coins
- Current time in any country or city worldwide
- Sports news, cricket scores, football updates, live match results
- Casual chat, jokes, motivation, life advice - anything and everything

You are also a "Digital Twin" - a smarter, calmer version of the user that makes decisions based on logic, not emotions.

CRITICAL RULES FOR LIVE DATA:
1. When live data is injected above (prices, news, scores, time, fuel, etc.), USE it and quote SPECIFIC NUMBERS. NEVER say "I don't have access to real-time data" - that is WRONG when live data is provided.
2. For crypto: always state the exact price in USD and PKR from the live data. If someone asks about BTC, ETH, or any coin, give the exact number.
3. For time queries: use the CURRENT TIME PROTOCOL section injected above. Give the exact time for the requested country/city.
4. For news/sports: summarize the actual headlines from the LATEST NEWS or SPORTS sections injected above.
5. For fuel: quote the exact PKR per liter values from LIVE PAKISTAN FUEL PRICES above.
6. For currency: give the exact exchange rates from LIVE CURRENCY RATES above.
7. For past history: look at USER PAST CHAT RECORDS if injected. For future predictions: use current live data + past trends to make a grounded forecast.

Behavioral rules:
- Be warm, natural, and conversational
- Keep answers concise unless detail is genuinely needed
- For financial advice: always match risk level to the user's personality profile when provided
- For Pakistan-specific questions: be culturally aware and contextually relevant
- If greeted, greet back warmly. Never refuse normal questions.`;

async function askGroq(messages) {
    const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            max_tokens: 512,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`Groq API Error [${response.status}]:`, err.substring(0, 200));
        throw new Error(`Groq error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('Empty Groq response');
    return reply.trim();
}

async function askHFInference(messages) {
    const url = 'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta';
    const prompt = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
        .join('\n') + '\nAssistant:';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 512, temperature: 0.7 },
        }),
    });

    if (!response.ok) {
        throw new Error(`HuggingFace error: ${response.status}`);
    }

    const data = await response.json();
    let text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    if (text) {
        const lastAssistant = text.lastIndexOf('Assistant:');
        if (lastAssistant !== -1) {
            text = text.substring(lastAssistant + 10);
        }
        return text.trim();
    }
    throw new Error('Empty HF response');
}

function localFallbackReply(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        return 'Hello! I am your Digital Twin. How can I assist your thinking and decision making today?';
    }
    if (lower.includes('how are you')) {
        return 'I am operating with high cognitive clarity and ready to assist you.';
    }
    return 'I processed your query. Based on logical evaluation, proceed with disciplined planning and continuous execution.';
}

export default async function askHF(prompt, history = [], systemPrompt = DEFAULT_SYSTEM) {
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map(h => ({
            role: h.role === 'ai' ? 'assistant' : (h.role || 'user'),
            content: h.content || ''
        })),
        { role: 'user', content: prompt }
    ];

    if (GROQ_API_KEY && GROQ_API_KEY.trim() !== '') {
        try {
            return await askGroq(messages);
        } catch (groqErr) {
            console.warn('Groq failed, trying HuggingFace fallback:', groqErr.message);
        }
    }

    if (HF_API_KEY && HF_API_KEY.trim() !== '') {
        try {
            return await askHFInference(messages);
        } catch (hfErr) {
            console.warn('HuggingFace failed, using local reasoning fallback:', hfErr.message);
        }
    }

    return localFallbackReply(prompt);
}