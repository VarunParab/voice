# Voice Bot

Voice Bot using Meta Llama3 model and OpenAI Whisper model.
React for Frontend and FastAPI for Backend

## Deployment

This project is configured for deployment on Vercel:

- **Frontend**: React app deployed on Vercel
- **Backend**: FastAPI app deployed on Vercel

## Project Structure

```
voice/
├── frontend/          # React frontend application
├── backend/           # FastAPI backend application
├── requirements.txt   # Python dependencies
└── README.md         # This file
```

## Setup Instructions

### Backend Deployment (Vercel)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `GROQ_API_KEY`: Your Groq API key

### Frontend Deployment (Vercel)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `REACT_APP_API_URL`: Your backend API URL (e.g., https://your-backend.vercel.app)

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
export GROQ_API_KEY=your_api_key_here
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Features

- Voice-to-text transcription using Whisper
- AI chat using Llama3 model via Groq API
- Text-to-speech functionality
- Modern React UI with Material-UI
- Real-time audio recording and processing
