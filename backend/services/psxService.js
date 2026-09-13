import axios from 'axios';

const PSX_BASE = 'https://dps.psx.com.pk';

const _cache = {};
const CACHE_TTL = 7 * 60 * 1000;

function _setCache(key, value) {
    _cache[key] = { value, ts: Date.now() };
}
function _getCache(key) {
    const entry = _cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { delete _cache[key]; return null; }
    return entry.value;
}

const _http = axios.create({
    baseURL: PSX_BASE,
    timeout: 12000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://dps.psx.com.pk/',
        'Origin': 'https://dps.psx.com.pk',
    },
});

const TRACKED_STOCKS = [
    'OGDC', 'PPL', 'HUBC', 'ENGRO', 'HBL',
    'MCB', 'LUCK', 'FFC', 'PSO', 'EFERT',
    'UBL', 'BAHL', 'NESTLE', 'PKGS', 'SEARL',
];

async function _fetchEOD(symbol) {
    const cached = _getCache(`eod_${symbol}`);
    if (cached) return cached;

    try {
        const { data } = await _http.get(`/timeseries/eod/${symbol}`);
        if (data?.status === 1 && Array.isArray(data.data) && data.data.length > 0) {
            _setCache(`eod_${symbol}`, data.data);
            return data.data;
        }
        return null;
    } catch (err) {
        return null;
    }
}

function _last(series, n = 1) {
    return series.slice(-n);
}

function _parseStock(symbol, rows) {
    if (!rows || rows.length === 0) return null;

    const latest     = rows[rows.length - 1];
    const prev       = rows.length > 1  ? rows[rows.length - 2]  : latest;
    const weekAgo    = rows.length > 5  ? rows[rows.length - 6]  : rows[0];
    const monthAgo   = rows.length > 22 ? rows[rows.length - 23] : rows[0];
    const yearAgo    = rows.length > 252? rows[rows.length - 253] : rows[0];

    const close     = latest[3];
    const prevClose = prev[3];
    const open      = latest[1];
    const volume    = latest[2];
    const date      = new Date(latest[0] * 1000);

    const dayChg    = close - prevClose;
    const dayChgPct = prevClose ? ((dayChg / prevClose) * 100) : 0;
    const weekChgPct  = weekAgo[3]  ? (((close - weekAgo[3])  / weekAgo[3])  * 100) : 0;
    const monthChgPct = monthAgo[3] ? (((close - monthAgo[3]) / monthAgo[3]) * 100) : 0;
    const yearChgPct  = yearAgo[3]  ? (((close - yearAgo[3])  / yearAgo[3])  * 100) : 0;

    const recentRows = rows.slice(-252);
    const closes = recentRows.map(r => r[3]);
    const high52w = Math.max(...closes);
    const low52w  = Math.min(...closes);

    return {
        symbol,
        price:          +close.toFixed(2),
        open:           +open.toFixed(2),
        prevClose:      +prevClose.toFixed(2),
        volume:         Math.round(volume),
        dayChange:      +dayChg.toFixed(2),
        dayChangePct:   +dayChgPct.toFixed(2),
        weekChangePct:  +weekChgPct.toFixed(2),
        monthChangePct: +monthChgPct.toFixed(2),
        yearChangePct:  +yearChgPct.toFixed(2),
        high52w:        +high52w.toFixed(2),
        low52w:         +low52w.toFixed(2),
        trend:          dayChg >= 0 ? 'UP' : 'DOWN',
        date:           date.toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' }),
    };
}

export async function getKSE100() {
    const rows = await _fetchEOD('KSE100');
    if (!rows) return null;
    return _parseStock('KSE-100 Index', rows);
}

export async function getStockSummary(symbol) {
    const rows = await _fetchEOD(symbol.toUpperCase());
    if (!rows) return null;
    return _parseStock(symbol.toUpperCase(), rows);
}

export async function getMarketOverview() {
    const cacheKey = 'market_overview';
    const cached = _getCache(cacheKey);
    if (cached) return cached;

    const [kse100, ...stockResults] = await Promise.all([
        getKSE100(),
        ...TRACKED_STOCKS.map(s => getStockSummary(s)),
    ]);

    const stocks  = stockResults.filter(Boolean);
    const gainers = [...stocks].filter(s => s.dayChangePct > 0)
                               .sort((a, b) => b.dayChangePct - a.dayChangePct)
                               .slice(0, 5);
    const losers  = [...stocks].filter(s => s.dayChangePct < 0)
                               .sort((a, b) => a.dayChangePct - b.dayChangePct)
                               .slice(0, 5);

    const bullishCount = stocks.filter(s => s.dayChangePct >= 0).length;
    const breadth      = stocks.length > 0 ? ((bullishCount / stocks.length) * 100).toFixed(0) : 0;

    const overview = {
        kse100,
        stocks,
        gainers,
        losers,
        breadth: +breadth,
        bullishCount,
        bearishCount: stocks.length - bullishCount,
        fetchedAt: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
    };

    _setCache(cacheKey, overview);
    return overview;
}

export async function getMarketContextForAI() {
    const cacheKey = 'ai_context';
    const cached   = _getCache(cacheKey);
    if (cached) return cached;

    try {
        const ov = await getMarketOverview();
        if (!ov || !ov.kse100) {
            return 'PSX live data is temporarily unavailable. Advise user to check psx.com.pk directly.';
        }

        const { kse100, stocks, gainers, losers, breadth, fetchedAt } = ov;
        const k = kse100;

        let ctx = `\n\n╔══════════════════════════════════════════════════╗\n`;
        ctx     += `║  LIVE PSX (Pakistan Stock Exchange) MARKET DATA  ║\n`;
        ctx     += `╚══════════════════════════════════════════════════╝\n`;
        ctx     += `📅 Fetched: ${fetchedAt} (PKT)\n\n`;

        ctx += `📊 KSE-100 INDEX:\n`;
        ctx += `  Current Level  : ${k.price?.toLocaleString()} points\n`;
        ctx += `  Day Change      : ${k.dayChange >= 0 ? '+' : ''}${k.dayChange?.toLocaleString()} (${k.dayChange >= 0 ? '+' : ''}${k.dayChangePct}%)\n`;
        ctx += `  Weekly Return   : ${k.weekChangePct >= 0 ? '+' : ''}${k.weekChangePct}%\n`;
        ctx += `  Monthly Return  : ${k.monthChangePct >= 0 ? '+' : ''}${k.monthChangePct}%\n`;
        ctx += `  Yearly Return   : ${k.yearChangePct >= 0 ? '+' : ''}${k.yearChangePct}%\n`;
        ctx += `  52-Week High    : ${k.high52w?.toLocaleString()}\n`;
        ctx += `  52-Week Low     : ${k.low52w?.toLocaleString()}\n`;
        ctx += `  Volume (index)  : ${k.volume?.toLocaleString()}\n`;
        ctx += `  Last Updated    : ${k.date}\n\n`;

        ctx += `📈 MARKET BREADTH (Tracked Stocks):\n`;
        ctx += `  Advancing (Green): ${ov.bullishCount} stocks\n`;
        ctx += `  Declining (Red)  : ${ov.bearishCount} stocks\n`;
        ctx += `  Breadth          : ${breadth}% bullish\n\n`;

        if (gainers.length > 0) {
            ctx += `🚀 TOP GAINERS TODAY:\n`;
            gainers.forEach(s => {
                ctx += `  ${s.symbol.padEnd(8)}: PKR ${s.price.toFixed(2).padStart(10)} | +${s.dayChangePct}% | Vol: ${s.volume?.toLocaleString()}\n`;
            });
            ctx += '\n';
        }

        if (losers.length > 0) {
            ctx += `🔴 TOP LOSERS TODAY:\n`;
            losers.forEach(s => {
                ctx += `  ${s.symbol.padEnd(8)}: PKR ${s.price.toFixed(2).padStart(10)} | ${s.dayChangePct}% | Vol: ${s.volume?.toLocaleString()}\n`;
            });
            ctx += '\n';
        }

        if (stocks.length > 0) {
            ctx += `🏢 ALL TRACKED STOCKS:\n`;
            stocks.forEach(s => {
                const arrow = s.dayChangePct >= 0 ? '▲' : '▼';
                ctx += `  ${s.symbol.padEnd(8)}: PKR ${s.price.toFixed(2).padStart(10)} ${arrow} ${(s.dayChangePct >= 0 ? '+' : '') + s.dayChangePct}% | 1M: ${(s.monthChangePct >= 0 ? '+' : '') + s.monthChangePct}%\n`;
            });
            ctx += '\n';
        }

        ctx += `💡 MARKET ANALYSIS POINTERS:\n`;
        const m = k.monthChangePct;
        const w = k.weekChangePct;
        const d = k.dayChangePct;
        const yr = k.yearChangePct;

        if (m > 5)       ctx += `  • Strong BULLISH momentum: +${m}% this month — market is in a strong uptrend.\n`;
        else if (m > 2)  ctx += `  • Moderate BULLISH trend: +${m}% this month — cautiously optimistic.\n`;
        else if (m > 0)  ctx += `  • Mild BULLISH trend: +${m}% this month — slow but positive.\n`;
        else if (m > -2) ctx += `  • Market is CONSOLIDATING: ${m}% this month — sideways movement.\n`;
        else if (m > -5) ctx += `  • Mild BEARISH correction: ${m}% this month — cautious approach advised.\n`;
        else             ctx += `  • Significant DOWNTREND: ${m}% this month — high risk environment.\n`;

        if (breadth >= 70)       ctx += `  • Market breadth STRONG: ${breadth}% of stocks are green — broad rally.\n`;
        else if (breadth >= 50)  ctx += `  • Market breadth MODERATE: ${breadth}% of stocks are green — selective gains.\n`;
        else                     ctx += `  • Market breadth WEAK: only ${breadth}% of stocks are green — narrow market.\n`;

        const pctFrom52wHigh = (((k.price - k.high52w) / k.high52w) * 100).toFixed(1);
        const pctFrom52wLow  = (((k.price - k.low52w)  / k.low52w)  * 100).toFixed(1);
        ctx += `  • Index is ${Math.abs(pctFrom52wHigh)}% below its 52-week high (${k.high52w?.toLocaleString()}).\n`;
        ctx += `  • Index is ${pctFrom52wLow}% above its 52-week low (${k.low52w?.toLocaleString()}).\n`;

        ctx += `\n⚠️  DISCLAIMER (always include this in investment advice): Stock market investments carry risk. Past performance does not guarantee future results. Investors should do their own due diligence or consult a SECP-registered financial advisor before investing.\n`;
        ctx += `════════════════════════════════════════════════════\n`;

        _setCache(cacheKey, ctx);
        return ctx;

    } catch (err) {
        console.error('PSX AI context error:', err.message);
        return 'PSX market data is temporarily unavailable.';
    }
}

export function isPSXRelated(message) {
    if (!message || typeof message !== 'string') return false;
    const m = message.toLowerCase();

    const keywords = [
        'psx', 'pakistan stock', 'karachi stock', 'kse', 'kse-100', 'kse100',
        'lahore stock', 'islamabad stock', 'stock exchange',
        'stock market', 'share market', 'share price', 'market cap',
        'dividend', 'bull market', 'bear market', 'equity',
        'portfolio', 'blue chip', 'penny stock', 'ipo', 'margin',
        'broker', 'trading', 'listed company', 'scrip', 'bonus',
        'invest', 'investment', 'right time to invest', 'should i invest',
        'when to invest', 'good time to buy', 'market conditions',
        'market situation', 'market trend', 'market outlook',
        'buy shares', 'sell shares', 'buy stocks', 'sell stocks',
        'ogdc', 'ppl', 'hubc', 'engro', 'hbl', 'mcb', 'luck',
        'ffc', 'pso', 'efert', 'ubl', 'bahl', 'nestle', 'pkgs', 'searl',
        'kapco', 'mari', 'nbp', 'bafl', 'meezan', 'sngp', 'ssgc',
        'stocks', 'shares', 'returns', 'market crash', 'rally',
        'correction', 'resistance', 'support', 'volume', 'liquidity',
        'mutual fund', 'nit', 'aima', 'secp',
        'market oper', 'market band', 'share khareedna', 'share bechna',
    ];

    return keywords.some(kw => m.includes(kw));
}
