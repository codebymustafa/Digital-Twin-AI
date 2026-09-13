import express from 'express';
import askHF from '../models/aiService.js';
import Chat from '../models/Chat.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Message is required',
        });
    }

    const reply = await askHF(message.trim());

    res.json({
        success: true,
        reply,
    });
});

router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const chat = await Chat.findOne({ userId });
        if (!chat) return res.json({ messages: [] });

        const messages = (chat.messages || []).slice(-50).map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
        }));

        return res.json({ messages });
    } catch (err) {
        console.error('Chat history fetch error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

export default router;