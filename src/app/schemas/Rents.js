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
    required: true,
  },
  EndAt: {
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
