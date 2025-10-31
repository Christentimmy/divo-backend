import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import { notFound, errorHandler } from './middleware/error';
import authRouter from './routes/auth_route';
import connectDB from './config/database';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);

app.use(notFound);
app.use(errorHandler);

connectDB();

export default app;
