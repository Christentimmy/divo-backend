import { Request, Response } from 'express';
import User from '../models/user_model';

export const authController = {
  register: async (req: Request, res: Response) => {
    if (!req.body) {
      res.status(400).json({ message: 'No data provided' });
      return;
    }

    const { username, email, password, phoneNumber, country } = req.body;

    if (!username || !email || !password || !phoneNumber || !country) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });

    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = new User({
      username,
      email,
      password,
      phoneNumber,
      country,
    });

    await user.save();
    res.json({ message: 'Register' });
  },
  login: (req: Request, res: Response) => {
    res.json({ message: 'Login' });
  },
};
