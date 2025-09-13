# LunarByte

<div align="center">
  <img src="lunarbyte_name.png" alt="LunarByte" width="400">
</div>

Real-time deepfake detection solution for web environments.

## What is LunarByte?

LunarByte analyzes video streams within web browsers to detect deepfake content in real-time. This project provides deepfake detection capabilities through a Chrome browser extension that connects to a FastAPI backend server running DFDC Challenge models.

The system combines a Chrome extension for video detection, a FastAPI server for model inference, and React frontend for management interface. Video processing happens server-side using PyTorch models, ensuring accurate detection while maintaining user privacy through local processing.

## Core Features

The system detects video elements on any website automatically and analyzes frames every 5 seconds using DFDC Challenge EfficientNet-B7 model. Results appear as browser overlay showing deepfake probability and confidence scores. The Chrome extension works across YouTube, Netflix, and all HTML5 video sites.

**Model accuracy depends on DFDC training data** - detection works best on face-swap deepfakes but may miss other manipulation types. Processing requires backend server connection for inference.

## Technical Implementation

The Chrome extension captures video frames using Canvas API and sends them to FastAPI backend via HTTP requests. Backend runs PyTorch DFDC model for inference and returns deepfake probability scores. Frontend React app provides optional management interface.

Architecture separates concerns cleanly - extension handles video detection and overlay display, backend processes model inference, frontend manages settings and statistics.

## Getting Started

### Backend Server Setup

```bash
cd Backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Model Weights Download

Download DFDC model weights manually from the [DFDC Challenge repository](https://github.com/selimsef/dfdc_deepfake_challenge). Place the `final_111_DeepFakeClassifier_tf_efficientnet_b7_ns_0_36` file in `Backend/weights/` directory.

### Chrome Extension Installation

Navigate to `chrome://extensions/`, enable developer mode, click "Load unpacked extension", and select the `Extension` folder.

### Frontend Setup (Optional)

```bash
cd Frontend
npm install
npm start
```

## Project Structure

```
LunarByte/
├── Backend/          # FastAPI server with DFDC model
├── Frontend/         # (deprecated) React management interface
├── Extension/        # Chrome extension files
└── dfdc_deepfake_challenge/  # DFDC model code
```

## API Endpoints

### POST `/analyze-frame`

Analyzes video frame for deepfake detection.

**Request:** `multipart/form-data` with `frame` image file
**Response:**

```json
{
  "status": "success",
  "is_deepfake": true,
  "confidence": 0.85,
  "deepfake_probability": 0.85
}
```

## Usage Flow

Start the backend server, install Chrome extension, visit video websites like YouTube or Netflix. Video playback triggers automatic frame analysis every 2 seconds. Results display in browser overlay on the right side of the page.

## Test Videos

To test the deepfake detection system:

### How to Test

1. Start the backend server and install the Chrome extension
2. Go to YouTube and play any video
3. The extension will automatically detect and analyze frames every 2 seconds
4. Check the overlay results:
   - **GREEN (LOW RISK)**: 0-40% deepfake probability - Likely authentic content
   - **ORANGE (MEDIUM RISK)**: 40-70% deepfake probability - Possible deepfake
   - **RED (HIGH RISK)**: 70-100% deepfake probability - Likely deepfake

### Test with Different Content Types

**Try testing with:**
- Regular YouTube videos (should show LOW RISK)
- News interviews and broadcasts
- Entertainment content
- Any suspicious content you want to verify

## Limitations

Model file size requires manual download due to 100MB size. GPU processing recommended for real-time performance. Detection accuracy varies by deepfake type and quality. Extension works only on HTTPS sites due to browser security policies.

**Detection results should supplement other verification methods** rather than serve as definitive proof of content authenticity.
