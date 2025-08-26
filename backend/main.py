from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv
import logging
import tempfile
import requests

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

# --- Web Search Agent (DuckDuckGo) ---
@app.get("/search")
async def web_search(q: str):
    try:
        # Clean up the query - remove common search prefixes
        cleaned_query = q.lower()
        
        # Remove common search prefixes
        search_prefixes = [
            'search for', 'search', 'find', 'find information about', 'find info about',
            'look up', 'look for', 'get information about', 'get info about',
            'tell me about', 'what is', 'what are', 'who is', 'who are',
            'latest news about', 'news about', 'information about'
        ]
        
        for prefix in search_prefixes:
            if cleaned_query.startswith(prefix):
                cleaned_query = cleaned_query[len(prefix):].strip()
                break
        
        # Use cleaned query if it's different, otherwise use original
        search_term = cleaned_query if cleaned_query != q.lower() else q
        
        url = f"https://duckduckgo.com/html/?q={requests.utils.quote(search_term)}"
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            raise Exception("DuckDuckGo search failed")
        # Simple HTML parsing for results
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")
        results = []
        for a in soup.select('.result__a')[:3]:
            results.append({"title": a.get_text(), "href": a['href']})
        return {"results": results}
    except Exception as e:
        logger.error(f"Web search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Calculator Agent ---
@app.get("/calculate")
async def calculate(expr: str):
    try:
        import sympy
        import re
        
        # Clean up the expression - extract math from natural language
        cleaned_expr = expr.lower()
        
        # Remove common calculation prefixes
        calc_prefixes = [
            'calculate', 'compute', 'what is', 'what equals', 'what does',
            'solve', 'evaluate', 'find the result of', 'work out',
            'add', 'subtract', 'multiply', 'divide', 'times', 'plus', 'minus'
        ]
        
        for prefix in calc_prefixes:
            if cleaned_expr.startswith(prefix):
                cleaned_expr = cleaned_expr[len(prefix):].strip()
                break
        
        # Replace common words with math symbols
        word_to_symbol = {
            'plus': '+',
            'minus': '-',
            'times': '*',
            'multiplied by': '*',
            'divided by': '/',
            'equals': '=',
            'squared': '**2',
            'cubed': '**3',
            'square root': 'sqrt',
            'root': 'sqrt',
            'power': '**',
            'to the power of': '**'
        }
        
        for word, symbol in word_to_symbol.items():
            cleaned_expr = cleaned_expr.replace(word, symbol)
        
        # Try multiple expressions
        expressions_to_try = [
            cleaned_expr,  # Try the cleaned expression first
            expr,  # Try the original expression
            cleaned_expr.replace(' ', ''),  # Try without spaces
        ]
        
        for expression in expressions_to_try:
            try:
                # Clean up the expression for sympy
                # Remove any non-math characters except basic operators
                clean_math = re.sub(r'[^0-9+\-*/().,sqrt\s]', '', expression)
                if clean_math.strip():
                    result = sympy.sympify(clean_math).evalf()
                    return {"result": str(result)}
            except Exception as e:
                logger.info(f"Calculator failed for '{expression}': {e}")
                continue
        
        raise Exception("Invalid mathematical expression")
    except Exception as e:
        logger.error(f"Calculator error: {e}")
        raise HTTPException(status_code=400, detail="Invalid expression")

# --- Wikipedia Agent ---
@app.get("/wikipedia")
async def wikipedia_summary(query: str):
    try:
        # Clean up the query - remove common question words and extract the main topic
        import re
        cleaned_query = query.lower()
        
        # Remove common question prefixes
        question_prefixes = [
            'what is', 'what are', 'what was', 'what were',
            'who is', 'who are', 'who was', 'who were',
            'when is', 'when was', 'when did',
            'where is', 'where are', 'where was',
            'why is', 'why are', 'why was',
            'how is', 'how are', 'how was', 'how did',
            'tell me about', 'explain', 'describe', 'define'
        ]
        
        for prefix in question_prefixes:
            if cleaned_query.startswith(prefix):
                cleaned_query = cleaned_query[len(prefix):].strip()
                break
        
        # Try multiple search strategies
        search_queries = [
            cleaned_query,  # Try the cleaned query first
            query,  # Try the original query
            cleaned_query.replace(' ', '_'),  # Try with underscores
            cleaned_query.title(),  # Try with title case
        ]
        
        for search_query in search_queries:
            try:
                # Wikipedia REST API endpoint
                url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(search_query)}"
                resp = requests.get(url, headers={"User-Agent": "VoiceBot/1.0"})
                
                if resp.status_code == 200:
                    data = resp.json()
                    title = data.get("title", "")
                    summary = data.get("extract", "No summary available.")
                    return {"title": title, "summary": summary[:1000]}
                    
            except Exception as e:
                logger.info(f"Wikipedia search failed for '{search_query}': {e}")
                continue
        
        # If all direct searches fail, try a search API
        try:
            search_url = f"https://en.wikipedia.org/api/rest_v1/page/search/{requests.utils.quote(cleaned_query)}"
            search_resp = requests.get(search_url, headers={"User-Agent": "VoiceBot/1.0"})
            
            if search_resp.status_code == 200:
                search_data = search_resp.json()
                if search_data.get("pages") and len(search_data["pages"]) > 0:
                    # Get the first (most relevant) result
                    first_page = search_data["pages"][0]
                    page_title = first_page.get("title", "")
                    
                    # Now get the summary for this specific page
                    summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(page_title)}"
                    summary_resp = requests.get(summary_url, headers={"User-Agent": "VoiceBot/1.0"})
                    
                    if summary_resp.status_code == 200:
                        summary_data = summary_resp.json()
                        title = summary_data.get("title", "")
                        summary = summary_data.get("extract", "No summary available.")
                        return {"title": title, "summary": summary[:1000]}
                        
        except Exception as e:
            logger.info(f"Wikipedia search API failed: {e}")
        
        raise Exception(f"Wikipedia page not found for '{query}'")
        
    except Exception as e:
        logger.error(f"Wikipedia error: {e}")
        raise HTTPException(status_code=404, detail=str(e)) 