import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import { notFound, errorHandler } from './middleware/error';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
