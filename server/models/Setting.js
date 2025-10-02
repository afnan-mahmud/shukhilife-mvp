const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  }
}, {
  timestamps: true
});


// Static method to get setting value
settingSchema.statics.getValue = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error('Error getting setting value:', error);
    return defaultValue;
  }
};

// Static method to set setting value
settingSchema.statics.setValue = async function(key, value, description = '') {
  try {
    const setting = await this.findOneAndUpdate(
      { key },
      { 
        key, 
        value, 
        description,
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true 
      }
    );
    return setting;
  } catch (error) {
    console.error('Error setting value:', error);
    throw error;
  }
};

// Static method to increment a numeric setting
settingSchema.statics.increment = async function(key, incrementBy = 1) {
  try {
    const setting = await this.findOneAndUpdate(
      { key },
      { 
        $inc: { value: incrementBy },
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true 
      }
    );
    return setting.value;
  } catch (error) {
    console.error('Error incrementing setting:', error);
    throw error;
  }
};

module.exports = mongoose.model('Setting', settingSchema);
