/**
 * Note Model
 * [COPILOT-UPGRADE]: MongoDB schema for notes and todos
 */

import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['note', 'todo', 'reminder'],
    default: 'note'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
noteSchema.index({ userId: 1, type: 1, isCompleted: 1 });
noteSchema.index({ userId: 1, tags: 1 });
noteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

// Text index for search
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Note = mongoose.model('Note', noteSchema);

export default Note;
