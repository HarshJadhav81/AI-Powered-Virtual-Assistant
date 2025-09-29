import express from "express"
import { askToAssistant, getCurrentUser, updateAssistant } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"

const userRouter=express.Router()

// Wrap route handlers with error catching
userRouter.get("/current", isAuth, async (req, res, next) => {
  try {
    await getCurrentUser(req, res);
  } catch (error) {
    next(error);
  }
});

userRouter.post("/update", isAuth, upload.single("assistantImage"), async (req, res, next) => {
  try {
    await updateAssistant(req, res);
  } catch (error) {
    next(error);
  }
});

userRouter.post("/asktoassistant", isAuth, async (req, res, next) => {
  try {
    await askToAssistant(req, res);
  } catch (error) {
    next(error);
  }
});

export default userRouter