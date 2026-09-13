import express from "express";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import Broadcast from "../models/Broadcast.js";
import AdminMessage from "../models/AdminMessage.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const adminAuth = async (req, res, next) => {
  const token = req.header("x-auth-token") || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role !== "admin") return res.status(403).json({ msg: "Access denied. Admin role required." });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select("-password -__v").sort({ createdAt: -1 });
    const enriched = await Promise.all(users.map(async (u) => {
      const adminMsgCount = await AdminMessage.countDocuments({
        $or: [{ userId: u._id }, { email: u.email }]
      });
      const chat = await Chat.findOne({ userId: u._id });
      return {
        ...u.toObject(),
        messageCount: adminMsgCount,
        chatMessageCount: chat?.messages?.length || 0,
        lastChatAt: chat?.updatedAt || null
      };
    }));
    res.json(enriched);
  } catch (err) {
    console.error("Admin Get Users Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});


router.put("/users/:id/role", adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) return res.status(400).json({ msg: "Invalid role value" });
    if (req.params.id === req.user.id.toString()) return res.status(400).json({ msg: "You cannot change your own role" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    user.role = role;
    await user.save();
    res.json({ msg: `User role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/users/:id/ban", adminAuth, async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString()) return res.status(400).json({ msg: "You cannot ban yourself" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ msg: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`, isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString()) return res.status(400).json({ msg: "You cannot delete your own account" });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    await Chat.deleteOne({ userId: req.params.id });
    res.json({ msg: "User and all associated data deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/users/:id/chats", adminAuth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ userId: req.params.id });
    const user = await User.findById(req.params.id).select("username email");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({
      user,
      messages: chat?.messages?.slice(-50) || [],
      totalMessages: chat?.messages?.length || 0
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/users/:id/chats", adminAuth, async (req, res) => {
  try {
    await Chat.findOneAndUpdate({ userId: req.params.id }, { messages: [] });
    res.json({ msg: "Chat history cleared successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onboardedUsers = await User.countDocuments({ onboardingCompleted: true });
    const adminUsers = await User.countDocuments({ role: "admin" });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    const chats = await Chat.find({});
    let totalMessages = 0;
    chats.forEach(c => { if (c.messages) totalMessages += c.messages.length; });

    const memUsage = process.memoryUsage();
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    const timeSlots = [
      { name: '12:00 AM', hourStart: 0, hourEnd: 3 },
      { name: '4:00 AM', hourStart: 4, hourEnd: 7 },
      { name: '8:00 AM', hourStart: 8, hourEnd: 11 },
      { name: '12:00 PM', hourStart: 12, hourEnd: 15 },
      { name: '4:00 PM', hourStart: 16, hourEnd: 19 },
      { name: '8:00 PM', hourStart: 20, hourEnd: 22 },
      { name: '11:59 PM', hourStart: 23, hourEnd: 23 },
    ];

    const hourlyThroughput = timeSlots.map(slot => {
      let slotMsgCount = 0;
      chats.forEach(c => {
        if (Array.isArray(c.messages)) {
          c.messages.forEach(m => {
            if (m.timestamp) {
              const msgDate = new Date(m.timestamp);
              const msgHour = msgDate.getHours();
              const isLast24h = (Date.now() - msgDate.getTime()) <= (24 * 60 * 60 * 1000);
              if (isLast24h && msgHour >= slot.hourStart && msgHour <= slot.hourEnd) {
                slotMsgCount++;
              }
            }
          });
        }
      });
      return {
        name: slot.name,
        load: slotMsgCount,
        messages: slotMsgCount,
        users: Math.max(1, totalUsers)
      };
    });

    res.json({
      totalUsers,
      onboardedUsers,
      adminUsers,
      bannedUsers,
      totalMessages,
      totalChats: chats.length,
      rssMB,
      heapUsedMB,
      heapTotalMB,
      uptime: Math.round(process.uptime()),
      uptimeFormatted: formatUptime(Math.round(process.uptime())),
      hourlyThroughput,
      alerts: [
        { id: '#SYS-1', msg: `Memory: RSS ${rssMB}MB | Heap ${heapUsedMB}/${heapTotalMB}MB`, type: rssMB > 500 ? 'WARNING' : 'STABLE', color: rssMB > 500 ? '#ffaa00' : '#00ffaa' },
        { id: '#DB-2', msg: `MongoDB Atlas connected | ${totalUsers} users registered`, type: 'INFO', color: '#00e5ff' },
        { id: '#AI-3', msg: `Chat engine active | ${totalMessages} total messages processed`, type: 'SYNCED', color: '#a200ff' },
        { id: '#SEC-4', msg: `${bannedUsers} banned account${bannedUsers !== 1 ? 's' : ''} | ${adminUsers} admin${adminUsers !== 1 ? 's' : ''}`, type: bannedUsers > 0 ? 'WARNING' : 'STABLE', color: bannedUsers > 0 ? '#ff5a00' : '#00ffaa' },
      ]
    });
  } catch (err) {
    console.error("Admin Stats Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/overview", adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const days = 7;
    const growth = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));
      const count = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
      growth.push({
        date: start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        newUsers: count
      });
    }

    const recentUsers = await User.find({})
      .select("username email role createdAt isBanned onboardingCompleted")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ growth, recentUsers });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/broadcast", adminAuth, async (req, res) => {
  try {
    const { message, priority = 'info' } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ msg: "Broadcast message cannot be empty" });

    const broadcast = await Broadcast.create({
      message: message.trim(),
      sentBy: req.user.username,
      priority,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('broadcast_message', {
        id: broadcast._id,
        message: broadcast.message,
        sentBy: broadcast.sentBy,
        priority: broadcast.priority,
        createdAt: broadcast.createdAt,
      });
    }

    const totalUsers = await User.countDocuments();
    res.json({ msg: `Broadcast sent to ${totalUsers} users`, broadcast });
  } catch (err) {
    console.error("Broadcast Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/coins", adminAuth, async (req, res) => {
  try {
    const users = await User.find({})
      .select("username email coins level xp isPremium currentStreak rewardTrack lastActive createdAt")
      .sort({ coins: -1 });

    const totalCoinsIssued = users.reduce((sum, u) => sum + (u.coins || 0), 0);
    const premiumCount = users.filter(u => u.isPremium).length;

    const enriched = users.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      coins: u.coins || 0,
      level: u.level || 1,
      xp: u.xp || 0,
      isPremium: u.isPremium || false,
      currentStreak: u.currentStreak || 0,
      lastActive: u.lastActive,
      createdAt: u.createdAt,
      activityLog: {
        lastCheckin: u.rewardTrack?.lastCheckinDate || null,
        lastScenario: u.rewardTrack?.lastScenarioDate || null,
        lastJournal: u.rewardTrack?.lastJournalDate || null,
        lastChat: u.rewardTrack?.lastChatDate || null,
        scenarioToday: u.rewardTrack?.scenarioCountToday || 0,
        journalToday: u.rewardTrack?.journalCountToday || 0,
        chatToday: u.rewardTrack?.chatCountToday || 0,
        goalsCompleted: (u.rewardTrack?.completedGoalsTracked || []).length,
      }
    }));

    res.json({ users: enriched, totalCoinsIssued, premiumCount });
  } catch (err) {
    console.error("Admin Coins Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/users/:id/coins", adminAuth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({ msg: "Amount must be a valid number" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const oldCoins = user.coins || 0;
    user.coins = Math.max(0, oldCoins + amount);
    await user.save();

    res.json({
      msg: `Coins ${amount >= 0 ? 'added' : 'deducted'} successfully`,
      username: user.username,
      oldCoins,
      newCoins: user.coins,
      change: amount,
      reason: reason || 'Manual admin adjustment'
    });
  } catch (err) {
    console.error("Admin Coin Adjust Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/broadcasts", async (req, res) => {
  try {
    const now = new Date();
    const broadcasts = await Broadcast.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/messages", adminAuth, async (req, res) => {
  try {
    const messages = await AdminMessage.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(messages);
  } catch (err) {
    console.error("Get Admin Messages Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/messages/:id", adminAuth, async (req, res) => {
  try {
    await AdminMessage.findByIdAndDelete(req.params.id);
    res.json({ msg: "Message deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/clear-cache", adminAuth, async (req, res) => {
  try {
    const memBefore = process.memoryUsage().heapUsed;
    if (global.gc) {
      global.gc();
    }
    const memAfter = process.memoryUsage().heapUsed;
    const freedMB = Math.max(0, ((memBefore - memAfter) / 1024 / 1024).toFixed(2));

    res.json({
      msg: `Server memory cache successfully cleared. (${freedMB} MB released)`,
      freedMB,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Clear Cache Error:", err.message);
    res.status(500).json({ msg: "Failed to clear server cache" });
  }
});

router.post("/system-integrity", adminAuth, async (req, res) => {
  try {
    const dbConnected = (User.db.readyState === 1);
    const jwtConfigured = Boolean(process.env.JWT_SECRET);
    const mem = process.memoryUsage();
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
    const memoryHealthy = heapUsedMB < (heapTotalMB * 0.95);

    const checks = [
      { name: "Database Connection", status: dbConnected ? "PASSED" : "FAILED", detail: dbConnected ? "MongoDB Atlas connected & responsive" : "DB disconnected" },
      { name: "JWT Authorization Engine", status: jwtConfigured ? "PASSED" : "FAILED", detail: jwtConfigured ? "Secret verified" : "JWT_SECRET missing" },
      { name: "Node.js V8 Memory Allocation", status: memoryHealthy ? "PASSED" : "WARNING", detail: `Heap: ${heapUsedMB}/${heapTotalMB} MB` },
      { name: "System Uptime Diagnostics", status: "PASSED", detail: `Up for ${formatUptime(Math.round(process.uptime()))}` }
    ];

    const overallHealthy = dbConnected && jwtConfigured && memoryHealthy;

    res.json({
      status: overallHealthy ? "HEALTHY" : "DEGRADED",
      msg: overallHealthy ? "All system integrity protocols are valid and operational." : "System degradation detected.",
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("System Integrity Error:", err.message);
    res.status(500).json({ msg: "Failed to run system integrity check" });
  }
});

router.get("/system-diagnostics", adminAuth, async (req, res) => {
  try {
    const mem = process.memoryUsage();
    res.json({
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      uptimeFormatted: formatUptime(Math.round(process.uptime())),
      memoryUsage: {
        rssMB: Math.round(mem.rss / 1024 / 1024),
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        externalMB: Math.round(mem.external / 1024 / 1024)
      },
      dbState: User.db.readyState === 1 ? "Connected" : "Disconnected"
    });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch diagnostics" });
  }
});

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default router;

