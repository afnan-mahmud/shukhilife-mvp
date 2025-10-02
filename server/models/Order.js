const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  invoice: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[0-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  altPhone: {
    type: String,
    trim: true,
    match: [/^[\+]?[0-9][\d]{0,15}$/, 'Please enter a valid alternate phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  productSnapshot: {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String,
      default: ''
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [1000, 'Quantity cannot exceed 1000']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'on_hold', 'call_not_received', 'confirmed', 'canceled', 'completed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  steadfast: {
    sent: {
      type: Boolean,
      default: false
    },
    consignmentId: {
      type: Number,
      default: null
    },
    trackingCode: {
      type: String,
      default: null
    },
    status: {
      type: String,
      default: null
    },
    sentAt: {
      type: Date
    },
    lastSyncedAt: {
      type: Date
    },
    lastError: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ status: 1 });
orderSchema.index({ assignedTo: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'steadfast.sent': 1 });

// Virtual for formatted amount
orderSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Static method to generate invoice number
orderSchema.statics.generateInvoice = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  return `INV-${dateStr}-${randomNum}`;
};

// Method to add a note
orderSchema.methods.addNote = function(authorId, text) {
  this.notes.push({
    author: authorId,
    text: text.trim()
  });
  return this.save();
};

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, authorId, note) {
  this.status = newStatus;
  if (note) {
    this.addNote(authorId, `Status changed to ${newStatus}: ${note}`);
  }
  return this.save();
};

// Method to get sanitized order data
orderSchema.methods.toJSON = function() {
  const order = this.toObject();
  order.formattedAmount = this.formattedAmount;
  return order;
};

module.exports = mongoose.model('Order', orderSchema);
