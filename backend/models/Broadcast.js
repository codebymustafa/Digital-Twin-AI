import mongoose from 'mongoose';

const BroadcastSchema = new mongoose.Schema({
  message:   { type: String, required: true },
  sentBy:    { type: String, default: 'admin' },
  priority:  { type: String, enum: ['info','warning','critical'], default: 'info' },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

BroadcastSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Broadcast', BroadcastSchema);
