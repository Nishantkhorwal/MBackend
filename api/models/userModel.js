import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String, // Not usually stored but added for completeness
  },
  isAdmin: {
    type: Boolean,
    default: false, // Default to false unless specified
  }
});

const UserRof = mongoose.model('UserRof', UserSchema);

export default UserRof;

