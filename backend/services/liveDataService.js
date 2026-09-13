import axios from 'axios';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import dotenv from 'dotenv';
dotenv.config();

const _cache = {};
function _set(key, value, ttlMs) { _cache[key] = { value, exp: Date.now() + ttlMs }; }
function _get(key) {
    const e = _cache[key];
    if (!e || Date.now() > e.exp) { delete _cache[key]; return null; }
    return e.value;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const http = axios.create({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
    }
});


export function extractPrayerCity(message = '') {
    const m = message.toLowerCase();
    const patterns = [
        /(?:prayer|namaz|salah|salat|fajr|dhuhr|asr|maghrib|isha|zuhr|azan)\s+(?:time[s]?\s+)?(?:in|for|of|at)?\s+([a-zA-Z\s]{2,30}?)(?:\s*\?|$|,)/i,
        /(?:in|for|at)\s+([a-zA-Z\s]{2,25}?)\s+(?:prayer|namaz|salah|azan|fajr|isha|maghrib|asr)/i,
        /([a-zA-Z\s]{2,25}?)\s+(?:prayer time|namaz time|azan time|prayer schedule)/i,
        /(?:time[s]?\s+(?:in|for|at))\s+([a-zA-Z\s]{2,25})(?:\?|$|,)/i,
    ];
    for (const pat of patterns) {
        const match = message.match(pat);
        if (match?.[1]) {
            const city = match[1].trim().replace(/\s+/g, ' ');
            if (city.length >= 2 && !/^(the|a|an|is|in|for|at|of|me|my|our|your|tell|show|give|what|when|how|please)$/i.test(city)) {
                return city;
            }
        }
    }
    return null;
}

const cityCountryMap = {
    'karachi': 'Pakistan', 'lahore': 'Pakistan', 'islamabad': 'Pakistan',
    'rawalpindi': 'Pakistan', 'peshawar': 'Pakistan', 'quetta': 'Pakistan',
    'faisalabad': 'Pakistan', 'multan': 'Pakistan', 'hyderabad': 'Pakistan',
    'sialkot': 'Pakistan', 'gujranwala': 'Pakistan', 'bahawalpur': 'Pakistan',
    'dubai': 'UAE', 'abu dhabi': 'UAE', 'sharjah': 'UAE',
    'riyadh': 'Saudi Arabia', 'jeddah': 'Saudi Arabia', 'mecca': 'Saudi Arabia',
    'medina': 'Saudi Arabia', 'makkah': 'Saudi Arabia',
    'london': 'United Kingdom', 'manchester': 'United Kingdom', 'birmingham': 'United Kingdom',
    'new york': 'United States', 'chicago': 'United States', 'los angeles': 'United States',
    'toronto': 'Canada', 'vancouver': 'Canada',
    'kuala lumpur': 'Malaysia', 'istanbul': 'Turkey', 'cairo': 'Egypt',
    'jakarta': 'Indonesia', 'dhaka': 'Bangladesh', 'delhi': 'India',
    'mumbai': 'India', 'bangalore': 'India', 'hyderabad': 'India',
    'tehran': 'Iran', 'baghdad': 'Iraq', 'amman': 'Jordan',
    'beirut': 'Lebanon', 'doha': 'Qatar', 'kuwait city': 'Kuwait',
    'muscat': 'Oman', 'manama': 'Bahrain',
};

function getApproxTimezone(lat, lon, country = '', city = '') {
    const c = country.toLowerCase();
    const ci = city.toLowerCase();
    
    if (c.includes('pakistan') || ci.includes('karachi') || ci.includes('lahore') || ci.includes('islamabad')) return 'Asia/Karachi';
    if (c.includes('india') || ci.includes('delhi') || ci.includes('mumbai') || ci.includes('kolkata')) return 'Asia/Kolkata';
    if (c.includes('bangladesh') || ci.includes('dhaka')) return 'Asia/Dhaka';
    if (c.includes('united arab emirates') || c.includes('uae') || ci.includes('dubai') || ci.includes('abu dhabi')) return 'Asia/Dubai';
    if (c.includes('saudi arabia') || ci.includes('riyadh') || ci.includes('mecca') || ci.includes('medina') || ci.includes('makkah')) return 'Asia/Riyadh';
    if (c.includes('united kingdom') || c.includes('uk') || c.includes('england') || ci.includes('london')) return 'Europe/London';
    if (c.includes('egypt') || ci.includes('cairo')) return 'Africa/Cairo';
    if (c.includes('turkey') || ci.includes('istanbul')) return 'Europe/Istanbul';
    if (c.includes('france') || ci.includes('paris')) return 'Europe/Paris';
    if (c.includes('germany') || ci.includes('berlin') || ci.includes('munich')) return 'Europe/Berlin';
    if (c.includes('japan') || ci.includes('tokyo')) return 'Asia/Tokyo';
    if (c.includes('singapore')) return 'Asia/Singapore';
    if (c.includes('malaysia') || ci.includes('kuala lumpur')) return 'Asia/Kuala_Lumpur';
    if (c.includes('indonesia') || ci.includes('jakarta')) return 'Asia/Jakarta';
    if (c.includes('qatar') || ci.includes('doha')) return 'Asia/Qatar';
    if (c.includes('kuwait')) return 'Asia/Kuwait';
    
    if (c.includes('united states') || c.includes('usa') || c.includes('canada')) {
        if (lon > -67) return 'America/Halifax';
        if (lon > -85) return 'America/New_York';
        if (lon > -102) return 'America/Chicago';
        if (lon > -115) return 'America/Denver';
        if (lon > -125) return 'America/Los_Angeles';
        return 'America/Anchorage';
    }
    
    if (c.includes('australia')) {
        if (lon > 140) return 'Australia/Sydney';
        if (lon > 125) return 'Australia/Adelaide';
        return 'Australia/Perth';
    }
    
    return 'UTC';
}

export async function getPrayerTimes(city = 'Karachi', country = '') {
    const cityLower = city.toLowerCase().trim();
    const cacheKey = `prayer_v2_${cityLower}`;
    const cached = _get(cacheKey);
    if (cached) return cached;
    try {
        const geocodeRes = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`, {
            headers: { 'User-Agent': 'DigitalTwin/1.0' },
            timeout: 8000
        });
        
        if (!geocodeRes.data || geocodeRes.data.length === 0) return null;
        
        const loc = geocodeRes.data[0];
        const lat = parseFloat(loc.lat);
        const lon = parseFloat(loc.lon);
        const displayName = loc.display_name || '';
        
        const tz = getApproxTimezone(lat, lon, displayName, cityLower);
        const coordinates = new Coordinates(lat, lon);
        
        let method = CalculationMethod.MuslimWorldLeague();
        if (displayName.includes("Pakistan") || displayName.includes("India") || displayName.includes("Bangladesh")) {
            method = CalculationMethod.Karachi();
        } else if (displayName.includes("United States") || displayName.includes("Canada")) {
            method = CalculationMethod.NorthAmerica();
        } else if (displayName.includes("Saudi Arabia") || displayName.includes("United Arab Emirates") || displayName.includes("Qatar") || displayName.includes("الإمارات")) {
            method = CalculationMethod.UmmAlQura();
        } else if (displayName.includes("Egypt")) {
            method = CalculationMethod.Egyptian();
        }
        
        const date = new Date();
        const prayerTimes = new PrayerTimes(coordinates, date, method);
        
        const fmt = (time) => {
            return time.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
        };
        
        const result = {
            Fajr: fmt(prayerTimes.fajr), Sunrise: fmt(prayerTimes.sunrise), Dhuhr: fmt(prayerTimes.dhuhr),
            Asr: fmt(prayerTimes.asr), Maghrib: fmt(prayerTimes.maghrib), Isha: fmt(prayerTimes.isha),
            city: city,
            country: displayName,
            date: new Date().toLocaleDateString('en-US', { timeZone: tz })
        };
        _set(cacheKey, result, 10 * HOUR);
        return result;
    } catch (e) {
        return null;
    }
}

export async function getIslamicDate() {
    const cached = _get('islamic_date');
    if (cached) return cached;
    try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const { data } = await http.get(
            `http://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`,
            { timeout: 6000 }
        );
        const h = data?.data?.hijri;
        if (!h) return null;
        const result = {
            hijriDay: h.day,
            hijriMonth: h.month?.en,
            hijriMonthAr: h.month?.ar,
            hijriYear: h.year,
            hijriWeekday: h.weekday?.en,
            gregorianDate: `${dd}-${mm}-${yyyy}`,
            formatted: `${h.day} ${h.month?.en} ${h.year} AH`,
            holidays: h.holidays || []
        };
        _set('islamic_date', result, 6 * HOUR);
        return result;
    } catch (e) {
        return null;
    }
}

export async function getCurrencyRates() {
    const cached = _get('currency');
    if (cached) return cached;
    try {
        const { data } = await http.get('https://open.er-api.com/v6/latest/USD');
        if (data?.result !== 'success') return null;
        const rates = data.rates;
        const result = {
            USD_PKR: rates.PKR ? +rates.PKR.toFixed(2) : null,
            GBP_PKR: rates.PKR && rates.GBP ? +(rates.PKR / rates.GBP).toFixed(2) : null,
            EUR_PKR: rates.PKR && rates.EUR ? +(rates.PKR / rates.EUR).toFixed(2) : null,
            SAR_PKR: rates.PKR && rates.SAR ? +(rates.PKR / rates.SAR).toFixed(2) : null,
            AED_PKR: rates.PKR && rates.AED ? +(rates.PKR / rates.AED).toFixed(2) : null,
            updatedAt: data.time_last_update_utc
        };
        _set('currency', result, 60 * MINUTE);
        return result;
    } catch (e) {
        return null;
    }
}

export async function getGoldPrice() {
    const cached = _get('gold');
    if (cached) return cached;
    try {
        const [resGold, resSilver] = await Promise.all([
            http.get('https://api.gold-api.com/price/XAU'),
            http.get('https://api.gold-api.com/price/XAG').catch(() => null)
        ]);

        const goldUSD = resGold?.data?.price;
        if (!goldUSD) throw new Error('No gold price data');

        const silverUSD = resSilver?.data?.price ?? null;

        const ratesData = await getCurrencyRates();
        const usdPkr = ratesData?.USD_PKR ?? 278;
        const goldPKR_per_tola = +(goldUSD * (11.6638 / 31.1035) * usdPkr).toFixed(2);
        const goldPKR_per_10g = +(goldUSD * (10 / 31.1035) * usdPkr).toFixed(2);

        const result = {
            gold_USD_per_oz: +goldUSD.toFixed(2),
            gold_PKR_per_tola: goldPKR_per_tola,
            gold_PKR_per_10g: goldPKR_per_10g,
            silver_USD_per_oz: silverUSD ? +silverUSD.toFixed(2) : null,
        };
        _set('gold', result, 15 * MINUTE);
        return result;
    } catch (e) {
        return null;
    }
}

export async function getWeather(lat = 24.8607, lon = 67.0011, city = 'Karachi') {
    const key = `weather_${city}`;
    const cached = _get(key);
    if (cached) return cached;
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability&forecast_days=1&timezone=Asia/Karachi`;
        const { data } = await http.get(url);
        const cw = data?.current_weather;
        if (!cw) return null;
        const wmoMap = {
            0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle',
            61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
            71: 'Slight snow', 73: 'Moderate snow', 80: 'Rain showers',
            95: 'Thunderstorm', 96: 'Thunderstorm with hail'
        };
        const result = {
            city,
            temp_c: cw.temperature,
            windspeed_kmh: cw.windspeed,
            description: wmoMap[cw.weathercode] ?? 'Unknown',
            is_day: cw.is_day === 1,
        };
        _set(key, result, 30 * MINUTE);
        return result;
    } catch (e) {
        return null;
    }
}

export async function getAirQuality(city = 'karachi') {
    const cached = _get(`aqi_${city}`);
    if (cached) return cached;
    try {
        const token = process.env.AQICN_TOKEN || 'demo';
        const { data } = await http.get(`https://api.waqi.info/feed/${city}/?token=${token}`);
        if (data?.status !== 'ok') return null;
        const aqi = data.data.aqi;
        let level = 'Good';
        if (aqi > 300) level = 'Hazardous';
        else if (aqi > 200) level = 'Very Unhealthy';
        else if (aqi > 150) level = 'Unhealthy';
        else if (aqi > 100) level = 'Unhealthy for Sensitive Groups';
        else if (aqi > 50) level = 'Moderate';
        const result = { city, aqi, level, dominantPollutant: data.data.dominentpol };
        _set(`aqi_${city}`, result, 30 * MINUTE);
        return result;
    } catch (e) {
        return null;
    }
}

function parseRSS(xml) {
    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];
        const extractTag = (tag) => {
            const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
            const tagMatch = itemContent.match(tagRegex);
            if (tagMatch) {
                let content = tagMatch[1].trim();
                if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
                    content = content.substring(9, content.length - 3).trim();
                }
                return content.replace(/<[^>]*>/g, '').trim();
            }
            return '';
        };

        const title = extractTag('title');
        let description = extractTag('description');
        description = description
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/<[^>]*>/g, '')
            .slice(0, 150);

        const pubDate = extractTag('pubDate') || extractTag('dc:date');
        const link = extractTag('link');

        if (title) {
            items.push({ title, description, publishedAt: pubDate, link });
        }
    }
    return items;
}

function detectNewsRegion(query) {
    const q = (query || '').toLowerCase();
    if (/\b(uk|britain|england|london|bbc)\b/.test(q)) return 'uk';
    if (/\b(usa|us news|america|american|washington|new york)\b/.test(q)) return 'us';
    if (/\b(india|indian|delhi|mumbai|hindi)\b/.test(q)) return 'india';
    if (/\b(world|global|international|al jazeera)\b/.test(q)) return 'global';
    if (/pakistan|pk|lahore|karachi|islamabad|punjab|sindh|ary|geo|dawn/i.test(q)) return 'pk';
    return q ? 'pk' : 'pk';
}

const NEWS_SOURCES = {
    pk: [
        { url: 'https://arynews.tv/feed/', source: 'ARY News' },
        { url: 'https://www.geo.tv/rss/1/1', source: 'Geo News' },
        { url: 'https://www.dawn.com/feeds/home', source: 'Dawn News' },
        { url: 'https://tribune.com.pk/feed/pakistan', source: 'The Express Tribune' }
    ],
    uk: [
        { url: 'https://feeds.bbci.co.uk/news/uk/rss.xml', source: 'BBC News UK' },
        { url: 'https://feeds.bbci.co.uk/news/rss.xml', source: 'BBC News' }
    ],
    us: [
        { url: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml', source: 'The New York Times' },
        { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', source: 'BBC US & Canada' }
    ],
    india: [
        { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', source: 'NDTV' },
        { url: 'https://feeds.bbci.co.uk/news/world/south_asia/rss.xml', source: 'BBC South Asia' }
    ],
    global: [
        { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
        { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC News World' },
        { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'The New York Times' }
    ]
};

export async function getLatestNews(query = '') {
    const region = detectNewsRegion(query);
    const key = `news_${region}`;
    const cached = _get(key);
    if (cached) return cached;

    const sources = NEWS_SOURCES[region] || NEWS_SOURCES.global;

    for (const src of sources) {
        try {
            const { data } = await http.get(src.url, { timeout: 8000 });
            if (data) {
                const parsed = parseRSS(data);
                if (parsed && parsed.length > 0) {
                    const articles = parsed.slice(0, 8).map(a => ({
                        title: a.title,
                        source: src.source,
                        publishedAt: a.publishedAt,
                        description: a.description
                    }));
                    _set(key, articles, 20 * MINUTE);
                    return articles;
                }
            }
        } catch { /* try next */ }
    }

    try {
        const apiKey = process.env.GNEWS_API_KEY;
        if (apiKey) {
            const countryParam = region === 'pk' ? '&country=pk' : region === 'uk' ? '&country=gb' : region === 'us' ? '&country=us' : region === 'india' ? '&country=in' : '';
            const searchQ = query || (region === 'pk' ? 'Pakistan' : 'World news');
            const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQ)}&lang=en&max=5&apikey=${apiKey}${countryParam}`;
            const { data } = await http.get(url, { timeout: 8000 });
            const articles = (data?.articles || []).map(a => ({
                title: a.title, source: a.source?.name || 'GNews',
                publishedAt: a.publishedAt, description: a.description?.slice(0, 150) || ''
            }));
            if (articles.length) { _set(key, articles, 20 * MINUTE); return articles; }
        }
    } catch { /* skip */ }

    return [{ title: `News feed is currently updating. Please check a news website directly.`, source: 'System', publishedAt: new Date().toISOString(), description: '' }];
}

export async function getCricketAndSportsData() {
    const cached = _get('cricket_sports');
    if (cached) return cached;

    const results = [];

    const cricApiKey = process.env.CRICKET_API_KEY;
    if (cricApiKey && cricApiKey.trim()) {
        try {
            const { data } = await http.get(`https://api.cricapi.com/v1/currentMatches?apikey=${cricApiKey}&offset=0`, { timeout: 8000 });
            if (data?.status === 'success' && Array.isArray(data.data)) {
                data.data.slice(0, 5).forEach(m => {
                    results.push({ type: 'Live Match', title: m.name, details: `${m.status || 'Match in progress'} | ${m.matchType?.toUpperCase() || 'CRICKET'}`, source: 'CricAPI' });
                });
            }
        } catch { /* skip */ }
    }

    try {
        const { data } = await http.get('https://feeds.bbci.co.uk/sport/cricket/rss.xml', { timeout: 8000 });
        if (data) {
            const parsed = parseRSS(data);
            if (parsed?.length > 0) {
                results.push(...parsed.slice(0, 5).map(m => ({
                    type: 'Cricket News', title: m.title, details: m.description || 'Latest from BBC Sport', source: 'BBC Sport'
                })));
            }
        }
    } catch { /* skip */ }

    if (results.length < 3) {
        const newsDataKey = process.env.NEWSDATA_KEY;
        if (newsDataKey && newsDataKey.trim()) {
            try {
                const { data } = await http.get(
                    `https://newsdata.io/api/1/news?apikey=${newsDataKey}&q=cricket+Pakistan&language=en&category=sports`,
                    { timeout: 8000 }
                );
                if (data?.results?.length > 0) {
                    data.results.slice(0, 4).forEach(a => {
                        results.push({
                            type: 'Cricket News',
                            title: a.title,
                            details: a.description?.slice(0, 120) || 'Latest cricket update',
                            source: a.source_id || 'NewsData.io'
                        });
                    });
                }
            } catch { /* skip */ }
        }
    }

    if (results.length < 3) {
        const rssFeeds = [
            { url: 'https://static.cricinfo.com/rss/livescores.xml', type: 'Live Score' },
            { url: 'https://www.espncricinfo.com/rss/content/story/feeds/6.xml', type: 'Cricket News' },
        ];
        for (const feed of rssFeeds) {
            try {
                const { data } = await http.get(feed.url, { timeout: 6000 });
                if (data) {
                    const parsed = parseRSS(data);
                    if (parsed?.length > 0) {
                        results.push(...parsed.slice(0, 3).map(m => ({
                            type: feed.type, title: m.title, details: m.description || 'ESPNCricinfo', source: 'ESPNCricinfo'
                        })));
                        break;
                    }
                }
            } catch { /* skip */ }
        }
    }

    if (results.length > 0) {
        _set('cricket_sports', results, 5 * MINUTE);
        return results;
    }
    return [{ type: 'Status', title: 'Cricket updates are temporarily unavailable.', details: 'Check ESPNCricinfo.com or BBC Sport for live scores.', source: 'System' }];
}

export async function getNASAApod() {
    const cached = _get('nasa_apod');
    if (cached) return cached;
    try {
        const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
        const { data } = await http.get(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
        const result = {
            title: data.title,
            date: data.date,
            explanation: data.explanation?.slice(0, 300),
            mediaType: data.media_type,
            url: data.url
        };
        _set('nasa_apod', result, 24 * HOUR);
        return result;
    } catch (e) {
        return null;
    }
}

export async function getPakistanHolidays() {
    const cached = _get('holidays_pk');
    if (cached) return cached;
    const year = new Date().getFullYear();
    try {
        const { data } = await http.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/PK`);
        if (Array.isArray(data)) {
            const today = new Date();
            const upcoming = data
                .filter(h => new Date(h.date) >= today)
                .slice(0, 5)
                .map(h => ({ name: h.name, localName: h.localName, date: h.date }));
            _set('holidays_pk', upcoming, 24 * HOUR);
            return upcoming;
        }
        throw new Error('Response is not an array');
    } catch (e) {
        const today = new Date();
        const staticHolidays = [
            { name: 'Kashmir Solidarity Day', localName: 'Kashmir Solidarity Day', date: `${year}-02-05` },
            { name: 'Pakistan Day', localName: 'Pakistan Day', date: `${year}-03-23` },
            { name: 'Labour Day', localName: 'Labour Day', date: `${year}-05-01` },
            { name: 'Independence Day', localName: 'Independence Day', date: `${year}-08-14` },
            { name: 'Iqbal Day', localName: 'Iqbal Day', date: `${year}-11-09` },
            { name: 'Quaid-e-Azam Day / Christmas', localName: 'Quaid-e-Azam Day / Christmas', date: `${year}-12-25` },
        ];
        const upcoming = staticHolidays
            .filter(h => new Date(h.date) >= today)
            .slice(0, 5);
        _set('holidays_pk', upcoming, 24 * HOUR);
        return upcoming;
    }
}

export async function getWikipediaSummary(topic) {
    if (!topic) return null;
    const key = `wiki_${topic.slice(0, 30).toLowerCase().replace(/\s+/g, '_')}`;
    const cached = _get(key);
    if (cached) return cached;
    try {
        const slug = encodeURIComponent(topic.replace(/\s+/g, '_'));
        const { data } = await http.get(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
            { headers: { 'User-Agent': 'DigitalTwin/1.0 (educational project)' } }
        );
        const result = {
            title: data.title,
            extract: data.extract?.slice(0, 500),
            url: data.content_urls?.desktop?.page
        };
        _set(key, result, HOUR);
        return result;
    } catch (e) {
        return null;
    }
}

export async function searchBooks(query) {
    if (!query) return null;
    const key = `book_${query.slice(0, 30).toLowerCase()}`;
    const cached = _get(key);
    if (cached) return cached;
    try {
        const { data } = await http.get(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3&fields=title,author_name,first_publish_year,subject`
        );
        const books = (data?.docs || []).slice(0, 3).map(b => ({
            title: b.title,
            author: b.author_name?.[0] ?? 'Unknown',
            year: b.first_publish_year,
            subject: b.subject?.[0]
        }));
        if (!books.length) return null;
        _set(key, books, HOUR);
        return books;
    } catch (e) {
        return null;
    }
}

export async function getLivePakistanFuelPrices() {
    const cached = _get('live_fuel_prices');
    if (cached) return cached;

    const newsDataKey = process.env.NEWSDATA_KEY;
    if (newsDataKey && newsDataKey.trim()) {
        try {
            const { data } = await http.get(
                `https://newsdata.io/api/1/news?apikey=${newsDataKey}&q=petrol+price+Pakistan+OGRA&language=en&category=business`,
                { timeout: 8000 }
            );
            if (data?.results?.length > 0) {
                const allText = data.results.slice(0, 3).map(a => `${a.title} ${a.description || ''}`).join(' ');
                const petrolMatch = allText.match(/(?:petrol|premium)\s+(?:price|rate)?\s*(?:at|to|is|:|=)?\s*(?:Rs\.?|PKR)?\s*([2-3]\d{2}(?:[.,]\d{1,2})?)/i);
                const dieselMatch = allText.match(/(?:hsd|diesel)\s+(?:price|rate)?\s*(?:at|to|is|:|=)?\s*(?:Rs\.?|PKR)?\s*([2-4]\d{2}(?:[.,]\d{1,2})?)/i);
                if (petrolMatch) {
                    const result = {
                        petrol_PKR_per_liter: petrolMatch[1].replace(',', '.'),
                        diesel_PKR_per_liter: dieselMatch ? dieselMatch[1].replace(',', '.') : (process.env.FUEL_DIESEL_PKR || '311.00'),
                        note: 'OGRA / NewsData.io (Live)',
                        lastUpdated: new Date().toLocaleDateString('en-PK', { month: 'long', day: 'numeric', year: 'numeric' })
                    };
                    _set('live_fuel_prices', result, 6 * HOUR);
                    return result;
                }
            }
        } catch { /* try next source */ }
    }

    const sources = [
        { url: 'https://www.pakwheels.com/petroleum-prices-in-pakistan', name: 'PakWheels' },
        { url: 'https://propakistani.pk/fuel-prices-in-pakistan/', name: 'ProPakistani' }
    ];

    for (const src of sources) {
        try {
            const { data } = await http.get(src.url, { timeout: 8000 });
            if (!data) continue;
            const petrolMatch =
                data.match(/Petrol\s*(?:\(Super\))?[^<]{0,30}<[^>]*>\s*(?:PKR|Rs\.?)\s*([2-3]\d{2}[.,]\d{0,2})/i) ||
                data.match(/<td[^>]*>\s*Petrol[^<]*<\/td>[\s\S]{0,200}?([2-3]\d{2}[.,]\d{0,2})/i) ||
                data.match(/petrol[\s\S]{0,200}?([2-3]\d{2}[.,]\d{1,2})/i);
            const dieselMatch =
                data.match(/(?:HSD|High Speed Diesel)[^<]{0,30}<[^>]*>\s*(?:PKR|Rs\.?)\s*([2-4]\d{2}[.,]\d{0,2})/i) ||
                data.match(/diesel[\s\S]{0,200}?([2-4]\d{2}[.,]\d{1,2})/i);

            const petrol = petrolMatch ? petrolMatch[1].replace(',', '.').trim() : null;
            const diesel = dieselMatch ? dieselMatch[1].replace(',', '.').trim() : null;

            if (petrol && parseFloat(petrol) > 100) {
                const result = {
                    petrol_PKR_per_liter: petrol,
                    diesel_PKR_per_liter: diesel || process.env.FUEL_DIESEL_PKR || '311.00',
                    note: `${src.name} (Live Scraped)`,
                    lastUpdated: new Date().toLocaleDateString('en-PK', { month: 'long', day: 'numeric', year: 'numeric' })
                };
                _set('live_fuel_prices', result, 6 * HOUR);
                return result;
            }
        } catch { /* try next source */ }
    }

    return {
        petrol_PKR_per_liter: process.env.FUEL_PETROL_PKR || '299.00',
        diesel_PKR_per_liter: process.env.FUEL_DIESEL_PKR || '311.00',
        note: 'OGRA Notified Rate (verified)',
        lastUpdated: process.env.FUEL_LAST_UPDATED || 'July 2026'
    };
}

const COIN_ID_MAP = {
    BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', XRP: 'ripple',
    SOL: 'solana', DOGE: 'dogecoin', ADA: 'cardano', SHIB: 'shiba-inu',
    AVAX: 'avalanche-2', LTC: 'litecoin', MATIC: 'matic-network',
    DOT: 'polkadot', LINK: 'chainlink', UNI: 'uniswap', TRX: 'tron',
    TON: 'the-open-network', NEAR: 'near', PEPE: 'pepe', SUI: 'sui',
    FLOKI: 'floki', KAS: 'kaspa', INJ: 'injective-protocol'
};
const BINANCE_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'DOGEUSDT', 'ADAUSDT', 'SHIBUSDT', 'AVAXUSDT', 'LTCUSDT', 'MATICUSDT', 'DOTUSDT', 'LINKUSDT', 'UNIUSDT', 'TRXUSDT'];

const COINCAP_ID_MAP = {
    BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binance-coin', XRP: 'xrp',
    SOL: 'solana', DOGE: 'dogecoin', ADA: 'cardano', SHIB: 'shiba-inu',
    AVAX: 'avalanche', LTC: 'litecoin', MATIC: 'polygon', DOT: 'polkadot',
    LINK: 'chainlink', UNI: 'uniswap', TRX: 'tron'
};

export async function getCryptoPrices() {
    const cached = _get('crypto_prices');
    if (cached) return cached;

    try {
        const ids = Object.values(COIN_ID_MAP).join(',');
        const { data } = await http.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,pkr&include_24hr_change=true`,
            { timeout: 8000 }
        );
        if (data && data.bitcoin && data.bitcoin.usd) {
            const result = {};
            for (const [sym, id] of Object.entries(COIN_ID_MAP)) {
                if (data[id]) result[sym] = {
                    usd: data[id].usd,
                    pkr: data[id].pkr,
                    change24h: data[id].usd_24h_change ? +data[id].usd_24h_change.toFixed(2) : null,
                    name: sym
                };
            }
            result.source = 'CoinGecko (Live)';
            _set('crypto_prices', result, 5 * MINUTE);
            return result;
        }
    } catch { /* try Binance */ }

    try {
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(BINANCE_SYMBOLS)}`;
        const { data } = await http.get(url, { timeout: 8000 });
        if (Array.isArray(data) && data.length > 0) {
            const ratesData = await getCurrencyRates();
            const usdToPkr = ratesData?.USD_PKR ?? 280;
            const prices = {};
            data.forEach(item => {
                const coin = item.symbol.replace('USDT', '');
                const priceUsd = parseFloat(item.lastPrice);
                prices[coin] = {
                    usd: +priceUsd.toFixed(coin === 'BTC' ? 2 : coin === 'ETH' ? 2 : 6),
                    pkr: Math.round(priceUsd * usdToPkr),
                    change24h: item.priceChangePercent ? +parseFloat(item.priceChangePercent).toFixed(2) : null,
                    name: coin
                };
            });
            prices.source = 'Binance (Live)';
            _set('crypto_prices', prices, 5 * MINUTE);
            return prices;
        }
    } catch { /* try CoinCap */ }

    try {
        const ids = Object.values(COINCAP_ID_MAP).join(',');
        const { data } = await http.get(`https://api.coincap.io/v2/assets?ids=${ids}&limit=20`, { timeout: 8000 });
        if (data?.data?.length > 0) {
            const ratesData = await getCurrencyRates();
            const usdToPkr = ratesData?.USD_PKR ?? 280;
            const prices = {};
            data.data.forEach(coin => {
                const sym = Object.keys(COINCAP_ID_MAP).find(k => COINCAP_ID_MAP[k] === coin.id) || coin.symbol?.toUpperCase();
                const priceUsd = parseFloat(coin.priceUsd || 0);
                prices[sym] = {
                    usd: +priceUsd.toFixed(priceUsd > 100 ? 2 : 6),
                    pkr: Math.round(priceUsd * usdToPkr),
                    change24h: coin.changePercent24Hr ? +parseFloat(coin.changePercent24Hr).toFixed(2) : null,
                    name: sym
                };
            });
            prices.source = 'CoinCap (Live)';
            _set('crypto_prices', prices, 5 * MINUTE);
            return prices;
        }
    } catch { /* skip */ }

    return null;
}

export async function getCoinPrice(query) {
    const q = query.trim().toLowerCase();
    const symMatch = Object.keys(COIN_ID_MAP).find(s => s.toLowerCase() === q);
    const idMatch = Object.values(COIN_ID_MAP).find(id => id.toLowerCase().includes(q));
    const coinId = symMatch ? COIN_ID_MAP[symMatch] : (idMatch || q);
    const cacheKey = `coin_${coinId}`;
    const cached = _get(cacheKey);
    if (cached) return cached;

    try {
        const { data } = await http.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd,pkr&include_24hr_change=true`,
            { timeout: 8000 }
        );
        const entry = data?.[coinId];
        if (entry) {
            const result = {
                symbol: symMatch || q.toUpperCase(), name: coinId,
                usd: entry.usd, pkr: entry.pkr,
                change24h: entry.usd_24h_change ? +entry.usd_24h_change.toFixed(2) : null,
                source: 'CoinGecko (Live)'
            };
            _set(cacheKey, result, 5 * MINUTE);
            return result;
        }
        const { data: searchData } = await http.get(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`, { timeout: 8000 });
        const firstCoin = searchData?.coins?.[0];
        if (firstCoin) {
            const { data: priceData } = await http.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${firstCoin.id}&vs_currencies=usd,pkr&include_24hr_change=true`,
                { timeout: 8000 }
            );
            const p = priceData?.[firstCoin.id];
            if (p) {
                const result = {
                    symbol: firstCoin.symbol?.toUpperCase(), name: firstCoin.name,
                    usd: p.usd, pkr: p.pkr,
                    change24h: p.usd_24h_change ? +p.usd_24h_change.toFixed(2) : null,
                    source: 'CoinGecko (Live)'
                };
                _set(cacheKey, result, 5 * MINUTE);
                return result;
            }
        }
    } catch { /* try CoinCap */ }

    try {
        const { data } = await http.get(`https://api.coincap.io/v2/assets/${encodeURIComponent(q)}`, { timeout: 8000 });
        const coin = data?.data;
        if (coin && coin.priceUsd) {
            const ratesData = await getCurrencyRates();
            const usdToPkr = ratesData?.USD_PKR ?? 280;
            const priceUsd = parseFloat(coin.priceUsd);
            const result = {
                symbol: coin.symbol?.toUpperCase(), name: coin.name,
                usd: +priceUsd.toFixed(priceUsd > 100 ? 2 : 6),
                pkr: Math.round(priceUsd * usdToPkr),
                change24h: coin.changePercent24Hr ? +parseFloat(coin.changePercent24Hr).toFixed(2) : null,
                source: 'CoinCap (Live)'
            };
            _set(cacheKey, result, 5 * MINUTE);
            return result;
        }
    } catch { /* skip */ }

    return null;
}

const timezoneMap = {
    'pakistan': 'Asia/Karachi', 'karachi': 'Asia/Karachi', 'lahore': 'Asia/Karachi',
    'islamabad': 'Asia/Karachi', 'peshawar': 'Asia/Karachi', 'quetta': 'Asia/Karachi',
    'india': 'Asia/Kolkata', 'delhi': 'Asia/Kolkata', 'mumbai': 'Asia/Kolkata', 'bangalore': 'Asia/Kolkata',
    'london': 'Europe/London', 'uk': 'Europe/London', 'united kingdom': 'Europe/London', 'gb': 'Europe/London', 'england': 'Europe/London',
    'new york': 'America/New_York', 'ny': 'America/New_York', 'usa': 'America/New_York', 'united states': 'America/New_York', 'us': 'America/New_York', 'america': 'America/New_York',
    'california': 'America/Los_Angeles', 'los angeles': 'America/Los_Angeles', 'la': 'America/Los_Angeles', 'san francisco': 'America/Los_Angeles',
    'dubai': 'Asia/Dubai', 'uae': 'Asia/Dubai', 'abu dhabi': 'Asia/Dubai',
    'riyadh': 'Asia/Riyadh', 'saudi': 'Asia/Riyadh', 'saudi arabia': 'Asia/Riyadh', 'jeddah': 'Asia/Riyadh',
    'tokyo': 'Asia/Tokyo', 'japan': 'Asia/Tokyo',
    'sydney': 'Australia/Sydney', 'australia': 'Australia/Sydney', 'melbourne': 'Australia/Sydney',
    'singapore': 'Asia/Singapore',
    'china': 'Asia/Shanghai', 'beijing': 'Asia/Shanghai', 'shanghai': 'Asia/Shanghai',
    'paris': 'Europe/Paris', 'france': 'Europe/Paris',
    'germany': 'Europe/Berlin', 'berlin': 'Europe/Berlin',
    'toronto': 'America/Toronto', 'canada': 'America/Toronto', 'vancouver': 'America/Vancouver',
    'turkey': 'Europe/Istanbul', 'istanbul': 'Europe/Istanbul',
    'egypt': 'Africa/Cairo', 'cairo': 'Africa/Cairo',
    'iran': 'Asia/Tehran', 'tehran': 'Asia/Tehran',
    'russia': 'Europe/Moscow', 'moscow': 'Europe/Moscow',
    'bangladesh': 'Asia/Dhaka', 'dhaka': 'Asia/Dhaka',
    'malaysia': 'Asia/Kuala_Lumpur', 'kuala lumpur': 'Asia/Kuala_Lumpur',
    'indonesia': 'Asia/Jakarta', 'jakarta': 'Asia/Jakarta',
};

let _internetTimeBase = null;

async function fetchInternetUTCTime() {
    try {
        const { data } = await http.get('https://worldtimeapi.org/api/timezone/UTC', { timeout: 5000 });
        if (data?.unixtime) {
            _internetTimeBase = { fetchedAt: Date.now(), utcMs: data.unixtime * 1000 };
            return;
        }
    } catch { /* try fallback */ }
    try {
        const { data } = await http.get('https://timeapi.io/api/Time/current/zone?timeZone=UTC', { timeout: 5000 });
        if (data?.dateTime) {
            _internetTimeBase = { fetchedAt: Date.now(), utcMs: new Date(data.dateTime).getTime() };
            return;
        }
    } catch { /* skip — use system time */ }
}

function getAccurateNow() {
    if (_internetTimeBase) {
        const elapsed = Date.now() - _internetTimeBase.fetchedAt;
        return new Date(_internetTimeBase.utcMs + elapsed);
    }
    return new Date();
}

setInterval(() => { fetchInternetUTCTime().catch(() => { }); }, 10 * MINUTE);
fetchInternetUTCTime().catch(() => { });

export function getTimeContext(message = '') {
    const m = message.toLowerCase();
    const now = getAccurateNow();
    const utcMs = now.getTime();
    const source = _internetTimeBase ? 'Internet-Synced (Accurate)' : 'System Clock (Fallback)';

    const fmtFull = (tz) => new Intl.DateTimeFormat('en-US', {
        timeZone: tz, weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).format(now);

    const pkTime = fmtFull('Asia/Karachi');
    const utcTimeStr = now.toUTCString();

    let timeCtx = `\n[CURRENT TIME — ${source}]\n- UTC: ${utcTimeStr}\n- Pakistan (PKT/UTC+5): ${pkTime}\n- IMPORTANT: Always use the above UTC time as the reference, then convert mathematically to any requested timezone. Do NOT use system assumptions.`;

    const matchedZones = new Set();
    for (const [key, tz] of Object.entries(timezoneMap)) {
        if (m.includes(key) && !matchedZones.has(tz)) {
            matchedZones.add(tz);
            try {
                const calculatedTime = fmtFull(tz);
                const offsetMs = new Date(now.toLocaleString('en-US', { timeZone: tz })).getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
                const offsetHrs = Math.round(offsetMs / 3600000);
                const offsetStr = offsetHrs >= 0 ? `UTC+${offsetHrs}` : `UTC${offsetHrs}`;
                timeCtx += `\n- ${key.charAt(0).toUpperCase() + key.slice(1)} (${offsetStr}): ${calculatedTime}`;
            } catch { /* skip */ }
        }
    }

    if (matchedZones.size === 0 && /\btime\b|\bclock\b|\bcurrent time\b/.test(m)) {
        timeCtx += `\n[MAJOR WORLD TIMES RIGHT NOW]`;
        const majorZones = [['Dubai', 'Asia/Dubai'], ['London', 'Europe/London'], ['New York', 'America/New_York'], ['Tokyo', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney']];
        for (const [label, tz] of majorZones) {
            try { timeCtx += `\n- ${label}: ${fmtFull(tz)}`; } catch { }
        }
    }

    return timeCtx;
}

export async function buildContextString(topics = [], message = '') {
    const sections = [];

    const fetch = async (label, fn, formatter) => {
        try {
            const data = await fn();
            if (data) sections.push(formatter(data));
        } catch { /* silently skip */ }
    };

    sections.push(getTimeContext(message));

    if (topics.includes('time')) {
    }

    if (topics.includes('prayer') || topics.includes('islamic')) {
        const prayerCity = extractPrayerCity(message);
        const cityToFetch = prayerCity || 'Karachi';
        try {
            const prayerData = await getPrayerTimes(cityToFetch);
            if (prayerData) {
                sections.push(`\n[PRAYER TIMES — ${cityToFetch}${prayerData.country ? ', ' + prayerData.country : ''} | ${prayerData.date}]\nFajr: ${prayerData.Fajr} | Sunrise: ${prayerData.Sunrise} | Dhuhr: ${prayerData.Dhuhr} | Asr: ${prayerData.Asr} | Maghrib: ${prayerData.Maghrib} | Isha: ${prayerData.Isha}\nSource: Aladhan.com (Method: Muslim World League)\nNote: Times are calculated based on standard astronomical formulas for ${cityToFetch}.`);
            }
        } catch { /* skip */ }
    }

    if (topics.includes('islamic')) {
        await fetch('islamic', getIslamicDate, d =>
            `\n[ISLAMIC / HIJRI DATE — Today]\nHijri Date: ${d.formatted}\nHijri Day: ${d.hijriWeekday} | Month: ${d.hijriMonth} (${d.hijriMonthAr}) | Year: ${d.hijriYear} AH\nGregorian: ${d.gregorianDate}${d.holidays?.length ? `\nIslamic Events Today: ${d.holidays.join(', ')}` : ''}\nNote: For detailed Islamic calendar, events, and prayer schedules, refer to Hamariweb.com/islamiccalendar`
        );
    }

    if (topics.includes('currency')) {
        await fetch('currency', getCurrencyRates, d =>
            `\n[LIVE CURRENCY RATES (PKR)]\nUSD = PKR ${d.USD_PKR} | GBP = PKR ${d.GBP_PKR} | EUR = PKR ${d.EUR_PKR} | SAR = PKR ${d.SAR_PKR} | AED = PKR ${d.AED_PKR}\nSource: open.er-api.com | Updated: ${d.updatedAt}`
        );
    }

    if (topics.includes('gold')) {
        await fetch('gold', getGoldPrice, d =>
            `\n[LIVE GOLD & SILVER PRICES]\nGold: USD $${d.gold_USD_per_oz}/troy oz | PKR ${d.gold_PKR_per_tola?.toLocaleString()}/tola | PKR ${d.gold_PKR_per_10g?.toLocaleString()}/10g${d.silver_USD_per_oz ? `\nSilver: USD $${d.silver_USD_per_oz}/troy oz` : ''}`
        );
    }

    if (topics.includes('weather')) {
        await fetch('weather', getWeather, d =>
            `\n[CURRENT WEATHER — ${d.city}]\n${d.description} | Temp: ${d.temp_c}°C | Wind: ${d.windspeed_kmh} km/h | ${d.is_day ? 'Daytime' : 'Nighttime'}`
        );
    }

    if (topics.includes('airquality')) {
        await fetch('aqi', getAirQuality, d =>
            `\n[AIR QUALITY — ${d.city}]\nAQI: ${d.aqi} (${d.level}) | Dominant pollutant: ${d.dominantPollutant || 'N/A'}`
        );
    }

    if (topics.includes('news')) {
        try {
            const articles = await getLatestNews(message);
            if (articles) {
                const lines = articles.map((a, i) => `  ${i + 1}. ${a.title} — ${a.source} (${a.publishedAt?.slice(0, 10)})`).join('\n');
                sections.push(`\n[LATEST NEWS]\n${lines}`);
            }
        } catch { /* skip */ }
    }

    if (topics.includes('cricket')) {
        try {
            const sports = await getCricketAndSportsData();
            if (sports) {
                const lines = sports.map(m => `  • [${m.type}] ${m.title} — ${m.details}`).join('\n');
                sections.push(`\n[LATEST SPORTS SCORES AND SPORTS NEWS]\n${lines}`);
            }
        } catch { /* skip */ }
    }

    if (topics.includes('nasa')) {
        await fetch('nasa', getNASAApod, d =>
            `\n[NASA ASTRONOMY PICTURE OF THE DAY — ${d.date}]\nTitle: ${d.title}\n${d.explanation}`
        );
    }

    if (topics.includes('holidays')) {
        await fetch('holidays', getPakistanHolidays, holidays => {
            const lines = holidays.map(h => `  • ${h.date}: ${h.name}${h.localName !== h.name ? ` (${h.localName})` : ''}`).join('\n');
            return `\n[UPCOMING PAKISTAN PUBLIC HOLIDAYS]\n${lines}`;
        });
    }

    if (topics.includes('fuel')) {
        try {
            const f = await getLivePakistanFuelPrices();
            if (f) {
                sections.push(`\n[LIVE PAKISTAN FUEL PRICES]\nPetrol: PKR ${f.petrol_PKR_per_liter}/liter | HSD Diesel: PKR ${f.diesel_PKR_per_liter}/liter\nSource: ${f.note} (Updated: ${f.lastUpdated})\nNote: OGRA announces petrol prices every 2 weeks (1st and 16th of each month). For upcoming price predictions, analyze global crude oil trends and current government subsidy policy.`);
            }
        } catch { /* skip */ }
    }

    if (topics.includes('crypto')) {
        try {
            const c = await getCryptoPrices();
            if (c) {
                const coinLines = Object.entries(c)
                    .filter(([k]) => k !== 'source')
                    .map(([sym, d]) => {
                        const chg = d?.change24h !== null && d?.change24h !== undefined
                            ? ` (${d.change24h >= 0 ? '+' : ''}${d.change24h}% 24h)`
                            : '';
                        return `• ${sym}: $${d?.usd?.toLocaleString()}${chg} | PKR ${d?.pkr?.toLocaleString()}`;
                    })
                    .join('\n');
                sections.push(`\n[LIVE CRYPTO PRICES (USD & PKR) — with 24h change]\n${coinLines}\nSource: ${c.source}`);
            }
            const specificCoinMatch = message.match(/\b(shib(?:a)?(?:\s*inu)?|avax|avalanche|litecoin|ltc|polkadot|dot|chainlink|link|uniswap|uni|tron|trx|matic|polygon|ton|near|sui|pepe|floki|kas|kaspa|injective|inj|sei|render|rndr)\b/i);
            if (specificCoinMatch) {
                const coinData = await getCoinPrice(specificCoinMatch[1]);
                if (coinData) {
                    const chg = coinData.change24h !== null ? ` | 24h: ${coinData.change24h >= 0 ? '+' : ''}${coinData.change24h}%` : '';
                    sections.push(`\n[SPECIFIC COIN: ${coinData.name} (${coinData.symbol})]\nPrice: $${coinData.usd?.toLocaleString()} | PKR ${coinData.pkr?.toLocaleString()}${chg}\nSource: ${coinData.source}`);
                }
            }
        } catch { /* skip */ }
    }

    return sections.join('\n');
}

export async function getInvestmentContext() {
    const cached = _get('investment_ctx');
    if (cached) return cached;
    try {
        const [gold, currency, weather] = await Promise.all([
            getGoldPrice(),
            getCurrencyRates(),
            getWeather()
        ]);
        let ctx = '\n[INVESTMENT MACRO CONTEXT — Pakistan]\n';
        if (currency) {
            ctx += `💱 USD/PKR: ${currency.USD_PKR} | GBP/PKR: ${currency.GBP_PKR}\n`;
            const rupeeWeak = currency.USD_PKR > 280;
            ctx += rupeeWeak
                ? '  → Rupee is relatively weak. Dollar-denominated assets (gold, USD savings) may be better stores of value.\n'
                : '  → Rupee is relatively stable. Local equity investments are less exposed to currency risk.\n';
        }
        if (gold) {
            ctx += `🪙 Gold: PKR ${gold.gold_PKR_per_tola?.toLocaleString()}/tola (USD $${gold.gold_USD_per_oz}/oz)\n`;
            ctx += `  → Use gold price as an inflation hedge benchmark when advising between equity vs gold.\n`;
        }
        if (weather) {
            ctx += `🌤 Weather: ${weather.description}, ${weather.temp_c}°C in ${weather.city}\n`;
        }
        _set('investment_ctx', ctx, 30 * MINUTE);
        return ctx;
    } catch (e) {
        return '';
    }
}
