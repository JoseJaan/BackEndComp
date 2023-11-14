import mongoose from 'mongoose';

//mongoose.connect('mongodb://127.0.0.1:27017/car-rental',

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car-rental';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.Promise = global.Promise;

export default mongoose;
