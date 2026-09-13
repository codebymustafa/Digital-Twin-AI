import express from 'express';
import { getMarketOverview, getKSE100, getStockSummary } from '../services/psxService.js';

const router = express.Router();

router.get('/market', async (req, res) => {
    try {
        const overview = await getMarketOverview();
        if (!overview) {
            return res.status(503).json({
                error: 'PSX data is temporarily unavailable. Please try again in a moment.',
            });
        }
        res.json(overview);
    } catch (err) {
        console.error('PSX /market Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch PSX market data.' });
    }
});

router.get('/kse100', async (req, res) => {
    try {
        const data = await getKSE100();
        if (!data) return res.status(503).json({ error: 'KSE-100 data unavailable.' });
        res.json(data);
    } catch (err) {
        console.error('PSX /kse100 Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch KSE-100 data.' });
    }
});

router.get('/stock/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol?.toUpperCase();
        if (!symbol || symbol.length > 10) {
            return res.status(400).json({ error: 'Invalid stock symbol.' });
        }
        const data = await getStockSummary(symbol);
        if (!data) {
            return res.status(404).json({ error: `No data found for "${symbol}". Make sure the symbol is a valid PSX ticker.` });
        }
        res.json(data);
    } catch (err) {
        console.error('PSX /stock/:symbol Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch stock data.' });
    }
});

export default router;
