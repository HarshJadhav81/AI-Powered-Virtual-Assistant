/**
 * Conversation Service - Context Memory Management
 * [COPILOT-UPGRADE]: MongoDB-based conversation history for intelligent follow-ups
 */

import Conversation from '../models/conversation.model.js';
import { v4 as uuidv4 } from 'uuid';

class ConversationService {
  /**
   * Create or get active conversation session
   */
  async getOrCreateSession(userId) {
    try {
      // Check for active session (less than 1 hour old)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      let conversation = await Conversation.findOne({
        userId,
        isActive: true,
        lastInteraction: { $gte: oneHourAgo }
      }).sort({ lastInteraction: -1 });

      if (!conversation) {
        // Create new session
        conversation = await Conversation.create({
          userId,
          sessionId: uuidv4(),
          messages: [],
          context: {},
          isActive: true
        });
        
        console.info('[CONVERSATION-SERVICE]', `New session created: ${conversation.sessionId}`);
      } else {
        console.info('[CONVERSATION-SERVICE]', `Using existing session: ${conversation.sessionId}`);
      }

      return conversation;
    } catch (error) {
      console.error('[CONVERSATION-ERROR]:', error);
      throw new Error('Failed to get or create conversation session');
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(userId, role, content, metadata = {}) {
    try {
      const conversation = await this.getOrCreateSession(userId);

      conversation.messages.push({
        role,
        content,
        timestamp: new Date(),
        metadata
      });

      // Keep only last 20 messages for performance
      if (conversation.messages.length > 20) {
        conversation.messages = conversation.messages.slice(-20);
      }

      conversation.lastInteraction = new Date();
      await conversation.save();

      console.info('[CONVERSATION-SERVICE]', `Message added to session ${conversation.sessionId}`);

      return conversation;
    } catch (error) {
      console.error('[CONVERSATION-ERROR]:', error);
      throw new Error('Failed to add message to conversation');
    }
  }

  /**
   * Get conversation context for AI
   */
  async getContext(userId, limit = 10) {
    try {
      const conversation = await this.getOrCreateSession(userId);

      // Get last N messages for context
      const recentMessages = conversation.messages.slice(-limit);

      // Format for Gemini
      const contextString = recentMessages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      return {
        sessionId: conversation.sessionId,
        messages: recentMessages,
        contextString,
        context: conversation.context,
        messageCount: conversation.messages.length
      };
    } catch (error) {
      console.error('[CONVERSATION-ERROR]:', error);
      return {
        sessionId: null,
        messages: [],
        contextString: '',
        context: {},
        messageCount: 0
      };
    }
  }

  /**
   * Update conversation context
   */
  async updateContext(userId, contextData) {
    try {
      const conversation = await this.getOrCreateSession(userId);

      conversation.context = {
        ...conversation.context,
        ...contextData
      };

      await conversation.save();

      console.info('[CONVERSATION-SERVICE]', `Context updated for session ${conversation.sessionId}`);

      return conversation.context;
    } catch (error) {
      console.error('[CONVERSATION-ERROR]:', error);
      throw new Error('Failed to update conversation context');
    }
  }

  /**
   * End current session
   */
  async endSession(userId) {
    try {
      const conversation = await Conversation.findOne({
        userId,
        isActive: true
      }).sort({ lastInteraction: -1 });

      if (conversation) {
        conversation.isActive = false;
        await conversation.save();
        
        console.info('[CONVERSATION-SERVICE]', `Session ended: ${conversation.sessionId}`);
      }

      return { success: true };
    } catch (error) {
      console.error('[CONVERSATION-ERROR]:', error);
      throw new Error('Failed to end conversation session');
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(userId, limit = 5) {
    try {
      const conversations = await Conversation.find({ userId })
        .sort({ lastInteraction: -1 })
        .limit(limit);

      return conversations.map(conv => ({
        sessionId: conv.sessionId,
        messageCount: conv.messages.length,
        lastInteraction: conv.lastInteraction,
        isActive: conv.isActive,
        context: conv.context
      }));
    } catch (error) {
      console.error('[CONVERSATION-ERROR]:', error);
      throw new Error('Failed to get conversation history');
    }
  }

  /**
   * Clear old conversations
   */
  async clearOldConversations(userId, daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const result = await Conversation.deleteMany({
        userId,
        lastInteraction: { $lt: cutoffDate },
        isActive: false
      });

      console.info('[CONVERSATION-SERVICE]', `Deleted ${result.deletedCount} old conversations`);

      return { deletedCount: result.deletedCount };
    } catch (error) {
      console.error('[CONVERSATION-ERROR]:', error);
      throw new Error('Failed to clear old conversations');
    }
  }

  /**
   * Extract entities from conversation for context
   */
  extractEntities(messages) {
    const entities = {
      people: new Set(),
      places: new Set(),
      topics: new Set(),
      dates: new Set()
    };

    messages.forEach(msg => {
      if (msg.metadata?.entities) {
        const { people, places, topics, dates } = msg.metadata.entities;
        people?.forEach(p => entities.people.add(p));
        places?.forEach(p => entities.places.add(p));
        topics?.forEach(t => entities.topics.add(t));
        dates?.forEach(d => entities.dates.add(d));
      }
    });

    return {
      people: Array.from(entities.people),
      places: Array.from(entities.places),
      topics: Array.from(entities.topics),
      dates: Array.from(entities.dates)
    };
  }
}

// Export singleton instance
const conversationService = new ConversationService();
export default conversationService;
