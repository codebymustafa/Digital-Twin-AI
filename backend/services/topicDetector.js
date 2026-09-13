
const TOPIC_KEYWORDS = {
    islamic: [
        'islamic date', 'hijri date', 'hijri calendar', 'islamic calendar', 'islamic month',
        'hijri', 'hijri year', 'muharram', 'safar', 'rabi ul awwal', 'rabi al awwal',
        'rajab', 'shaban', 'ramadan', 'ramazan', 'shawwal', 'dhul hijjah', 'dhul qadah',
        'eid ul fitr', 'eid ul adha', 'laylatul qadr', 'jumma mubarak', 'shab e barat',
        'shab e miraj', 'eid mubarak', 'islamic event', 'islamic festival', 'islamic holiday',
        'aaj ka islami date', 'islami tarikh', 'islamic new year', 'muharram ul haram',
        'what is the islamic date', 'today islamic', 'hamariweb', 'islamic year'
    ],
    prayer: [
        'prayer', 'namaz', 'salah', 'salat', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
        'zuhr', 'prayer time', 'azan', 'adhan', 'mosque', 'masjid', 'islamic prayer',
        'when to pray', 'prayer schedule', 'today namaz', 'namaz time', 'fajar'
    ],
    currency: [
        'dollar rate', 'usd pkr', 'usd to pkr', 'dollar to rupee', 'exchange rate',
        'rupee rate', 'pkr to usd', 'pound to rupee', 'gbp pkr', 'euro rate',
        'currency rate', 'forex', 'currency exchange', 'dollar ki value', 'dollar price',
        'rupee value', 'currency today', 'aed to pkr', 'sar to pkr', 'riyal rate',
        'dirham rate', 'euro to rupee', 'eur pkr', 'dollar value', 'usd rate',
        'dollar today', '1 dollar', 'how much is dollar', 'pkr rate', 'rupee today'
    ],
    gold: [
        'gold price', 'gold rate', 'sona ka rate', 'gold today', 'gold per tola',
        'gold per gram', 'gold karachi', 'gold lahore', 'silver price', 'silver rate',
        'gold market', 'bullion', 'gold investment', 'gold or silver', 'chandi ka rate',
        'sona', 'gold pkr', 'gold in pakistan', 'today gold rate', 'gold 24k', 'gold 22k'
    ],
    weather: [
        'weather', 'temperature', 'temp today', 'how hot', 'how cold', 'rain today',
        'is it raining', 'forecast', 'humidity', 'wind speed', 'climate today',
        'mausam', 'mausam aaj', 'barish', 'garmi', 'sardi', 'weather karachi',
        'weather lahore', 'weather islamabad', 'weather pakistan'
    ],
    airquality: [
        'air quality', 'aqi', 'pollution', 'smog', 'air pollution', 'air index',
        'pm2.5', 'pm10', 'air today', 'is air clean', 'should i go outside',
        'outdoor air', 'pollution level', 'lahore smog', 'karachi pollution',
        'hazardous air', 'unhealthy air'
    ],
    news: [
        'pakistan news', 'latest news', 'breaking news', 'news today', 'khabar',
        'current events', 'headlines', 'what happened', 'today news', 'top news',
        'news pakistan', 'political news', 'economy news', 'news update',
        'latest updates', 'news aaj', 'kia ho raha hai', "what's happening in pakistan",
        'current affairs', 'world news', 'global news', 'international news',
        'what is happening', 'what happened today', 'news headline', 'top headlines',
        'today headline', 'recent news', 'update today'
    ],
    cricket: [
        'cricket', 'match today', 'match score', 'pakistan cricket', 'pcb',
        'test match', 'odi', 't20', 'icc', 'babar', 'shaheen', 'rizwan',
        'world cup', 'psl', 'pakistan super league', 'cricket score',
        'live score', 'match result', 'cricket news', 'cricket update',
        'who won', 'pakistan vs', 'vs pakistan', 'sports today', 'sports score',
        'asia cup', 'champions trophy', 'sports news', 'football news', 'sports update',
        'sports result', 'game score', 'sports headlines', 'latest sports', 'live match',
        'sports match', 'today match'
    ],
    nasa: [
        'nasa', 'space', 'astronomy', 'planet', 'galaxy', 'cosmos', 'universe',
        'space fact', 'apod', 'astronomy picture', 'space today', 'outer space',
        'black hole', 'stars today', 'space news', 'astrophysics', 'telescope',
        'hubble', 'james webb', 'space discovery', 'space exploration', 'rocket',
        'space station', 'iss', 'meteor', 'comet', 'nebula'
    ],
    holidays: [
        'holiday', 'public holiday', 'government holiday', 'national holiday',
        'upcoming holiday', 'pakistan holiday', 'next holiday', 'is tomorrow holiday',
        'is today holiday', 'eid', 'quaid day', '14 august', 'independence day',
        'kashmir day', 'labour day', 'iqbal day', 'pakistan day', 'holidays 2025',
        'holiday list', 'long weekend'
    ],
    fuel: [
        'petrol price', 'petrol rate', 'diesel price', 'fuel price', 'fuel rate',
        'petrol today', 'petrol ki qeemat', 'petrol cost', 'petrol pakistan',
        'petroleum price', 'oil price pakistan', 'cng price', 'gas price',
        'ogra', 'fuel update', 'petrol rate today', 'filling station', 'pump price',
        'petrol kitna hai', 'petrol ka rate', 'how much is petrol', 'diesel rate',
        'fuel cost', 'petrol per liter', 'current petrol price', 'today petrol',
        'petrol in pakistan', 'diesel in pakistan'
    ],
    books: [
        'book recommendation', 'recommend a book', 'best book', 'good book to read',
        'book about', 'find a book', 'reading suggestion', 'which book should i read',
        'book on', 'books for', 'reading list', 'what to read', 'novel',
        'search book', 'find book', 'openlibrary', 'library book', 'book search'
    ],
    wikipedia: [
        'what is', 'who is', 'what are', 'tell me about', 'explain', 'define',
        'history of', 'meaning of', 'information about', 'facts about', 'wikipedia',
        'describe', 'biography of', 'origin of', 'overview of', 'summary of'
    ],
    crypto: [
        'btc', 'bitcoin', 'eth', 'ethereum', 'sol', 'solana', 'crypto', 'cryptocurrency',
        'coin price', 'doge', 'dogecoin', 'xrp', 'bnb', 'binance coin', 'cardano', 'ada',
        'coin update', 'price update', 'crypto market', 'cryptocurrencies',
        'bitcoin price', 'eth price', 'btc price', 'crypto price', 'bitcoin rate',
        'ethereum price', 'solana price', 'xrp price', 'bnb price', 'doge price',
        'crypto update', 'coin rate', 'digital currency', 'bitcoin today', 'eth today',
        'btc today', 'crypto today', 'how much is bitcoin', 'bitcoin value', 'crypto value',
        'current btc price', 'altcoin', 'shiba', 'shib', 'avax', 'avalanche', 'litecoin',
        'ton', 'toncoin', 'near', 'near protocol', 'pepe', 'sui', 'floki', 'kaspa', 'kas',
        'injective', 'inj', 'sei', 'render', 'rndr', 'crypto news', 'coin news',
        'which coin', 'what is btc', 'coin market', 'market cap', 'crypto cap'
    ],
    time: [
        'time in', 'current time', 'what time is it', 'what is the time', 'time today',
        'timezone', 'pakistan time', 'date today', "what is today's date", 'what is the date',
        'time now', 'current date', 'what day is it', 'today date', 'what time',
        'time right now', 'time in pakistan', 'time in london', 'time in dubai',
        'time in usa', 'time in india', 'time in new york', 'time in saudi',
        'time in uk', 'what is the time now', 'what is time in', 'tell me the time',
        'what is time', 'current time in'
    ]
};

/**
 * Detects which data topics are relevant to a given message.
 * @param {string} message - user's message text
 * @returns {string[]} array of topic keys e.g. ['gold', 'currency', 'prayer']
 */
export function detectTopics(message) {
    if (!message || typeof message !== 'string') return [];
    const m = message.toLowerCase();
    const detected = [];
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(kw => m.includes(kw))) {
            detected.push(topic);
        }
    }
    return detected;
}

/**
 * Extract the main subject for Wikipedia lookup from a message.
 * @param {string} message
 * @returns {string|null}
 */
export function extractWikiTopic(message) {
    if (!message) return null;
    const patterns = [
        /(?:what is|who is|what are|tell me about|explain|define|history of|meaning of|information about|facts about|biography of|origin of|overview of|summary of)\s+(.+?)(?:\?|$)/i,
    ];
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match?.[1]) return match[1].trim().slice(0, 100);
    }
    return null;
}

/**
 * Extract book search query from message.
 * @param {string} message
 * @returns {string|null}
 */
export function extractBookQuery(message) {
    if (!message) return null;
    const patterns = [
        /(?:book(?:s)? (?:about|on|for)|recommend(?:ation)?(?:s)? (?:for|about|on))\s+(.+?)(?:\?|$)/i,
        /(?:find|search|suggest)\s+(?:a\s+)?book\s+(?:about|on|for)\s+(.+?)(?:\?|$)/i,
        /(?:what|which)\s+book(?:s)?\s+(?:should i read|to read|about)\s+(.+?)(?:\?|$)/i,
    ];
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match?.[1]) return match[1].trim().slice(0, 100);
    }
    return message.replace(/book|recommend|read|find|suggest|search/gi, '').trim().slice(0, 80) || null;
}
