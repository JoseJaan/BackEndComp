import mongoose from '../../database/index.mjs';

const RentSchema = new mongoose.Schema({
  UserName: {
    type: String,
    required: true,
  },
  UserEmail: {
    type: String,
    required: true,
  },
  UserId: {
    type: String,
    required: true,
  },
  CarName: {
    type: String,
    required: true,
  },
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
  licensePlate: {
    type: String,
    required: true,
  },
  carPrice: {
    type: Number,
    required: true,
  },
});

export default mongoose.model('Rents', RentSchema);
