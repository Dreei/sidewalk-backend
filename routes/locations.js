import express from 'express';
import Location from '../models/location.models.js';

const locationsRouter = express.Router();

// Get all locations
locationsRouter.get('/', async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get location by ID
locationsRouter.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new location
locationsRouter.post('/', async (req, res) => {
  const { name, area, coordinates } = req.body;

  // Validate coordinates structure
  if (!Array.isArray(coordinates) || !coordinates.every(coord => 
    Array.isArray(coord) && 
    coord.length === 2 && 
    coord.every(num => typeof num === 'number')
  )) {
    return res.status(400).json({ 
      message: 'Invalid coordinates format. Expected array of [longitude, latitude] pairs' 
    });
  }

  const location = new Location({
    name,
    area,
    coordinates
  });

  try {
    const newLocation = await location.save();
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a location
locationsRouter.patch('/:id', async (req, res) => {
  try {
    const { name, area, coordinates } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (area) updates.area = area;
    if (coordinates) {
      // Validate coordinates structure
      if (!Array.isArray(coordinates) || !coordinates.every(coord => 
        Array.isArray(coord) && 
        coord.length === 2 && 
        coord.every(num => typeof num === 'number')
      )) {
        return res.status(400).json({ 
          message: 'Invalid coordinates format. Expected array of [longitude, latitude] pairs' 
        });
      }
      updates.coordinates = coordinates;
    }

    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a location
locationsRouter.delete('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    await location.remove();
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get locations by area
locationsRouter.get('/area/:area', async (req, res) => {
  try {
    const locations = await Location.find({ area: req.params.area });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default locationsRouter;
