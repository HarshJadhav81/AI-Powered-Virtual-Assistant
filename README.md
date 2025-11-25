<<<<<<< Updated upstream
https://orvionn.vercel.app
# 🌐 AI-Powered-Virtual-Assistant
=======
# 🤖 AI-Powered Virtual Assistant - Orvion

**[COPILOT-UPGRADE]: Fully functional AI Virtual Assistant with voice commands, multi-language support, and smart device control**

## 🌟 Overview

An advanced, production-ready AI-powered virtual assistant capable of understanding natural voice commands and executing real actions across multiple devices and platforms.

### ✨ Key Features

- 🎤 **Natural Voice Commands** - Wake word detection ("Hey Rohini") with continuous listening
- 🌐 **Multi-language Support** - English, Hindi, Marathi with i18next integration
- 🤖 **AI-Powered Intelligence** - Google Gemini API for natural language understanding
- 📱 **Multi-Device Control** - Android TV, Chromecast, Projectors, Smart Devices
- 🔐 **Secure & Private** - JWT authentication, encrypted storage, permission management
- ⚡ **Real-time Communication** - Socket.io for instant bidirectional updates
- 🎨 **Beautiful UI** - React + Tailwind with smooth animations
- 🔊 **Natural Voice Response** - Human-like female voice synthesis
- 📝 **Smart Features** - Routines, learning memory, emotion modes

## 🏗️ Architecture

```
Frontend (React + Vite)
├── Voice Recognition (Web Speech API)
├── Socket.io Client
├── i18next (Multi-language)
└── Tailwind CSS UI

Backend (Node.js + Express)
├── AI Controller (Intent Parser)
├── Socket.io Server
├── Device Manager
├── Gemini API Integration
└── MongoDB (User Data & History)
```

## 📋 Prerequisites

- Node.js 16+ and npm
- MongoDB database
- Google Gemini API key
- Cloudinary account (for image uploads)

## 🚀 Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/HarshJadhav81/AI-Powered-Virtual-Assistant.git
cd AI-Powered-Virtual-Assistant
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment template
cp .env.template .env

# Edit .env and add your credentials:
# - MONGODB_URL
# - GEMINI_API_KEY
# - JWT_SECRET
# - CLOUDINARY credentials
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit: `http://localhost:5173`

## 🎯 Supported Commands

### 📱 App Control
- "Open Instagram"
- "Open YouTube"
- "Open Facebook"
- "Open Calculator"

### 🔍 Search & Browse
- "Search for [query] on Google"
- "Search [song name] on YouTube"
- "Show me the weather"
- "Read latest news"

### ⏰ Time & Date
- "What time is it?"
- "What's today's date?"
- "What day is it?"

### 📞 Communication (requires permissions)
- "Send message to [contact] on WhatsApp"
- "Call [contact]"
- "Send email to [email]"

### 🏠 Device Control
- "Turn on Android TV"
- "Play [video] on Chromecast"
- "Control projector"
- "Set volume to 50%"

### 🎵 Media
- "Play [song name]"
- "Play music"

### ⚙️ System
- "Take a screenshot"
- "Set alarm for [time]"
- "Remind me to [task]"
- "Increase brightness"

## 🌍 Multi-Language Support

Switch between languages dynamically:

```javascript
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();
i18n.changeLanguage('hi'); // Switch to Hindi
```

Supported languages:
- 🇬🇧 English (`en`)
- 🇮🇳 Hindi (`hi`)
- 🇮🇳 Marathi (`mr`)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/logout` - Logout

### User
- `GET /api/user/current` - Get current user
- `POST /api/user/asktoassistant` - Send command to assistant

### Gemini AI
- `POST /api/gemini` - Direct Gemini API call

### Socket.io Events
- `userCommand` - Send voice/text command
- `aiResponse` - Receive AI response
- `deviceControl` - Control smart devices
- `deviceResponse` - Device status update

## 🎨 Frontend Structure

```
frontend/src/
├── components/     # Reusable UI components
├── pages/         # Main app pages
├── context/       # React context providers
├── services/      # Business logic services
│   ├── voiceAssistant.js    # Voice recognition & synthesis
│   └── socketService.js      # Real-time communication
├── locales/       # Translation files
├── assets/        # Images, fonts, etc.
└── i18n.js        # Multi-language config
```

## 🔒 Security Features

- JWT-based authentication
- HTTP-only cookies
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS protection
- Encrypted sensitive data storage
- Permission-based access control

## 📱 Device Control

The assistant can control:
- **Android TV** (via DIAL protocol)
- **Chromecast** (via Cast SDK)
- **Projectors** (via PJLink)
- **Smart Lights** (via smart home APIs)
- **Smart Speakers**

### Connecting Devices

```javascript
import deviceManager from './services/deviceManager';

// Connect to Android TV
await deviceManager.connectToAndroidTV('192.168.1.100');

// Launch app
await deviceManager.openAppOnDevice(deviceId, 'youtube');
```

## 🧠 AI Controller

The AI Controller processes commands through structured intent parsing:

```javascript
// Backend: controllers/ai.controller.js
const result = await aiController.processCommand(
  command,    // User's voice/text input
  userId,     // User ID for personalization
  assistantName,  // Assistant's name
  userName    // User's name
);

// Returns structured response:
{
  type: 'youtube-search',
  userInput: 'play despacito',
  response: 'Playing Despacito on YouTube',
  action: 'open-url',
  url: 'https://youtube.com/...',
  metadata: { ... }
}
```

## 🎭 Smart Features

### 1. Wake Word Detection
```javascript
// Automatically detects:
- "Hey Rohini"
- "Hi Rohini"
- "Ok Rohini"
```

### 2. Smart Routines
Execute multiple commands in sequence:
"Open YouTube, play a song, and message my friend"

### 3. Learning Memory
Remembers frequently used apps and contacts for faster responses.

### 4. Emotion Voice Mode
Adjusts voice tone based on conversation context.

## 📊 Logging

All operations are logged for debugging:

```
[COPILOT-UPGRADE]: Server with Socket.io started on port 8000
[COPILOT-UPGRADE]: Client connected: abc123
[COPILOT-UPGRADE]: Command received: "open youtube"
[COPILOT-UPGRADE]: AI response sent to client
```

## 🚀 Deployment

### Backend (Render/Heroku)
```bash
# Set environment variables in hosting platform
# Deploy from main branch
git push origin main
```

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

## 🛠️ Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS connection (required for Web Speech API)
- Try Chrome/Edge (best compatibility)

### Socket.io Connection Failed
- Verify backend is running
- Check CORS settings
- Ensure firewall allows WebSocket connections

### Gemini API Errors
- Verify API key in .env
- Check API quota limits
- Ensure correct API URL

## 👨‍💻 Development

### Adding New Commands

1. **Update Gemini prompt** (`backend/gemini.js`)
2. **Add handler** in `ai.controller.js`
3. **Test with voice command**

### Adding New Language

1. Create `locales/{lang}.json`
2. Add to `i18n.js` resources
3. Update language map in voice assistant

## 📄 License

ISC

## 👤 Author

**Harshal Jadhav**
- GitHub: [@HarshJadhav81](https://github.com/HarshJadhav81)

## 🙏 Acknowledgments

- Google Gemini API
- Web Speech API
- Socket.io Team
- React & Tailwind communities

---

**[COPILOT-UPGRADE]: This project has been fully upgraded with production-ready features, security, and multi-device support.**
>>>>>>> Stashed changes
An AI-powered virtual voice assistant built with React, Node.js, and MongoDB. Features voice recognition, app control (YouTube, Calculator), real-time date &amp; time queries, animated avatar, and secure JWT authentication. Integrated with Gemini API and Cloudinary for intelligent, scalable interactions.
Great choice 🚀 Badges make your repo stand out and look professional at first glance.
Here’s your updated **README.md** with badges included at the top:

---


![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![Cloudinary](https://img.shields.io/badge/Cloud-Cloudinary-lightblue?logo=cloudinary)
![Gemini](https://img.shields.io/badge/AI-Gemini-purple)

An AI-powered **voice-enabled virtual assistant** built with **React (frontend)** and **Node.js (backend)**. It supports natural voice commands, opens apps, answers queries, and features an interactive animated avatar. Powered by the **Gemini API** with secure JWT authentication and cloud integration via **Cloudinary**.

---

## 🚀 Features

* 🎙️ **Voice Recognition** – Interact using natural voice commands.
* 📱 **App Control** – Open apps like YouTube, Calculator, etc.
* 📅 **Date & Time Queries** – Get real-time date, time, and day.
* 🧑‍💻 **Animated Avatar** – Engaging, responsive, and interactive UI.
* 🔐 **Authentication** – Secure login and access with JWT.
* ☁️ **Cloud Storage** – Media management via Cloudinary.
* 🤖 **AI Integration** – Intelligent responses using Gemini API.

---

## 🛠️ Tech Stack

* **Frontend:** React, TailwindCSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Auth:** JWT (JSON Web Tokens)
* **Cloud:** Cloudinary
* **AI:** Gemini API

---

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/virtual-assistant.git
   cd virtual-assistant
   ```

2. **Install dependencies**

   * For frontend

     ```bash
     cd frontend
     npm install
     ```
   * For backend

     ```bash
     cd backend
     npm install
     ```

3. **Set up environment variables**
   Create a `.env` file in the backend with:

   ```
   MONGO_URI=your_mongodb_connection
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   CLOUDINARY_URL=your_cloudinary_url
   ```

4. **Run the project**

   * Start backend

     ```bash
     npm run dev
     ```
   * Start frontend

     ```bash
     npm start
     ```

---

## 📌 Usage Examples

* **“Open YouTube”** → Launches YouTube.
* **“What’s the time?”** → Speaks the current time.
* **“Show today’s date”** → Displays today’s date.

---

## 🤝 Contributing

Contributions are welcome! Please fork this repo and submit a pull request.

---
