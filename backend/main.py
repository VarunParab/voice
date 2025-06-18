from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv
import logging
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set")

client = Groq(api_key=api_key)

class ChatMessage(BaseModel):
    message: str

@app.get("/")
async def root():
    return {"message": "Voice Bot API is running"}

@app.post("/chat")
async def chat(message: ChatMessage):
    try:
        logger.info(f"Received chat request with message: {message.message}")
        
        # Call Groq API
        completion = client.chat.completions.create(
            model="llama3-8b-8192",  # Updated to use Mixtral model
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": message.message}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        
        response = completion.choices[0].message.content
        logger.info(f"Successfully generated response: {response[:100]}...")
        return {"response": response}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your request: {str(e)}"
        )

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        logger.info(f"Received audio file: {file.filename}")
        
        # Create a temporary file to store the uploaded audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".m4a") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            
            # Transcribe the audio using Groq
            with open(temp_file.name, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=(temp_file.name, audio_file.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                    language="en"  # Specify English as the target language
                )
            
            # Clean up the temporary file
            os.unlink(temp_file.name)
            
            logger.info(f"Successfully transcribed audio: {transcription.text[:100]}...")
            return {"transcription": transcription.text}
            
    except Exception as e:
        logger.error(f"Error in transcribe endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your audio: {str(e)}"
        ) 