import mongoose from 'mongoose';
require('dotenv.js').config();


//mongoose.connect('mongodb://127.0.0.1:27017/car-rental',

//const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car-rental';

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.Promise = global.Promise;

export default mongoose;
