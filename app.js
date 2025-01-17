import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB with enhanced options
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB database connection established successfully');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Error handling for MongoDB connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});


const app = express();
const port = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());


// Import routes
import locationsRouter from './routes/locations.js';
import reportsRouter from './routes/reports.js';
import emotionsRouter from './routes/emotions.js';
import analyticsRouter from './routes/analytics.js';

// Use routes
app.use('/api/locations', locationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/emotions', emotionsRouter);
app.use('/api/analytics', analyticsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

