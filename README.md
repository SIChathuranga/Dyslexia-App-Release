# An AI-Powered Multisensory Adaptive Learning Platform for Children with Dyslexia 👧📱🧠

This is a research-based mobile application built with **Expo (React Native)** as part of the **SLIIT IT4010 Final Year Research Project**.

- **Project ID:** 25-26J-333  
- **Degree:** BSc (Hons) in Information Technology  
- **Institute:** Sri Lanka Institute of Information Technology (SLIIT)  
- **Goal:** Provide an AI-driven, multisensory, adaptive learning experience for children with dyslexia.

---

## 📌 Project Overview

Dyslexia is a neurodevelopmental learning disorder that impacts reading, spelling, writing, memory, attention, and numerical processing. Many existing digital solutions are limited because they focus on only one skill and do not support real-time adaptation, cognitive profiling, or integrated multisensory feedback.

This project proposes and implements a **unified AI-powered learning platform** that integrates:

- 📷 **Computer Vision (CV)** for object and gesture recognition  
- 🎙️ **Speech-to-Text (STT)** + **Natural Language Processing (NLP)** for answer checking and error detection  
- 🧠 **Machine Learning (ML)** for cognitive profiling (memory/attention) and personalization  
- 🔊 **Multisensory feedback** (visual, audio, haptic) to reinforce learning  
- 📱 **Offline-first & low-latency** AI inference for use on low-end devices  

---

## 🎯 Main Objective

To develop an integrated, AI-driven educational platform that enhances learning outcomes for children with dyslexia through personalized, multisensory interventions across spelling, writing, math, and cognitive skills.

---

## ✅ Key Features

- Photo capture/upload for real-world learning tasks  
- Object detection and spelling challenges with phonetic support  
- Voice-based response verification (STT) + NLP matching  
- Gesture-based instruction-following assessments  
- Adaptive multi-skill mini-games guided by cognitive profiling  
- Real-time feedback using visual + audio + vibration cues  
- Offline mode with sync when internet is available  
- Progress tracking and reporting for parents/educators  

---

## 🧠 Core System Modules

### 1️⃣ Photo-Based Spelling Challenge (Multisensory Phonemic Training)
- Child captures/uploads an object image
- System identifies the object using CV
- Generates spelling activity + phonemic breakdown (e.g., `chair → ch-air`)
- Child answers using speech or typing
- STT + NLP checks correctness and detects errors
- Provides multisensory feedback:
  - ✅ Visual (color-coded hints)
  - 🔊 Audio (pronunciation)
  - 📳 Haptic (short vibration = correct, long vibration = incorrect)

---

### 2️⃣ Cognitive Skill Assessment Module (Memory + Instruction Following)
- Measures memory retention with command sequences  
  - Example: "touch head → clap → sit"
- Measures instruction-following ability  
  - Example: "raise your right hand"
- Uses gesture recognition + adaptive difficulty
- Provides real-time feedback and performance logs  

---

### 3️⃣ Adaptive Multi-Skill Learning Game (MobileNetV2 Cognitive Profiling)
Mini-games assess:
- Phonological awareness  
- Visual memory and processing  
- Rapid naming speed  
- Basic numerical processing  

Captures:
- Accuracy
- Reaction time
- Error types

A customized **MobileNetV2-based classifier** profiles cognitive state (attention/memory load) to adjust:
- Difficulty
- Pacing
- Hint level
- Feedback intensity  

---

### 4️⃣ Dual-Skill Real-Time Feedback System (WhisperWriter + WhisperMath)
- **WhisperWriter:** reads aloud while child writes, supports writing corrections  
- **WhisperMath:** verbal step-by-step guidance for math tasks  
- Uses lightweight edge-friendly quantized transformer models  
- Task switching based on cognitive fatigue (verbal ↔ numerical)  

---

## 🏗️ System Architecture (High-Level)



---

## 🧰 Technology Stack & Dependencies

### 📱 Frontend
- Expo
- React Native
- TypeScript / JavaScript

### ⚙️ Backend
- Python
- Flask (REST APIs)

### 🧠 AI / ML
- YOLO / MobileNet (object detection)
- MobileNetV2 (cognitive classifier)
- TensorFlow / TensorFlow Lite
- Quantized transformer models (TinyBERT / MobileBERT)
- OpenCV

### 🎙️ Speech & Language
- Whisper / Google Speech-to-Text
- NLP logic (custom rule-based + similarity matching)

### 🗄️ Database
- Firebase / MongoDB

### 🛠️ Tools
- Git + GitHub
- Figma (UI/UX)
- VS Code
- Google Colab (training)

---

## 📂 Project Structure

```
/app            → Expo screens (file-based routing)
/frontend       → UI components & app logic
/backend        → Flask APIs + AI processing
/models         → ML models (TFLite / ONNX)
/docs           → Architecture diagrams & documents
/datasets       → Sample / processed datasets
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- Expo CLI (`npm install -g expo-cli`)
- ngrok (for tunnel testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Research-25-26J-333.git
   cd Research-25-26J-333
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Start the backend**
   ```bash
   python main.py
   ```

5. **Start the frontend**
   ```bash
   cd frontend
   npx expo start --tunnel
   ```

6. **Scan the QR code** with Expo Go (Android) or Camera app (iOS)

---

## 🔄 Version Control & Collaboration

This project uses GitHub for full version control:
- Feature-based branching (e.g., `feature/object-detection`)
- Frequent commits to show progress
- Pull requests and merges for collaboration
- Complete visible history: commits + branches + merges

---

## 👥 Team Members

>> Karunarathne D. T. S. — IT21313684
Photo-based spelling, CV, STT, NLP, multisensory feedback

>> Galappaththi A. G. R. S. — IT22345578
Cognitive assessment, gesture recognition, adaptive difficulty

>> Nawarathne N. S. N. — IT21307126
Adaptive learning game, MobileNetV2 profiling, reports

>> Chathuranga D. S. I. — IT22069054
WhisperWriter & WhisperMath, transformer models, fatigue switching

---

## 📄 License

This project is developed for academic research purposes at SLIIT.

---




