# 🤖 AI-Powered Virtual Assistant

An advanced, voice-enabled virtual assistant built with a modern tech stack, featuring a React frontend, a Node.js backend, and integration with the Gemini API for intelligent, human-like interactions.

![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![Cloudinary](https://img.shields.io/badge/Cloud-Cloudinary-lightblue?logo=cloudinary)
![Gemini](https://img.shields.io/badge/AI-Gemini-purple)
![Socket.io](https://img.shields.io/badge/Real--Time-Socket.io-yellow)
![Vite](https://img.shields.io/badge/Build-Vite-purple?logo=vite)

---

## ✨ Core Features

This virtual assistant is designed to be a comprehensive, interactive, and extensible platform.

- **🗣️ Natural Voice Interaction**: Utilizes the Web Speech API for voice recognition and synthesis, allowing for hands-free control.
- **🧠 AI-Powered Commands**: Leverages the Google Gemini API to understand and process a wide range of commands, from simple queries to complex actions.
- **🌐 Multi-Language Support**: Built-in support for English, Hindi, and Marathi using `i18next`.
- **📱 Cross-Platform Control**: Capable of controlling various devices and applications.
- **🔒 Secure by Design**: Implements JWT for authentication, secure cookie management, and robust security practices.
- **⚡ Real-Time Communication**: Uses Socket.io for instant, bidirectional communication between the frontend and backend.
- **🎨 Modern UI**: A sleek and responsive user interface built with React and Tailwind CSS.
- **🚀 High-Performance Backend**: An Express.js server with features like rate-limiting, caching (Redis and in-memory), and structured logging.

---

## 🛠️ Tech Stack

| Category      | Technology                                      |
|---------------|-------------------------------------------------|
| **Frontend**  | React, Vite, Tailwind CSS, Framer Motion        |
| **Backend**   | Node.js, Express.js                             |
| **Database**  | MongoDB                                         |
| **AI**        | Google Gemini API                               |
| **Real-Time** | Socket.io                                       |
| **Auth**      | JWT (JSON Web Tokens), bcryptjs                 |
| **Media**     | Cloudinary                                      |
| **Testing**   | Jest (Backend), Vitest (Frontend), Supertest    |
| **DevOps**    | ESLint, Prettier, Nodemon                       |

---

## 🎤 Supported Commands

The assistant can handle a wide variety of voice commands, including but not limited to:

- **General Conversation**: "Tell me a joke", "Who are you?"
- **Knowledge & Search**: "Who is Nikola Tesla?", "Search for AI advancements on Google."
- **Device & App Control**: "Open YouTube", "Open Calculator", "Turn on the TV."
- **Productivity**: "Set a reminder for 5 PM", "What's on my calendar?", "Take a note."
- **Communication**: "Send a WhatsApp message to Mom", "Call John."
- **Media**: "Play some relaxing music", "Find videos of cats on YouTube."
- **Utilities**: "What time is it?", "What's the weather in London?"

For a full list of commands, please see the `VOICE-COMMANDS.md` file.

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- Node.js (v16 or higher)
- npm
- MongoDB (local or cloud instance)
- Redis (optional, for caching)

### 1. Clone the Repository

```bash
git clone https://github.com/HarshJadhav81/AI-Powered-Virtual-Assistant.git
cd AI-Powered-Virtual-Assistant
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create a .env file from the example
cp .env.example .env
```

Now, open `backend/.env` and fill in your credentials:
```env
# Server
PORT=8000

# Database
MONGODB_URL=your_mongodb_connection_string

# Security
JWT_SECRET=your_strong_jwt_secret_key
CORS_ORIGIN=http://localhost:5173

# APIs & Services
GEMINI_API_KEY=your_google_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Redis (Optional)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Running the Application

You'll need two separate terminals to run the backend and frontend servers.

**Terminal 1: Start the Backend**
```bash
cd backend
npm run dev
```
The backend server will start on `http://localhost:8000`.

**Terminal 2: Start the Frontend**
```bash
cd frontend
npm run dev
```
The frontend development server will be available at `http://localhost:5173`.

---

## 🧪 Testing

The project is configured with a full suite of tests for both the backend and frontend.

### Backend Testing (Jest)

From the `backend` directory:
```bash
# Run all tests with coverage report
npm test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Frontend Testing (Vitest)

From the `frontend` directory:
```bash
# Run all tests
npm test

# Run tests with a UI
npm run test:ui
```

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve the code, please feel free to:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the ISC License. See the `LICENSE` file for details.