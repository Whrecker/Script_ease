
import os
import json
import requests
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from pydub import AudioSegment
from dotenv import load_dotenv
import re

# --- 1. Initialize Flask App and Configuration ---

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Define uploads folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- 2. Configure ElevenLabs API ---

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    raise ValueError("ELEVENLABS_API_KEY environment variable not set.")

# Medicine database - common medications with possible misspellings
MEDICINE_DATABASE = {
    "paracetamol": ["paracetamol", "acetaminophen", "panadol", "calpol", "paracitamol", "paracetemol"],
    "ibuprofen": ["ibuprofen", "advil", "motrin", "brufen", "ibuprufen", "ibupofen"],
    "amoxicillin": ["amoxicillin", "amoxycillin", "amoxil", "trimox", "amoxicyllin", "amoxicilin"],
    "atorvastatin": ["atorvastatin", "lipitor", "atorva", "atorvastin", "atorvastatine"],
    "metformin": ["metformin", "glucophage", "metformine", "metformina", "metformiin"],
    "omeprazole": ["omeprazole", "prilosec", "omeprazol", "omeprazole", "omeprazol"],
    "aspirin": ["aspirin", "asa", "acetylsalicylic acid", "asprin", "asperin"],
    "lisinopril": ["lisinopril", "prinivil", "zestril", "lisinopril", "lysinopril"],
    "simvastatin": ["simvastatin", "zocor", "simva", "simvastin", "simvastatine"],
    "metoprolol": ["metoprolol", "lopressor", "toprol", "metoprolol", "metoprolole"],
    "amlodipine": ["amlodipine", "norvasc", "amlodipin", "amlodipin", "amlodipinee"],
    "hydrochlorothiazide": ["hydrochlorothiazide", "hctz", "hydrochlorothiazid", "hydrochlorothiazed"],
    "atenolol": ["atenolol", "tenormin", "atenolol", "atnolol", "atenlol"],
    "losartan": ["losartan", "cozaar", "losartan", "losartin", "losartane"],
    "albuterol": ["albuterol", "salbutamol", "ventolin", "albuterol", "albuterole"],
    "gabapentin": ["gabapentin", "neurontin", "gabapentin", "gabapentine", "gabapentine"],
    "prednisone": ["prednisone", "deltasone", "prednison", "prednisolone", "prednizon"],
    "ciprofloxacin": ["ciprofloxacin", "cipro", "ciprofloxacin", "ciprofloxacine", "cyprofloxacin"],
    "doxycycline": ["doxycycline", "vibramycin", "doxycyclin", "doxycyclin", "doxycyclene"],
    "levothyroxine": ["levothyroxine", "synthroid", "levothyroxin", "levothyroxin", "levothyroxene"],
    "crocin": ["crocin", "crocine", "krosin", "crocin", "crosin"],
    "dolo": ["dolo", "doloo", "dollo", "dolo", "doloe"],
    "volini": ["volini", "voline", "volini", "volinee", "voliny"],
    "chloroquine": ["chloroquine", "chloroquin", "cloroquine", "kloroquine", "chlorokine"]
}

# Create a flat list of all medicine names for matching
ALL_MEDICINE_NAMES = []
for correct_name, variations in MEDICINE_DATABASE.items():
    ALL_MEDICINE_NAMES.extend(variations)
ALL_MEDICINE_NAMES = list(set(ALL_MEDICINE_NAMES))  # Remove duplicates

@app.after_request
def add_security_headers(response):
    response.headers['Content-Security-Policy'] = "default-src 'self'; img-src 'self' data:;"
    return response

# --- 3. Helper Functions (Transcription, Translation, Medicine Correction, and Parsing) ---

def transcribe_with_elevenlabs(audio_path: str) -> str:
    """Transcribes a given audio file to text using the ElevenLabs STT API."""
    try:
        url = "https://api.elevenlabs.io/v1/speech-to-text"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        with open(audio_path, 'rb') as audio_file:
            files = {
                'file': (os.path.basename(audio_path), audio_file, 'audio/mpeg')
            }
            data = {
                "model_id": "scribe_v1"
            }
            
            print("Sending audio to ElevenLabs for transcription...")
            response = requests.post(url, headers=headers, files=files, data=data)
            response.raise_for_status()

            result = response.json()
            return result.get("text", "")

    except Exception as e:
        error_message = f"Error during ElevenLabs transcription: {e}"
        print(error_message)
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"API Response: {response.text}")
        return error_message

def detect_language_advanced(text: str) -> str:
    """
    Advanced language detection that handles both pure Hindi and Hindi transliteration
    """
    # Check for Devanagari script (pure Hindi)
    devanagari_pattern = re.compile(r'[\u0900-\u097F]+')
    devanagari_chars = devanagari_pattern.findall(text)
    devanagari_ratio = len(''.join(devanagari_chars)) / len(text) if text else 0
    
    # Check for common Hindi words even in transliterated text
    hindi_transliteration_keywords = [
        'namaste', 'hai', 'ki', 'ka', 'ke', 'ko', 'se', 'mein', 'par', 'aur', 
        'lekin', 'kyon', 'kya', 'kab', 'kahaan', 'kaise', 'kitna', 'kaun'
    ]
    
    # Convert text to lowercase for keyword matching
    text_lower = text.lower()
    hindi_keyword_count = sum(1 for word in hindi_transliteration_keywords if word in text_lower)
    
    print(f"Devanagari ratio: {devanagari_ratio}, Hindi keyword count: {hindi_keyword_count}")
    
    # If there's significant Devanagari script or Hindi keywords, it's Hindi
    if devanagari_ratio > 0.3 or hindi_keyword_count > 2:
        return 'hi'
    else:
        return 'en'

def detect_and_translate(text: str) -> str:
    """
    Detects the language of the text and translates it to English if needed.
    """
    detected_lang = detect_language_advanced(text)
    print(f"Detected language: {detected_lang}")
    
    if detected_lang == 'en':
        print("Text is in English, no translation needed.")
        return text
    else:
        print("Text appears to be in Hindi, attempting translation...")
        return translate_hindi_text(text)

def translate_hindi_text(text: str) -> str:
    """
    Translates Hindi text to English using multiple fallback methods
    """
    # Method 1: Try LibreTranslate
    translated = translate_with_libretranslate(text)
    if translated != text:
        return translated
    
    # Method 2: Try Google Translate API (free)
    translated = translate_with_google_translate(text)
    if translated != text:
        return translated
    
    # Method 3: Use simple keyword replacement as final fallback
    return simple_hindi_to_english_translation(text)

def translate_with_libretranslate(text: str) -> str:
    """
    Translates text using LibreTranslate API
    """
    try:
        response = requests.post(
            "https://libretranslate.de/translate",
            data={
                "q": text,
                "source": "auto",
                "target": "en",
                "format": "text"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            translated = result.get("translatedText", text)
            if translated != text:
                print(f"LibreTranslate successful: {translated}")
            return translated
        else:
            print(f"LibreTranslate failed with status {response.status_code}")
            return text
            
    except Exception as e:
        print(f"LibreTranslate error: {e}")
        return text

def translate_with_google_translate(text: str) -> str:
    """
    Translates text using Google Translate API (free method)
    """
    try:
        # Using a simple Google Translate API endpoint
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            'client': 'gtx',
            'sl': 'auto',
            'tl': 'en',
            'dt': 't',
            'q': text
        }
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            result = response.json()
            # The translated text is the first element of the first element
            translated = result[0][0][0]
            if translated != text:
                print(f"Google Translate successful: {translated}")
            return translated
        else:
            print(f"Google Translate failed with status {response.status_code}")
            return text
            
    except Exception as e:
        print(f"Google Translate error: {e}")
        return text

def simple_hindi_to_english_translation(text: str) -> str:
    """
    Simple keyword-based translation for common Hindi medical terms
    """
    # Enhanced mapping for both pure Hindi and transliterated Hindi
    hindi_english_map = {
        # Pure Hindi words
        'नमस्ते': 'Hello', 'है': 'is', 'की': 'of', 'से': 'from', 'को': 'to',
        'पर': 'on', 'और': 'and', 'लेकिन': 'but', 'क्या': 'what', 'क्यों': 'why',
        'कब': 'when', 'कहाँ': 'where', 'दवा': 'medicine', 'दवाई': 'medicine',
        'गोली': 'tablet', 'टैबलेट': 'tablet', 'सिरप': 'syrup', 'इंजेक्शन': 'injection',
        'दिन': 'day', 'रात': 'night', 'सुबह': 'morning', 'शाम': 'evening',
        
        # Transliterated Hindi words
        'namaste': 'Hello', 'hai': 'is', 'ki': 'of', 'se': 'from', 'ko': 'to',
        'par': 'on', 'aur': 'and', 'lekin': 'but', 'kya': 'what', 'kyon': 'why',
        'kab': 'when', 'kahaan': 'where', 'dava': 'medicine', 'dawai': 'medicine',
        'goli': 'tablet', 'syrup': 'syrup', 'injection': 'injection',
        'din': 'day', 'raat': 'night', 'subah': 'morning', 'shaam': 'evening',
        
        # Medicine names in Hindi/transliteration
        'पैरासिटामोल': 'paracetamol', 'पैरासीटामोल': 'paracetamol',
        'आइबुप्रोफेन': 'ibuprofen', 'इबुप्रोफेन': 'ibuprofen',
        'एमोक्सिसिलिन': 'amoxicillin', 'अमोक्सिसिलिन': 'amoxicillin',
        'क्लोरोक्विन': 'chloroquine', 'क्लोरोक्वीन': 'chloroquine',
        'chloroquine': 'chloroquine', 'chloroquin': 'chloroquine',
        
        # Dosage terms
        'एमजी': 'mg', 'एमएल': 'ml', 'मिलीग्राम': 'mg', 'मिलीलीटर': 'ml',
        'mg': 'mg', 'ml': 'ml', 'ग्राम': 'gram', 'मिली': 'milli'
    }
    
    translated_text = text
    for hindi, english in hindi_english_map.items():
        translated_text = re.sub(r'\b' + re.escape(hindi) + r'\b', english, translated_text, flags=re.IGNORECASE)
    
    if translated_text != text:
        print(f"Simple translation applied: {translated_text}")
    
    return translated_text

def correct_medicine_names(text: str) -> str:
    """
    Attempts to correct medicine names in the text using fuzzy matching
    """
    try:
        from rapidfuzz import process, fuzz
        
        words = text.split()
        corrected_words = []
        
        for word in words:
            # Clean the word (remove punctuation, convert to lowercase)
            clean_word = word.lower().strip('.,!?;:()[]{}"\'')
            
            # Skip short words that are unlikely to be medicine names
            if len(clean_word) < 3:
                corrected_words.append(word)
                continue
                
            # Check if word resembles a medicine name using rapidfuzz
            result = process.extractOne(clean_word, ALL_MEDICINE_NAMES, scorer=fuzz.WRatio)
            
            if result:
                # result is a tuple (best_match, score, index)
                best_match, score, index = result
                
                # If we have a good match, replace the word
                if score > 75:
                    # Find the correct canonical name for this medicine
                    for canonical_name, variations in MEDICINE_DATABASE.items():
                        if best_match in variations:
                            corrected_words.append(canonical_name)
                            print(f"Corrected '{clean_word}' to '{canonical_name}' (score: {score})")
                            break
                    else:
                        corrected_words.append(word)
                else:
                    corrected_words.append(word)
            else:
                corrected_words.append(word)
        
        return " ".join(corrected_words)
    
    except ImportError:
        print("rapidfuzz not available, using simple string matching")
        return simple_medicine_correction(text)
    except Exception as e:
        print(f"Error in medicine correction: {e}, using simple matching")
        return simple_medicine_correction(text)

def simple_medicine_correction(text: str) -> str:
    """
    Simple medicine name correction without fuzzy matching
    """
    words = text.split()
    corrected_words = []
    
    for word in words:
        clean_word = word.lower().strip('.,!?;:()[]{}"\'')
        
        # Skip short words
        if len(clean_word) < 3:
            corrected_words.append(word)
            continue
        
        # Check if the word directly matches any medicine variation
        matched = False
        for canonical_name, variations in MEDICINE_DATABASE.items():
            for variation in variations:
                # Simple contains matching
                if variation == clean_word or clean_word in variation or variation in clean_word:
                    corrected_words.append(canonical_name)
                    print(f"Corrected '{clean_word}' to '{canonical_name}'")
                    matched = True
                    break
            if matched:
                break
        
        if not matched:
            corrected_words.append(word)
    
    return " ".join(corrected_words)

def parse_with_ollama(conversation: str) -> dict:
    """Sends the transcript to a local Ollama instance for structured data extraction."""
    api_url = "http://localhost:11434/api/generate"
    headers = {"Content-Type": "application/json"}
    prompt = (
        "You are a medical-document assistant. Given a transcript, extract three arrays: "
        "medicines (each as an object with 'name', 'dosage', and 'frequency'), "
        "treatments (what procedures were done), and "
        "precautions (any next-step or care advice). Examples of medicine name are Amoxicillin, Crocin, etc. "
        "Examples of dosage are 500mg, 1 tablet, 5ml, etc. "
        "Example of frequency are once a day, morning and in night, after lunch. "
        "Return strictly valid JSON with the exact structure:\n"
        "{\"medicines\": [{\"name\": \"...\", \"dosage\": \"...\", \"frequency\": \"...\"}], \"treatments\": [...], \"precautions\": [...]}\n\n"
        f"Transcript:\n\"\"\"\n{conversation}\n\"\"\"\n\n"
        "Return only the JSON object, nothing else."
    )
    
    try:
        resp = requests.post(api_url, headers=headers, json={
            "model": "gemma3:1b",
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.0}
        })
        resp.raise_for_status()
        
        raw_response = resp.json().get("response", "")
        print(f"Ollama Raw Response: {raw_response}")

        # Clean the response
        clean_response = raw_response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        clean_response = clean_response.strip()
        
        return json.loads(clean_response)
    except Exception as e:
        print(f"Error communicating with or parsing from Ollama: {e}")
        raise

# --- 4. Flask Endpoint ---

@app.route("/audio", methods=['POST'])
def audio_receive():
    start_time = time.time()
    
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file found in the request'}), 400
        
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    original_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(original_path)
    
    # Standardize audio to MP3 format for consistency
    base, _ = os.path.splitext(file.filename)
    mp3_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{base}.mp3")
    
    try:
        print(f"Converting {original_path} to MP3 format...")
        audio = AudioSegment.from_file(original_path)
        audio.export(mp3_path, format="mp3")
        
        # Step 1: Transcribe audio
        conversation_text = transcribe_with_elevenlabs(mp3_path)
        print(f"Original transcription: {conversation_text}")
        
        if conversation_text.startswith("Error"):
            raise RuntimeError(conversation_text)
            
        # Step 2: Detect language and translate to English if needed
        english_text = detect_and_translate(conversation_text)
        print(f"Text after translation: {english_text}")
        
        # Step 3: Correct medicine names using fuzzy matching
        corrected_text = correct_medicine_names(english_text)
        if corrected_text != english_text:
            print(f"Text after medicine correction: {corrected_text}")
            english_text = corrected_text
            
        # Step 4: Parse the translated and corrected text
        print("Parsing transcript with Ollama...")
        processed_data = parse_with_ollama(english_text)
        
    except Exception as e:
        print(f"Error in audio processing: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up the saved audio files
        for p in [original_path, mp3_path]:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except OSError:
                    pass  # File might already be deleted
                
    end_time = time.time()
    print(f"Total processing time: {end_time - start_time:.2f} seconds")
    
    return jsonify(processed_data)

# --- 5. Main ---

if __name__ == "__main__":
    app.run(debug=True, port=5000)