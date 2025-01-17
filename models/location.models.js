import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const locationSchema = new Schema({
  name: { type: String, required: true },
  area: { type: String, required: true },
  coordinates: {
    type: [[Number]], // Array of [longitude, latitude] pairs
    required: true,
    validate: {
      validator: function(v) {
        // Validate that each coordinate pair has exactly 2 numbers
        return v.every(coord => 
          Array.isArray(coord) && 
          coord.length === 2 && 
          coord.every(num => typeof num === 'number')
        );
      },
      message: 'Coordinates must be an array of [longitude, latitude] pairs'
    }
  }
});

// Add GeoJSON index for better querying
locationSchema.index({ coordinates: '2d' });

const Location = mongoose.model('Location', locationSchema, 'locations');

export default Location;
