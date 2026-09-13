import mongoose from "mongoose";

const GoalStepSchema = new mongoose.Schema({ text: String, done: { type: Boolean, default: false } }, { _id: false });
const GoalSchema = new mongoose.Schema({
  id: Number,
  title: String,
  category: String,
  deadline: String,
  steps: [GoalStepSchema],
  completed: { type: Boolean, default: false },
  createdAt: String,
}, { _id: false });

const DecisionRatingSchema = new mongoose.Schema({ score: Number, label: String, color: String, advice: String }, { _id: false });
const DecisionSchema = new mongoose.Schema({
  id: Number,
  decision: String,
  type: String,
  outcome: String,
  emotion: String,
  rating: DecisionRatingSchema,
  date: String,
  time: String,
}, { _id: false });

const MoodEntrySchema = new mongoose.Schema({
  date: String,
  mood: mongoose.Schema.Types.Mixed,
  answers: mongoose.Schema.Types.Mixed,
}, { _id: false });

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    nickname: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    twinVoice: { type: String, enum: ['Analyst', 'Stoic', 'Motivator'], default: 'Analyst' },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: '' },

    personality: {
      introvertExtrovert: { type: Number, default: 50, min: 0, max: 100 },
      riskTaking: { type: Number, default: 50, min: 0, max: 100 },
      interests: { type: [String], default: [] },
      goals: { type: [String], default: [] },
      behaviorTrends: {
        dailyChats: { type: Number, default: 0 },
        moodHistory: { type: [String], default: [] },
        decisionPatterns: { type: [String], default: [] },
      },
    },

    userGoals: { type: [GoalSchema], default: [] },
    decisionJournal: { type: [DecisionSchema], default: [] },
    moodHistory: { type: [MoodEntrySchema], default: [] },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCheckinDate: { type: String, default: '' },

    coins: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    rewardTrack: { type: mongoose.Schema.Types.Mixed, default: {} },

    onboardingCompleted: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);