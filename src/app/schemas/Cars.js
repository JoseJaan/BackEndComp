import mongoose from '../../database/index.js';
import Slugify from '../../utils/Slugify.js';

const CarsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
  },
  brand: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  kilometers: {
    type: Number,
    required: true,
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
  },
  available: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  featuredImage: {
    type: String,
  },
  images: [
    {
      type: String,
    },
  ],
});

CarsSchema.pre('save', function (next) {
  const name = this.name;
  this.slug = Slugify(name);
  next();
});

export default mongoose.model('Cars', CarsSchema);
