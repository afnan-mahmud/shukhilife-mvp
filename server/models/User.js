const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  passwordHash: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'support', 'packaging'],
    default: 'packaging',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


// Virtual for password (not stored in DB)
userSchema.virtual('password')
  .set(function(password) {
    this._password = password;
  })
  .get(function() {
    return this._password;
  });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash') && !this._password) {
    return next();
  }

  if (this._password) {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this._password, salt);
    this._password = undefined;
  }
  
  // Ensure passwordHash is set
  if (!this.passwordHash) {
    return next(new Error('Password is required'));
  }
  
  next();
});

// Method to check password
userSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Method to get sanitized user data (without passwordHash)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
