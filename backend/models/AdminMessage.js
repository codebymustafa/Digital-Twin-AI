import mongoose from 'mongoose';

const AdminMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('AdminMessage', AdminMessageSchema);
