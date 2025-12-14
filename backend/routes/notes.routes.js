/**
 * Notes API Routes
 * Dedicated routes for note-taking functionality
 * [COPILOT-UPGRADE]: Complete API integration for notes
 */

import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import notesService from '../services/notesService.js';

const router = express.Router();

/**
 * @route   POST /api/notes/create
 * @desc    Create a new note
 * @access  Private
 */
router.post('/create', isAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { title, content, tags, category } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Note content is required'
      });
    }

    const result = await notesService.createNote(userId, {
      title,
      content,
      tags,
      category
    });

    res.status(201).json({
      success: true,
      note: result.note,
      message: result.voiceResponse
    });
  } catch (error) {
    console.error('[NOTES-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/notes/list
 * @desc    Get all user notes
 * @access  Private
 */
router.get('/list', isAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { category, search } = req.query;

    const result = await notesService.getUserNotes(userId, {
      category,
      search
    });

    res.status(200).json({
      success: true,
      notes: result.notes,
      count: result.count
    });
  } catch (error) {
    console.error('[NOTES-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/notes/:id
 * @desc    Get a specific note
 * @access  Private
 */
router.get('/:id', isAuth, async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await notesService.getNoteById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      note
    });
  } catch (error) {
    console.error('[NOTES-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/notes/:id
 * @desc    Update a note
 * @access  Private
 */
router.put('/:id', isAuth, async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content, tags, category } = req.body;

    const result = await notesService.updateNote(noteId, {
      title,
      content,
      tags,
      category
    });

    res.status(200).json({
      success: true,
      note: result.note,
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('[NOTES-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note
 * @access  Private
 */
router.delete('/:id', isAuth, async (req, res) => {
  try {
    const noteId = req.params.id;

    const result = await notesService.deleteNote(noteId);

    res.status(200).json({
      success: true,
      message: result.voiceResponse
    });
  } catch (error) {
    console.error('[NOTES-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notes/search
 * @desc    Search notes by content or tags
 * @access  Private
 */
router.post('/search', isAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const result = await notesService.searchNotes(userId, query);

    res.status(200).json({
      success: true,
      notes: result.notes,
      count: result.count
    });
  } catch (error) {
    console.error('[NOTES-API-ERROR]:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
