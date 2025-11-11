/**
 * Conversation Model
 * [COPILOT-UPGRADE]: MongoDB schema for storing conversation history and context
 */

import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
conversationSchema.index({ userId: 1, sessionId: 1 });
conversationSchema.index({ userId: 1, isActive: 1, lastInteraction: -1 });

// Expire old conversations after 30 days of inactivity
conversationSchema.index({ lastInteraction: 1 }, { expireAfterSeconds: 2592000 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
