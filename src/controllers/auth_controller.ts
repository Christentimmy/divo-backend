import { Request, Response } from 'express';

export const authController = {
  register: (req: Request, res: Response) => {

    if (!req.body) {
      res.status(400).json({ message: 'No data provided' });
      return;
    }

    const { username, email, password, phoneNumber, country } = req.body;

    if (!username || !email || !password || !phoneNumber || !country) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    res.json({ message: 'Register' });
  },
  login: (req: Request, res: Response) => {
    res.json({ message: 'Login' });
  },
};
