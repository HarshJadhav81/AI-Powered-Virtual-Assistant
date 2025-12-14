import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    assistantName: {
        type: String
    },
    assistantImage: {
        type: String
    },
    voicePreferences: {
        provider: {
            type: String,
            default: 'elevenlabs',
            enum: ['elevenlabs', 'web-speech']
        },
        voiceId: {
            type: String,
            default: 'TxGEqnHWrfWFTfGW9XjX' // Josh (male default)
        },
        voiceGender: {
            type: String,
            default: 'male',
            enum: ['male', 'female']
        },
        voiceName: {
            type: String,
            default: 'Josh'
        },
        voiceStyle: {
            type: String,
            default: 'default'
        },
        settings: {
            stability: {
                type: Number,
                default: 0.5,
                min: 0,
                max: 1
            },
            similarityBoost: {
                type: Number,
                default: 0.75,
                min: 0,
                max: 1
            },
            style: {
                type: Number,
                default: 0,
                min: 0,
                max: 1
            }
        }
    },
    history: [
        { type: String }
    ]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;