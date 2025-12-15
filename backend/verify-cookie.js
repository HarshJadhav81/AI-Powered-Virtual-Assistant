
import express from 'express';
import request from 'supertest';
import { signUp } from './controllers/auth.controllers.js';
import connectDb from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Mock User model to avoid DB dependency for this specific test if possible,
// but since we imported controllers that use the real model, we might need a dummy db connection 
// or just mock the Mongoose call. 
// For simplicity in this environment, let's just inspect the controller logic if we can,
// OR spin up a minimal app and see what headers it sets.

const app = express();
app.use(express.json());

// Set env to production for this test
process.env.NODE_ENV = 'production';

// Mock DB connection (we don't want to actually connect to production DB here if we can avoid it)
// But wait, the controller calls User.findOne. We need to mock that.
// Mock Mongoose manually without Jest
import mongoose from 'mongoose';
mongoose.connect = () => Promise.resolve();

// Mock User model methods manually
import User from './models/user.model.js';
User.findOne = () => Promise.resolve(null); // No existing user
User.create = () => Promise.resolve({ _id: 'dummy_id', name: 'Test', email: 'test@example.com' });

import genToken from './config/token.js';
// Mock genToken? No, let it run. It uses JWT.

app.post('/test/signup', signUp);

request(app)
    .post('/test/signup')
    .send({ name: 'Test', email: 'test@example.com', password: 'password123' })
    .expect(201)
    .end((err, res) => {
        if (err) {
            console.error('Test Failed:', err);
            console.log('Response Body:', res.body);
        } else {
            const cookies = res.headers['set-cookie'];
            console.log('Set-Cookie Headers:', cookies);

            const cookieStr = cookies[0];
            if (cookieStr.includes('SameSite=None') && cookieStr.includes('Secure')) {
                console.log('SUCCESS: Cookie has SameSite=None and Secure attributes.');
            } else {
                console.error('FAILURE: Cookie missing attributes. Got:', cookieStr);
                process.exit(1);
            }
        }
    });
