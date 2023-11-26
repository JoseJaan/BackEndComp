import mongoose from '../../database/index.mjs';

const HistorySchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  carName: {
    type: String,
    required: true,
  },
  carLicensePlate: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  endedAt: {
    type: Date,
    default: Date.now,
  },
  carPrice: {
    type: Number,
    required: true,
  },
  rentPrice: {
    type: Number,
  },
  kilometersDriven: {
    type: String,
    required: true,
  },
});

export default mongoose.model('History', HistorySchema);
