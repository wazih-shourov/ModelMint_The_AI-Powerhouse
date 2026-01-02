# 🧠 ModelMint – Next-Generation AI/ML Model Training Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.22.0-orange.svg)](https://www.tensorflow.org/js)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**ModelMint** is a comprehensive, end-to-end platform designed to democratize AI model creation. It bridges the gap between complex machine learning frameworks and accessible, user-friendly interfaces, allowing developers and creators to **Train, Deploy, and Scale** AI models directly from the browser.

> 🎯 **Live Demo**: [Coming Soon]  
> 📚 **Documentation**: [docs.modelmint.ai](https://docs.modelmint.ai)  
> 💬 **Discord Community**: [Join Us](https://discord.gg/modelmint)

---

## 🚀 Key Features Overview

*   **No-Code AI Studio**: Train complex neural networks (Image & Pose) directly in your browser.
*   **Instant Deployment**: One-click deployment of models to global edge networks.
*   **Visual Page Builder**: Create stunning, custom landing pages for your AI models.
*   **Developer API**: Full access to model predictions via a robust REST API with key management.
*   **Real-time Monitoring**: Live tracking of Training Loss, Accuracy, CPU & GPU usage.
*   **Cross-Platform Export**: Export to TensorFlow.js, Keras (.h5), and TFLite (Mobile) formats.
*   **Community Hub**: Share, discover, and fork models from the community.

---

## 🏗️ Platform Architecture & Modules

### 1. 🎨 The AI Studio (`/studio`)
The heart of ModelMint. The Studio is where raw data is transformed into intelligence.

*   **Data Management**: Drag-and-drop interface for uploading training data.
*   **Live Training Dashboard**:
    *   **Visual Graphs**: Real-time plotting of Accuracy vs. Epochs and Loss vs. Epochs.
    *   **Resource Monitoring**: Live server-side stats for **CPU Usage**, **RAM Usage**, and **GPU Load**.
    *   **Hyperparameter Tuning**: easy adjustment of Epochs, Batch Size, and Learning Rate.
*   **Model Selection**: Toggle between different base architectures (MobileNet, InceptionV3) seamlessly.

### 2. ⚡ Deployment Engine & Page Builder (`/deployments`)
Turn a trained model into a product in seconds.

*   **Instant Hosting**: Deploy your model to a public URL (e.g., `modelmint.ai/share/username/my-model`) with one click.
*   **Visual Page Builder**: A full WYSIWYG editor to customize your model's public face.
    *   **Custom Hero Sections**: Edit titles, subtitles, and calls to action.
    *   **Feature Blocks**: Add features, "How it Works" steps, and FAQ sections.
    *   **Live Preview**: See exactly what your users will see before publishing.
    *   **Interactive Demo**: The deployed page includes a working demo widget for visitors to try the model instantly.

### 3. 🔌 Developer API System (`/api-keys`)
Built for developers who want to integrate ModelMint models into their own apps.

*   **API Key Management**: Generate, name, and revoke secure API keys.
*   **Usage Analytics**: Track usage per key (Requests/Day, Error Rates, Latency).
*   **Standardized Endpoints**:
    *   `POST /api/predict`: Universal endpoint for model inference.
    *   `GET /api/keys/stats`: Programmatic access to usage data.
*   **Security**: Role-based access control and rate limiting.

### 4. 📦 Export & Interoperability (`/export`)
Your models are not locked in. ModelMint supports industry-standard formats.

*   **TensorFlow.js**: For running entirely in the browser (Client-side).
*   **Keras (.h5)**: The gold standard for Python/Server-side deployment.
*   **TFLite**: Optimized binary format for Android/iOS and IoT devices.
*   **Format Conversion**: Built-in server utilities to convert between these formats on the fly.

### 5. 🌏 Community & Collaboration (`/community`)
A social layer for AI collaboration.

*   **Model Gallery**: Browse top-rated models created by other users.
*   **Public Profiles**: Showcase your portfolio of trained models.
*   **Live Testing**: "Test Run" other users' models directly in the browser without downloading anything.

---

## 🤖 Supported Architectures (Deep Dive)

ModelMint currently supports three state-of-the-art Transfer Learning architectures, optimized for specific use cases:

### 1. MobileNetV2 (Image Classification)
*   **Best For**: Web apps, Real-time video, Mobile devices.
*   **Architecture**: Lightweight CNN with Depthwise Separable Convolutions.
*   **Input**: 224x224 RGB images.
*   **Performance**: Extremely fast inference with minimal latency.
*   **Use Cases**: Object detection, basic sorting, gesture recognition.

### 2. InceptionV3 (High-Fidelity Vision)
*   **Best For**: Medical imaging, complex textures, high-accuracy requirements.
*   **Architecture**: Deep network using "Inception Modules" (Factorized Convolutions) to capture multi-scale features.
*   **Input**: 299x299 RGB images (Automatic scaling handling).
*   **Performance**: Higher accuracy than MobileNet but requires more compute.
*   **Use Cases**: Skin disease detection, fine-grained product identification.

### 3. MoveNet (Pose Estimation)
*   **Best For**: Fitness apps, Yoga trackers, Interactive installations.
*   **Architecture**: Lightning-fast pose detection model.
*   **Output**: Detects 17 key body joints (Nose, Shoulders, Elbows, Knees, Ankles, etc.).
*   **Feature Engineering**: Automatically converts raw keypoints into a 51-dimensional feature vector for classification.
*   **Use Cases**: Yoga pose correction, exercise counting, posture analysis.

---

## 🛠️ Technology Stack

### Frontend (Client)
*   **Framework**: React 18 + Vite (Ultra-fast build tool).
*   **Language**: JavaScript (ES6+).
*   **State Management**: React Context API.
*   **ML Engine**: TensorFlow.js (Client-side training & inference).
*   **Styling**: Vanilla CSS (Custom Design System with Glassmorphism & Animations).
*   **Routing**: React Router v6.

### Backend (Server)
*   **Runtime**: Python 3.9+.
*   **Framework**: Flask (Microservices architecture).
*   **ML Engine**: TensorFlow 2.x / Keras.
*   **API Type**: RESTful JSON API.
*   **Workers**: Gunicorn (for concurrency).

### Infrastructure & Data
*   **Authentication**: Supabase Auth (Secure Magic Links & OAuth).
*   **Database**: PostgreSQL (via Supabase).
*   **Storage**: Supabase Storage (for Model artifacts and datasets).
*   **Hosting**: Render / Vercel compatible.

---

## 🚦 Getting Started

### Prerequisites
*   Node.js v18+
*   Python 3.9+
*   Supabase Account

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/wazih-shourov/ModelMint_The_AI-Powerhouse.git
    cd ModelMint_The_AI-Powerhouse
    ```

2.  **Frontend Setup**
    ```bash
    npm install
    cp .env.example .env
    # Edit .env with your Supabase credentials
    npm run dev
    ```

3.  **Backend Setup**
    ```bash
    cd python-server
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r requirements.txt
    # Configure your .env file
    python app.py
    ```

4.  **Environment Variables**
    
    Copy `.env.example` to `.env` and fill in your credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_PYTHON_SERVER_URL=http://localhost:5000
    ```

---

## 🔐 Security & Privacy

### What's Public
- ✅ Frontend React application
- ✅ UI components and styling
- ✅ Client-side ML logic (TensorFlow.js)
- ✅ Documentation and examples

### What's Private (Not in this repo)
- 🔒 Python server implementation (proprietary backend logic)
- 🔒 API keys and environment variables
- 🔒 Database schemas and migrations
- 🔒 Production deployment configurations

> **Note**: The Python server contains proprietary business logic and is not open-sourced. For collaboration or licensing inquiries, please contact the repository owner.

---

## 📸 Screenshots

*Coming soon - Stay tuned!*

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

*   TensorFlow.js team for the amazing ML framework
*   Supabase for the backend infrastructure
*   The open-source community for inspiration and support

---

## 📞 Contact & Support

*   **Author**: Wazih Shourov
*   **Email**: wazihshourov@gmail.com
*   **GitHub**: [@wazih-shourov](https://github.com/wazih-shourov)
*   **LinkedIn**: [Connect with me](https://linkedin.com/in/wazih-shourov)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by [Wazih Shourov](https://github.com/wazih-shourov)

© 2025 ModelMint - All Rights Reserved

</div>

