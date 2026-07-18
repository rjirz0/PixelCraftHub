import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please fill a valid email address']
  },
  accessKey: { 
    type: String, 
    default: '' 
  },
  source: { 
    type: String, 
    default: 'Static HTML Pixel Realms Portal' 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    default: 'pending' 
  }
});

// Avoid OverwriteModelError by checking if model is already registered
const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

export default Lead;
