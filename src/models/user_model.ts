import mongoose from 'mongoose';
import { IUser } from '../types/user_type';

const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  country: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const User = mongoose.model<IUser>('User', userSchema);

export default User;
