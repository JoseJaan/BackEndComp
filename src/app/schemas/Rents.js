import mongoose from '../../database/index.mjs';

const RentSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  carName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  endAt: {
    type: Date,
    required: true,
  },
  licensePlate: {
    type: String,
    required: true,
  },
  carPrice: {
    type: Number,
    required: true,
  },
  rentPrice: {
    type: Number,
  },
});

export default mongoose.model('Rents', RentSchema);
