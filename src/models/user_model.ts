import mongoose from 'mongoose';
import { IUser } from '../types/user_type';

const userSchema = new mongoose.Schema<IUser>(
  {
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
      select: false,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    country: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    itelBillingVerified: {
      type: Boolean,
      default: false,
    },
    itelBillingSignedUp: {
      type: Boolean,
      default: false,
    },
    itelBillingPIN: {
      type: String,
      sparse: true, // Allow null values
    },
    itelBillingMobileNumber: {
      type: String,
      sparse: true,
    },
    itelBillingClientType: {
      type: Number,
      enum: [1, 2, 3, 4],
      sparse: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ phoneNumber: 1 });
userSchema.index({ username: 1 });
userSchema.index({ itelBillingPIN: 1 });


const User = mongoose.model<IUser>('User', userSchema);

export default User;
