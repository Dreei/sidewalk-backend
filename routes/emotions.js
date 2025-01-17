import express from 'express';
import Emotion from '../models/emotion.models.js';
const emotionsRouter = express.Router();

// Get all emotions
emotionsRouter.get('/', async (req, res) => {
  try {
    const emotions = await Emotion.find().populate('location');
    res.json(emotions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new emotion
emotionsRouter.post('/', async (req, res) => {
  const { emotion, userType, description, locationId } = req.body;

  const newEmotion = new Emotion({
    emotion,
    userType,
    description,
    location: locationId,
  });

  try {
    const savedEmotion = await newEmotion.save();
    res.status(201).json(savedEmotion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default emotionsRouter;

