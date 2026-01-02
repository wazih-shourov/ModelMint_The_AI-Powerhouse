# 🐍 ModelMint Python Server

## ⚠️ Note
This directory contains the **confidential backend server** for ModelMint.

The Python server code is **not included** in this public repository for security reasons.

## 🔧 What This Server Does

The Python server handles:
- **Model Conversion**: TensorFlow.js ↔ Keras (.h5) ↔ TFLite
- **Server-Side Training**: InceptionV3 and MobileNet training
- **API Key Management**: Secure API key generation and validation
- **Analytics**: Usage tracking and performance monitoring
- **Prediction API**: RESTful endpoints for model inference

## 📦 Requirements

```bash
pip install -r requirements.txt
```

## 🚀 Running the Server

```bash
cd python-server
python app.py
```

The server will start on `http://localhost:5000`

## 🔐 Environment Variables

Create a `.env` file in the `python-server` directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
PORT=5000
```

## 📚 API Endpoints

- `POST /convert` - Convert model formats
- `POST /api/train` - Server-side model training
- `POST /api/predict` - Model inference
- `GET /api/keys/list` - List API keys
- `POST /api/keys/generate` - Generate new API key
- `GET /api/dashboard/stats` - Get analytics data

## 🛡️ Security Note

This server contains proprietary business logic and is not open-sourced.

For collaboration or licensing inquiries, please contact the repository owner.

---

**© 2025 ModelMint - All Rights Reserved**
