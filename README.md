# ScriptEase 🎙️

**AI-Powered Medical Conversation Transcription and Documentation**

ScriptEase is an application designed to convert audio recordings of medical conversations into structured, readable medical information. It combines a Python Flask backend with an Electron-based desktop frontend to simplify the process of extracting medication details, treatments, and precautions from spoken conversations.

The backend processes uploaded audio, transcribes speech using ElevenLabs, detects Hindi and English text, translates Hindi into English when needed, corrects common medication-name transcription errors, and uses a locally hosted language model through Ollama to generate structured JSON output.

## ✨ Features

- **Audio transcription:** Converts recorded medical conversations into text using the ElevenLabs Speech-to-Text API.
- **Audio format conversion:** Uses Pydub and FFmpeg to convert uploaded audio into MP3 format.
- **Hindi and English support:** Detects Hindi written in Devanagari script and common Hindi transliterations.
- **Automatic translation:** Attempts translation through LibreTranslate and Google Translate, with a keyword-based fallback.
- **Medicine name correction:** Uses RapidFuzz and a custom medicine dictionary to identify and correct common transcription errors.
- **Structured information extraction:** Uses the Gemma 3 1B model through Ollama to extract medication names, dosages, frequencies, treatments, and precautions.
- **REST API:** Exposes a Flask endpoint for communication between the Electron frontend and the backend.
- **Temporary file cleanup:** Removes uploaded audio and converted MP3 files after processing.
- **Desktop interface:** Uses Electron to provide a desktop application experience.

## 🏗️ Architecture

```text
┌─────────────────────────────┐
│     Electron Frontend       │
│  Desktop User Interface     │
└──────────────┬──────────────┘
               │ HTTP POST
               ▼
┌─────────────────────────────┐
│       Flask Backend         │
│       POST /audio           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Audio Preprocessing      │
│       Pydub + FFmpeg        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Speech-to-Text (STT)      │
│        ElevenLabs           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Language Detection and      │
│ Hindi-to-English Translation│
│ LibreTranslate / Google     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Medicine Name Correction  │
│      RapidFuzz + Dictionary │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Structured Data Extraction  │
│       Ollama + Gemma 3 1B   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      JSON API Response      │
│ Medicines, Treatments,      │
│ Precautions                 │
└─────────────────────────────┘
```

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Backend | Python, Flask |
| API communication | REST, Requests |
| Desktop frontend | Electron |
| Speech-to-text | ElevenLabs Scribe |
| Audio processing | Pydub, FFmpeg |
| Language detection | Regular expressions and keyword matching |
| Translation | LibreTranslate, Google Translate endpoint |
| Fuzzy matching | RapidFuzz |
| Local language model | Ollama, Gemma 3 1B |
| Environment configuration | python-dotenv |
| Cross-origin requests | Flask-CORS |

## 📂 Project Structure

The following is a suggested repository structure. Adjust the paths to match the actual files in your project.

```text
ScriptEase/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   └── uploads/
│
├── frontend/
│   ├── package.json
│   ├── main.js
│   ├── preload.js
│   └── src/
│
├── .gitignore
└── README.md
```

- `backend/app.py`: Flask application, audio processing pipeline, translation helpers, medication correction, and Ollama integration.
- `backend/requirements.txt`: Python dependencies.
- `backend/.env.example`: Example configuration for environment variables.
- `frontend/`: Electron application and user interface.
- `README.md`: Project overview, setup instructions, and API documentation.

## ⚙️ Prerequisites

Before running ScriptEase, install the following:

1. **Python 3.10 or later**
2. **Node.js and npm** for the Electron frontend
3. **FFmpeg** for audio format conversion
4. **Ollama** for local language-model inference
5. An **ElevenLabs API key** with access to speech-to-text

Install Ollama from [ollama.com](https://ollama.com/).

## 🚀 Installation and Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ScriptEase
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with your actual GitHub repository URL.

### 2. Set up the Python backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

**Windows**

```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/macOS**

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:

```bash
pip install Flask Flask-Cors requests pydub python-dotenv rapidfuzz
```

If you maintain a `requirements.txt` file, install from it instead:

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file inside the backend directory:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

Update the backend configuration to read the key from the environment:

```python
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

if not ELEVENLABS_API_KEY:
    raise ValueError("ELEVENLABS_API_KEY environment variable not set.")
```

**Important:** Never commit `.env` files or API credentials to GitHub.

### 4. Install FFmpeg

Install FFmpeg and ensure that its executable is available in your system's `PATH`.

Verify the installation:

```bash
ffmpeg -version
```

Pydub relies on FFmpeg for many audio format conversions.

### 5. Set up Ollama

Start Ollama and download the model used by the backend:

```bash
ollama pull gemma3:1b
```

Verify that the model is available:

```bash
ollama list
```

The backend sends requests to the local Ollama generation endpoint:

```text
http://localhost:11434/api/generate
```

Ensure Ollama is running before processing audio.

### 6. Run the backend

From the backend directory, run:

```bash
python app.py
```

The Flask server starts on:

```text
http://localhost:5000
```

The backend currently uses Flask's development server. For production deployment, use an appropriate production WSGI server and disable debug mode.

### 7. Set up the Electron frontend

Open a separate terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

Start the Electron application using the script configured in `package.json`. For example, if the project defines a `start` script:

```bash
npm start
```

Ensure the frontend sends audio requests to the running backend at `http://localhost:5000/audio`.

## 🔌 API Documentation

### `POST /audio`

Accepts an audio file, processes the recording, and returns structured medical information as JSON.

**Endpoint**

```text
POST http://localhost:5000/audio
```

**Request format:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `audio` | File | Audio recording to process |

The request must include the audio file under the field name `audio`.

**Example using cURL**

```bash
curl -X POST http://localhost:5000/audio \
  -F "audio=@consultation.mp3"
```

**Example successful response**

```json
{
  "medicines": [
    {
      "name": "paracetamol",
      "dosage": "500 mg",
      "frequency": "twice a day"
    }
  ],
  "treatments": [
    "Treatment details extracted from the conversation"
  ],
  "precautions": [
    "Precaution details extracted from the conversation"
  ]
}
```

The response above is illustrative. Actual results depend on the audio content and the language model's extraction.

**Error responses**

| HTTP status | Description |
|---|---|
| `400 Bad Request` | No audio file was supplied, or the filename is empty. |
| `500 Internal Server Error` | Audio conversion, transcription, translation, or data extraction failed. |
| `200 OK` | Processing succeeded and structured JSON was returned. |

## 🔄 Processing Pipeline

1. **Audio upload:** The frontend submits a recording to the Flask API.
2. **Audio conversion:** Pydub converts the recording into MP3 format using FFmpeg.
3. **Speech transcription:** ElevenLabs converts the audio into text.
4. **Language detection:** The backend checks for Hindi script and common Hindi transliteration patterns.
5. **Translation:** Hindi text is translated into English using available translation services and a keyword-based fallback.
6. **Medication correction:** RapidFuzz compares words against known medication names and their variations.
7. **Information extraction:** Ollama runs Gemma 3 1B to extract medication details, treatments, and precautions.
8. **Response generation:** The backend returns the extracted information as JSON.
9. **Cleanup:** Temporary audio files are deleted after processing.

## 🔐 Security and Privacy

ScriptEase handles audio that may contain sensitive medical information. Keep the following considerations in mind:

- Store API keys in environment variables, never in source code.
- Keep `.env`, virtual environments, and temporary uploads out of version control.
- Avoid logging raw medical transcripts or sensitive patient details.
- Use secure transport and appropriate access controls when deploying beyond localhost.
- Validate uploaded files, restrict file sizes, and sanitize filenames before saving them.
- Configure CORS to allow only trusted frontend origins in production.
- Disable Flask debug mode in production.
- Review the privacy policies and data handling practices of external transcription and translation services before processing sensitive information.
- Do not assume that deleting local temporary files removes copies processed by external services.

## ⚠️ Medical Disclaimer

ScriptEase is a prototype for assisting with transcription and medical documentation. It is **not a medical device, diagnostic system, or substitute for a qualified healthcare professional**.

Speech recognition, translation, fuzzy matching, and language-model extraction may introduce errors, particularly in medication names, dosages, frequencies, and clinical instructions.

All extracted information must be reviewed and verified by a qualified healthcare professional before it is used for clinical decisions or patient care. Never rely on automatically extracted information alone to prescribe, dispense, or administer medication.

## 🛣️ Future Improvements

- Support for additional Indian languages and multilingual medical conversations.
- Improved language detection and contextual translation.
- Context-aware medication name correction.
- Validation of extracted medication names and dosage formats.
- Confidence scores and review workflows for uncertain extractions.
- Better error handling, request timeouts, and structured logging.
- Secure user authentication and protected API endpoints.
- Automated tests for transcription, translation, and information extraction.
- Packaging and distribution of the Electron desktop application.
- Optional export of reviewed results into downloadable medical summaries.


---

**ScriptEase** — Turning spoken medical conversations into structured documentation.
