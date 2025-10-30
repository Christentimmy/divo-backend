

import mongoose from 'mongoose';
import { IUser } from '../types/user_type';

const userSchema = new mongoose.Schema<IUser>({
    username: String,
    email: String,
    password: String,
    phoneNumber: String,
    country: String
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
