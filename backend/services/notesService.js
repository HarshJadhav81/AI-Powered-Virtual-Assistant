/**
 * Notes Service - Note Taking & Todo Management
 * [COPILOT-UPGRADE]: MongoDB-based notes and todo system with voice commands
 */

import Note from '../models/note.model.js';

class NotesService {
  /**
   * Create a new note
   */
  async createNote(userId, noteData) {
    try {
      const { title, content, type, tags } = noteData;

      const note = await Note.create({
        userId,
        title: title || 'Untitled Note',
        content,
        type: type || 'note', // note, todo, reminder
        tags: tags || [],
        isCompleted: false
      });

      console.info('[NOTES-SERVICE]', `Created note: ${note._id}`);

      return {
        success: true,
        note: this.formatNote(note),
        voiceResponse: `Note created: ${note.title}`
      };
    } catch (error) {
      console.error('[NOTES-ERROR]:', error);
      throw new Error('Failed to create note');
    }
  }

  /**
   * Get user's notes
   */
  async getUserNotes(userId, filters = {}) {
    try {
      const query = { userId };

      // Apply filters
      if (filters.type) {
        query.type = filters.type;
      }
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      if (filters.completed !== undefined) {
        query.isCompleted = filters.completed;
      }

      const notes = await Note.find(query)
        .sort({ isPinned: -1, updatedAt: -1 })
        .limit(filters.limit || 50);

      // Create voice response
      let voiceResponse = '';
      if (filters.type === 'todo') {
        const pendingCount = notes.filter(n => !n.isCompleted).length;
        voiceResponse = `You have ${pendingCount} pending tasks. `;
        notes.slice(0, 3).forEach((note, index) => {
          if (!note.isCompleted) {
            voiceResponse += `${index + 1}. ${note.title}. `;
          }
        });
      } else {
        voiceResponse = `You have ${notes.length} notes. `;
        notes.slice(0, 3).forEach((note, index) => {
          voiceResponse += `${index + 1}. ${note.title}. `;
        });
      }

      return {
        notes: notes.map(n => this.formatNote(n)),
        count: notes.length,
        voiceResponse
      };
    } catch (error) {
      console.error('[NOTES-ERROR]:', error);
      throw new Error('Failed to fetch notes');
    }
  }

  /**
   * Update a note
   */
  async updateNote(noteId, updates) {
    try {
      const note = await Note.findByIdAndUpdate(
        noteId,
        { $set: updates },
        { new: true }
      );

      if (!note) {
        throw new Error('Note not found');
      }

      return {
        success: true,
        note: this.formatNote(note),
        voiceResponse: `Note updated: ${note.title}`
      };
    } catch (error) {
      console.error('[NOTES-ERROR]:', error);
      throw new Error('Failed to update note');
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId) {
    try {
      const note = await Note.findByIdAndDelete(noteId);

      if (!note) {
        throw new Error('Note not found');
      }

      return {
        success: true,
        voiceResponse: `Note deleted: ${note.title}`
      };
    } catch (error) {
      console.error('[NOTES-ERROR]:', error);
      throw new Error('Failed to delete note');
    }
  }

  /**
   * Toggle note completion (for todos)
   */
  async toggleComplete(noteId) {
    try {
      const note = await Note.findById(noteId);

      if (!note) {
        throw new Error('Note not found');
      }

      note.isCompleted = !note.isCompleted;
      await note.save();

      const status = note.isCompleted ? 'completed' : 'reopened';

      return {
        success: true,
        note: this.formatNote(note),
        voiceResponse: `Task ${status}: ${note.title}`
      };
    } catch (error) {
      console.error('[NOTES-ERROR]:', error);
      throw new Error('Failed to toggle note completion');
    }
  }

  /**
   * Search notes
   */
  async searchNotes(userId, query) {
    try {
      const notes = await Note.find({
        userId,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      })
      .sort({ updatedAt: -1 })
      .limit(20);

      return {
        notes: notes.map(n => this.formatNote(n)),
        count: notes.length,
        voiceResponse: `Found ${notes.length} notes matching "${query}"`
      };
    } catch (error) {
      console.error('[NOTES-ERROR]:', error);
      throw new Error('Failed to search notes');
    }
  }

  /**
   * Pin/Unpin a note
   */
  async togglePin(noteId) {
    try {
      const note = await Note.findById(noteId);

      if (!note) {
        throw new Error('Note not found');
      }

      note.isPinned = !note.isPinned;
      await note.save();

      const status = note.isPinned ? 'pinned' : 'unpinned';

      return {
        success: true,
        note: this.formatNote(note),
        voiceResponse: `Note ${status}: ${note.title}`
      };
    } catch (error) {
      console.error('[NOTES-ERROR]:', error);
      throw new Error('Failed to toggle pin');
    }
  }

  /**
   * Add tag to note
   */
  async addTag(noteId, tag) {
    try {
      const note = await Note.findByIdAndUpdate(
        noteId,
        { $addToSet: { tags: tag } },
        { new: true }
      );

      if (!note) {
        throw new Error('Note not found');
      }

      return {
        success: true,
        note: this.formatNote(note),
        voiceResponse: `Tag added: ${tag}`
      };
    } catch (error) {
      console.error('[NOTES-ERROR]:', error);
      throw new Error('Failed to add tag');
    }
  }

  /**
   * Format note for response
   */
  formatNote(note) {
    return {
      id: note._id,
      title: note.title,
      content: note.content,
      type: note.type,
      tags: note.tags,
      isCompleted: note.isCompleted,
      isPinned: note.isPinned,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };
  }
}

// Export singleton instance
const notesService = new NotesService();
export default notesService;
