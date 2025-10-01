import express from 'express';
import { Login, signUp, logOut } from '../controllers/auth.controllers.js';

const router = express.Router();

// Auth routes with proper error handling
router.post('/signin', async (req, res, next) => {
  try {
    await Login(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/signup', async (req, res, next) => {
  try {
    await signUp(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/logout', async (req, res, next) => {
  try {
    await logOut(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;