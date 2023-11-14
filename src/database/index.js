import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/car-rental', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.Promise = global.Promise;

export default mongoose;
