import { Router } from 'express';
import { User } from '../models/User.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body ?? {};

    if (!email || !username || !password) {
      return res.status(400).json({ message: 'email, username and password are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const created = await User.create({ email, username, password });

    // minimal response shape for the Angular app
    return res.status(201).json({
      _id: created._id,
      email: created.email,
      username: created.username
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

