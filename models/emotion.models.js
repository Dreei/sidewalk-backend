import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const emotionSchema = new Schema({
  emotion: { 
    type: String, 
    required: true,
    enum: ['good!', 'okay!' ,'neutral', 'uneasy', 'unsafe']
  },
  userType: {
    type: String,
    required: true,
    enum: ['general_public', 'elderly', 'pwd', 'bike_user']
  },
  description: { type: String },
  location: { 
    type: Schema.Types.ObjectId, 
    ref: 'Location', 
    required: true 
  }
}, {
  timestamps: true,
});

// Add index for location reference
emotionSchema.index({ location: 1 });

const Emotion = mongoose.model('Emotion', emotionSchema, 'emotions');

export default Emotion;
