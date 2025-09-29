import express from "express"
import { Login, logOut, signUp } from "../controllers/auth.controllers.js"

const authRouter=express.Router()

// Wrap route handlers with error catching
authRouter.post("/signup", async (req, res, next) => {
  try {
    await signUp(req, res);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/signin", async (req, res, next) => {
  try {
    await Login(req, res);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/logout", async (req, res, next) => {
  try {
    await logOut(req, res);
  } catch (error) {
    next(error);
  }
});
export default authRouter