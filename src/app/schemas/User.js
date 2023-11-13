import mongoose from '../../database';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetTokenExpiration: {
    type: Date,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    select: false,
  },
});

UserSchema.pre('save', function (next) {
  bcrypt
    .hash(this.password, 10)
    .then((hash) => {
      this.password = hash;
      next();
    })
    .catch((error) => {
      console.error('Error hashing password', error);
    });
});

UserSchema.pre('save', function (next) {
  if (
    this.email == 'admin@hotmail.com' ||
    this.email == 'admin2@hotmai.com' ||
    this.email == 'admin3@hotmail.com'
  ) {
    this.isAdmin = true;
  } else {
    this.isAdmin = false;
  }
  next();
});

export default mongoose.model('User', UserSchema);
