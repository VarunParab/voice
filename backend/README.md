
<<<<<<< Updated upstream
=======
This is the backend API for the Voice Bot application, deployed on Vercel.

## Features

- Chat endpoint for AI conversations using Groq API
- Audio transcription endpoint using Whisper model
- CORS enabled for frontend integration

## Deployment on Vercel

### Prerequisites

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Make sure you have a Vercel account

### Deployment Steps

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the prompts to:
   - Link to your Vercel account
   - Set up the project
   - Configure environment variables

### Environment Variables

Set the following environment variables in your Vercel project:

- `GROQ_API_KEY`: Your Groq API key

You can set these in the Vercel dashboard under Project Settings > Environment Variables.

### API Endpoints

- `GET /`: Health check endpoint
- `POST /chat`: Chat with AI assistant
- `POST /transcribe`: Transcribe audio files
- `GET /search?q=QUERY`: Web search using DuckDuckGo (returns top 3 results)
- `GET /calculate?expr=EXPRESSION`: Calculator for math expressions
- `GET /weather?location=CITY`: Get current weather for a city
- `GET /wikipedia?query=TOPIC`: Get Wikipedia summary for a topic

#### Example Usage

- `/search?q=latest+AI+news`
- `/calculate?expr=2*3+sqrt(16)`
- `/weather?location=San+Francisco`
- `/wikipedia?query=OpenAI`

## Local Development

To run locally:

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   export GROQ_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000` 
>>>>>>> Stashed changes
