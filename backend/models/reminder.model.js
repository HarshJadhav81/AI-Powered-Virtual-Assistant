/**
 * Reminder Model
 * [COPILOT-UPGRADE]: MongoDB schema for reminders and alarms
 */

import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  repeat: {
    type: String,
    enum: ['once', 'daily', 'weekly', 'monthly'],
    default: 'once'
  },
  type: {
    type: String,
    enum: ['reminder', 'alarm'],
    default: 'reminder'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for querying active reminders
reminderSchema.index({ userId: 1, isActive: 1, scheduledTime: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;
