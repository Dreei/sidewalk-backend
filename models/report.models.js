import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const reportSchema = new Schema({
  userType: { 
    type: String, 
    required: true,
    enum: ['general_public', 'elderly', 'pwd', 'bike_user']
  },
  issueType: { 
    type: String, 
    required: true,
    enum: ['broken_pavement', 'missing_sidewalk', 'obstruction', 'no_ramps', 'poor_lighting', 'others']
  },
  description: { type: String, required: true },
  location: { 
    type: Schema.Types.ObjectId, 
    ref: 'Location', 
    required: true 
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';
      },
      message: props => `${props.value} is not a valid coordinate pair!`
    }
  }
}, {
  timestamps: true,
});

// Add index for location reference
reportSchema.index({ location: 1 });

const Report = mongoose.model('Report', reportSchema, 'reports');

export default Report;
