import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AdminMessage from "../models/AdminMessage.js";

const router = express.Router();

const authMiddleware = async (req, res, next) => {
  const token = req.header("x-auth-token") || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ msg: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ msg: "Invalid token" });
  }
};

router.post("/register", async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Username, email, and password are required" });
    }

    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ msg: "An account with this email already exists" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ msg: "This username is already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted,
        role: user.role,
        personality: user.personality,
        coins: user.coins || 0,
        level: user.level || 1,
        xp: user.xp || 0,
        isPremium: user.isPremium || false,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
      },
    });
  } catch (err) {
    console.error("Auth Register Error:", err.message);
    if (err.message.includes("buffering timed out") || err.message.includes("connection")) {
      return res.status(500).json({
        msg: "Database connection failed. Please ensure your IP is whitelisted in MongoDB Atlas > Network Access.",
      });
    }
    res.status(500).json({ msg: "Server error. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    let { email, password, twoFactorCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    if (user.isBanned) {
      return res.status(403).json({ msg: "Your account has been suspended. Contact support." });
    }


    user.lastActive = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
        avatar: user.avatar,
        twinVoice: user.twinVoice || 'Analyst',
        onboardingCompleted: user.onboardingCompleted,
        role: user.role,
        personality: user.personality,
        coins: user.coins || 0,
        level: user.level || 1,
        xp: user.xp || 0,
        isPremium: user.isPremium || false,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
      },
    });
  } catch (err) {
    console.error("Auth Login Error:", err.message);
    if (err.message.includes("buffering timed out") || err.message.includes("connection")) {
      return res.status(500).json({
        msg: "Database connection failed. Please ensure your IP is whitelisted in MongoDB Atlas > Network Access.",
      });
    }
    res.status(500).json({ msg: "Server error. Please try again." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -__v");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, nickname, bio, avatar, twinVoice, settings } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (username && username.trim() !== user.username) {
      const taken = await User.findOne({ username: username.trim().toLowerCase() });
      if (taken) return res.status(400).json({ msg: "Username already taken" });
      user.username = username.trim().toLowerCase();
    }
    if (nickname !== undefined) user.nickname = nickname.trim();
    if (bio !== undefined) user.bio = bio.trim().slice(0, 300);
    if (avatar !== undefined) user.avatar = avatar;
    if (twinVoice && ['Analyst', 'Stoic', 'Motivator'].includes(twinVoice)) {
      user.twinVoice = twinVoice;
    }
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();
    res.json({
      msg: "Profile updated successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
        avatar: user.avatar,
        twinVoice: user.twinVoice || 'Analyst',
        role: user.role,
        personality: user.personality,
        onboardingCompleted: user.onboardingCompleted,
        coins: user.coins || 0,
        level: user.level || 1,
        xp: user.xp || 0,
        isPremium: user.isPremium || false,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
      }
    });
  } catch (err) {
    console.error("Profile Update Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});


router.put("/goals", authMiddleware, async (req, res) => {
  try {
    const { goals } = req.body;
    if (!Array.isArray(goals)) return res.status(400).json({ msg: "Goals must be an array" });
    await User.findByIdAndUpdate(req.userId, { userGoals: goals });
    res.json({ msg: "Goals saved" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/decisions", authMiddleware, async (req, res) => {
  try {
    const { decisions } = req.body;
    if (!Array.isArray(decisions)) return res.status(400).json({ msg: "Decisions must be an array" });
    await User.findByIdAndUpdate(req.userId, { decisionJournal: decisions });
    res.json({ msg: "Decisions saved" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/mood", authMiddleware, async (req, res) => {
  try {
    const { moodHistory, lastCheckinDate } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (Array.isArray(moodHistory)) {
      user.moodHistory = moodHistory.slice(0, 90);
    }

    const todayStr = lastCheckinDate || new Date().toDateString();
    const lastCheckinStr = user.lastCheckinDate;

    if (lastCheckinStr === todayStr) {
    } else {
      let isConsecutive = false;
      if (lastCheckinStr) {
        const lastDate = new Date(lastCheckinStr);
        const todayDate = new Date(todayStr);
        const diffTime = Math.abs(todayDate - lastDate);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          isConsecutive = true;
        }
      } else {
        isConsecutive = false;
      }
      
      if (isConsecutive) {
        user.currentStreak = (user.currentStreak || 0) + 1;
      } else {
        user.currentStreak = 1;
      }

      if (user.currentStreak > (user.longestStreak || 0)) {
        user.longestStreak = user.currentStreak;
      }
      user.lastCheckinDate = todayStr;
    }

    await user.save();

    res.json({
      msg: "Mood data saved",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        personality: user.personality,
        onboardingCompleted: user.onboardingCompleted,
        coins: user.coins || 0,
        level: user.level || 1,
        xp: user.xp || 0,
        isPremium: user.isPremium || false,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        lastCheckinDate: user.lastCheckinDate
      }
    });
  } catch (err) {
    console.error("Mood Update Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/reward", authMiddleware, async (req, res) => {
  try {
    const { action, goalId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!user.rewardTrack) {
      user.rewardTrack = {
        lastCheckinDate: "",
        lastScenarioDate: "",
        scenarioCountToday: 0,
        lastJournalDate: "",
        journalCountToday: 0,
        lastChatDate: "",
        chatCountToday: 0,
        completedGoalsTracked: []
      };
    }

    const todayStr = new Date().toDateString();
    let coinsGained = 0;
    let xpGained = 0;
    let allowed = false;

    if (user.rewardTrack.lastScenarioDate !== todayStr) {
      user.rewardTrack.lastScenarioDate = todayStr;
      user.rewardTrack.scenarioCountToday = 0;
    }
    if (user.rewardTrack.lastJournalDate !== todayStr) {
      user.rewardTrack.lastJournalDate = todayStr;
      user.rewardTrack.journalCountToday = 0;
    }
    if (user.rewardTrack.lastChatDate !== todayStr) {
      user.rewardTrack.lastChatDate = todayStr;
      user.rewardTrack.chatCountToday = 0;
    }

    if (action === "checkin") {
      if (user.rewardTrack.lastCheckinDate !== todayStr) {
        user.rewardTrack.lastCheckinDate = todayStr;
        coinsGained = 5;
        xpGained = 20;
        allowed = true;
      }
    } else if (action === "streak") {
      coinsGained = 3;
      xpGained = 15;
      allowed = true;
    } else if (action === "journal") {
      if ((user.rewardTrack.journalCountToday || 0) < 3) {
        user.rewardTrack.journalCountToday = (user.rewardTrack.journalCountToday || 0) + 1;
        coinsGained = 4;
        xpGained = 15;
        allowed = true;
      }
    } else if (action === "goal_completed") {
      if (goalId) {
        if (!user.rewardTrack.completedGoalsTracked) {
          user.rewardTrack.completedGoalsTracked = [];
        }
        if (!user.rewardTrack.completedGoalsTracked.includes(goalId)) {
          user.rewardTrack.completedGoalsTracked.push(goalId);
          coinsGained = 10;
          xpGained = 40;
          allowed = true;
        }
      }
    } else if (action === "scenario_run") {
      if ((user.rewardTrack.scenarioCountToday || 0) < 2) {
        user.rewardTrack.scenarioCountToday = (user.rewardTrack.scenarioCountToday || 0) + 1;
        coinsGained = 3;
        xpGained = 15;
        allowed = true;
      }
    } else if (action === "chat_interaction") {
      if ((user.rewardTrack.chatCountToday || 0) < 5) {
        user.rewardTrack.chatCountToday = (user.rewardTrack.chatCountToday || 0) + 1;
        coinsGained = 1;
        xpGained = 5;
        allowed = true;
      }
    }

    if (!allowed) {
      return res.json({
        msg: "Reward limit reached or action already rewarded today",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          bio: user.bio,
          avatar: user.avatar,
          role: user.role,
          personality: user.personality,
          onboardingCompleted: user.onboardingCompleted,
          coins: user.coins || 0,
          level: user.level || 1,
          xp: user.xp || 0,
          isPremium: user.isPremium || false,
          currentStreak: user.currentStreak || 0,
          longestStreak: user.longestStreak || 0
        }
      });
    }

    user.coins = (user.coins || 0) + coinsGained;
    user.xp = (user.xp || 0) + xpGained;

    let leveledUp = false;
    let xpNeeded = (user.level || 1) * 150;
    while (user.xp >= xpNeeded) {
      user.xp -= xpNeeded;
      user.level = (user.level || 1) + 1;
      user.coins = (user.coins || 0) + 15;
      leveledUp = true;
      xpNeeded = user.level * 150;
    }

    user.markModified("rewardTrack");
    await user.save();

    res.json({
      msg: "Reward added successfully",
      coinsGained,
      xpGained,
      leveledUp,
      newLevel: user.level,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        personality: user.personality,
        onboardingCompleted: user.onboardingCompleted,
        coins: user.coins,
        level: user.level,
        xp: user.xp,
        isPremium: user.isPremium,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0
      }
    });
  } catch (err) {
    console.error("Reward Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/unlock-premium", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.isPremium) {
      return res.status(400).json({ msg: "Premium is already active" });
    }

    if ((user.coins || 0) < 500) {
      return res.status(400).json({ msg: "Insufficient Twin Coins" });
    }

    user.coins = (user.coins || 0) - 500;
    user.isPremium = true;
    await user.save();

    res.json({
      msg: "Premium unlocked successfully!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        personality: user.personality,
        onboardingCompleted: user.onboardingCompleted,
        coins: user.coins,
        level: user.level,
        xp: user.xp,
        isPremium: user.isPremium,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0
      }
    });
  } catch (err) {
    console.error("Unlock Premium Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/messages", authMiddleware, async (req, res) => {
  try {
    const { type, message } = req.body;
    if (!type || !message) {
      return res.status(400).json({ msg: "Type and message content are required" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const newMessage = new AdminMessage({
      userId: user._id,
      username: user.username,
      email: user.email,
      type,
      message: message.trim()
    });

    await newMessage.save();
    res.json({ msg: "Message sent to admin successfully!" });
  } catch (err) {
    console.error("Contact Admin Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;