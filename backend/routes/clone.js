import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

router.post('/onboard', auth, async (req, res) => {
  try {
    const { introvertExtrovert, riskTaking, interests, goals } = req.body;
    let user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.personality = { introvertExtrovert, riskTaking, interests, goals };
    user.onboardingCompleted = true;
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password -__v");
        res.json(user);
    } catch(err) {
        res.status(500).send("Server Error");
    }
})

export default router;
