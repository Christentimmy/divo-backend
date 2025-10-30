import { Request, Response } from 'express';
import User from '../models/user_model';

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
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
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      if (!req.body) {
        res.status(400).json({ message: 'No data provided' });
        return;
      }

      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      const user = await User.findOne({ email });

      if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const isPasswordValid = (user.password) === password;

      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};
