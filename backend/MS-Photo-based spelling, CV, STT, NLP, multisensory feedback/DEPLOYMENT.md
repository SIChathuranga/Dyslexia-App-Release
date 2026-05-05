# Deployment Guide — Photo-Spelling Backend on Hugging Face Spaces

This guide walks you through deploying the **Dyslexia Learning App** FastAPI backend to [Hugging Face Spaces](https://huggingface.co/spaces) (free Docker tier) and keeping it alive 24/7 with the built-in heartbeat system.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create a Hugging Face Account](#2-create-a-hugging-face-account)
3. [Create a New Space](#3-create-a-new-space)
4. [Configure Repository Secrets](#4-configure-repository-secrets)
5. [Push Code to the Space](#5-push-code-to-the-space)
6. [Monitor the Build](#6-monitor-the-build)
7. [Test the Deployed API](#7-test-the-deployed-api)
8. [Update Frontend Configuration](#8-update-frontend-configuration)
9. [Heartbeat / Keep-Alive System](#9-heartbeat--keep-alive-system)
10. [Troubleshooting](#10-troubleshooting)
11. [Useful Commands](#11-useful-commands)

---

## 1. Prerequisites

| Requirement        | Details                                                      |
| ------------------ | ------------------------------------------------------------ |
| **Git**            | Installed and configured on your machine                     |
| **Python 3.11+**   | For local testing (optional)                                 |
| **Hugging Face Account** | Free tier is sufficient                                |
| **HF Access Token** | Write-permission token from HF settings                     |
| **MongoDB Atlas**  | A running cluster with connection string ready               |

---

## 2. Create a Hugging Face Account

1. Go to <https://huggingface.co/join> and sign up (free).
2. Verify your email address.

---

## 3. Create a New Space

1. Navigate to <https://huggingface.co/new-space>.
2. Fill in the form:

   | Field         | Value                          |
   | ------------- | ------------------------------ |
   | **Space name** | `photo-spelling-backend`      |
   | **SDK**       | **Docker**                     |
   | **Visibility** | **Public** (required for free tier) |

3. Click **Create Space**.

> **Note:** The free tier only supports **public** Spaces.

---

## 4. Configure Repository Secrets

In your newly created Space:

1. Go to **Settings → Repository secrets**.
2. Add the following secrets:

   | Name                         | Value                                                                                           |
   | ---------------------------- | ----------------------------------------------------------------------------------------------- |
   | `MONGODB_URI`                | `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0` |
   | `MONGODB_DB_NAME`            | `dyslearnapp`                                                                                   |
   | `MODEL_PATH`                 | `best_yolov8_openimages_plus_roboflow_v2-3.pt`                                                  |
   | `HEARTBEAT_INTERVAL_SECONDS` | `840` *(optional — defaults to 840 = 14 minutes)*                                              |

> **`SPACE_ID`** is automatically set by Hugging Face (e.g. `your-username/photo-spelling-backend`). The heartbeat system auto-detects it — no manual config needed.

---

## 5. Push Code to the Space

### 5.1 Generate a Hugging Face Token

1. Go to <https://huggingface.co/settings/tokens>.
2. Click **New token**.
3. Give it a name (e.g. `space-deploy`) and select **Write** permission.
4. Copy the token.

### 5.2 Add the HF Space as a Git Remote and Push

Open a terminal **inside the `backend/` folder** and run:

```bash
# Initialize git if not already (skip if backend is already a git repo)
git init

# Add the Hugging Face Space as a remote
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/photo-spelling-backend

# Stage all files
git add .

# Commit
git commit -m "Initial deployment to Hugging Face Spaces"

# Push to the Space (main branch)
git push hf main
```

> Replace `YOUR_USERNAME` with your actual Hugging Face username.  
> When prompted, enter your HF **username** and the **write token** you generated above as the password.

### 5.3 Files That Get Pushed

The following files are needed for deployment:

| File                                              | Purpose                              |
| ------------------------------------------------- | ------------------------------------ |
| `main.py`                                         | FastAPI application                  |
| `requirements.txt`                                | Python dependencies                  |
| `Dockerfile`                                      | Docker build instructions            |
| `best_yolov8_openimages_plus_roboflow_v2-3.pt`    | YOLOv8 model (~6 MB, no LFS needed) |

> The `.gitignore` excludes `venv/`, `.env`, `__pycache__/`, and temp files automatically.

---

## 6. Monitor the Build

1. Go to your Space page: `https://huggingface.co/spaces/YOUR_USERNAME/photo-spelling-backend`
2. Click the **Logs** tab.
3. Watch the Docker build progress. The first build typically takes **5–10 minutes**.
4. Look for these success indicators in the logs:
   ```
   ✅ MongoDB connected (dyslearnapp)
   ✅ Whisper model loaded (base)
   ✅ Model loaded from best_yolov8_openimages_plus_roboflow_v2-3.pt
   💓 Heartbeat started → pinging https://YOUR_USERNAME-photo-spelling-backend.hf.space/health every 840s
   ```

---

## 7. Test the Deployed API

Once the Space status shows **Running**, your API is available at:

```
https://YOUR_USERNAME-photo-spelling-backend.hf.space
```

### Quick Tests

**Health check:**
```bash
curl https://YOUR_USERNAME-photo-spelling-backend.hf.space/health
```
Expected response:
```json
{"status": "healthy", "timestamp": "2026-03-12T10:00:00+00:00", "model_loaded": true}
```

**Root endpoint:**
```bash
curl https://YOUR_USERNAME-photo-spelling-backend.hf.space/
```
Expected response:
```json
{"message": "Dyslexia Learning App API is running"}
```

**Interactive API docs:**
```
https://YOUR_USERNAME-photo-spelling-backend.hf.space/docs
```

---

## 8. Update Frontend Configuration

Update your frontend `.env` (or equivalent config) to point to the deployed URL:

```env
API_BASE_URL=https://YOUR_USERNAME-photo-spelling-backend.hf.space
```

---

## 9. Heartbeat / Keep-Alive System

### The Problem

Hugging Face free-tier Spaces **sleep after 48 hours of inactivity**. After sleeping, the first request takes **30–60 seconds** to cold-start.

### The Solution

The backend includes a built-in **self-ping heartbeat** that keeps the Space alive indefinitely:

- A background daemon thread pings `GET /health` every **14 minutes** (configurable).
- The heartbeat auto-detects the Space URL from the `SPACE_ID` environment variable (set automatically by HF).
- On local development, the heartbeat is disabled (no `SPACE_ID` set).

### How It Works

```
┌─────────────────────────────────────────────┐
│            Hugging Face Space               │
│                                             │
│  ┌──────────┐     GET /health     ┌──────┐  │
│  │ Heartbeat├────────────────────►│ API  │  │
│  │  Thread   │    every 14 min    │Server│  │
│  └──────────┘                     └──────┘  │
│                                             │
│  The self-ping counts as "activity"         │
│  preventing the 48h sleep timeout.          │
└─────────────────────────────────────────────┘
```

### Configuration

| Environment Variable           | Default | Description                                    |
| ------------------------------ | ------- | ---------------------------------------------- |
| `HEARTBEAT_INTERVAL_SECONDS`   | `840`   | Seconds between pings (14 min). Keep under 48h.|
| `SPACE_URL`                    | *(auto)*| Override the auto-detected Space URL if needed. |

> **Tip:** The default 14-minute interval is well below the 48-hour threshold while being gentle on resources. No need to change it unless you have a specific reason.

### Verifying the Heartbeat

Check the Space **Logs** tab for periodic messages like:
```
💓 Heartbeat ping OK (200)
```

If you see `💓 Heartbeat disabled`, the `SPACE_ID` was not detected — set `SPACE_URL` manually in the Space secrets.

---

## 10. Troubleshooting

### Build Fails

| Symptom                          | Fix                                                          |
| -------------------------------- | ------------------------------------------------------------ |
| `pip install` errors             | Check `requirements.txt` for typos or version conflicts      |
| `torch` download timeout         | The Dockerfile uses CPU-only torch via `--extra-index-url`   |
| Out of memory during build       | Free tier has limited RAM; ensure no GPU packages are pulled  |

### Runtime Errors

| Symptom                            | Fix                                                        |
| ---------------------------------- | ---------------------------------------------------------- |
| `⚠️ MONGODB_URI not set`          | Add `MONGODB_URI` secret in Space Settings                 |
| `❌ Failed to connect to MongoDB`  | Check the connection string, IP whitelist (use `0.0.0.0/0`)|
| `Model not loaded`                | Ensure `.pt` file was pushed and `MODEL_PATH` matches       |
| Space sleeps despite heartbeat     | Verify `SPACE_URL`/`SPACE_ID` is set; check logs for pings |

### Space Still Sleeping?

1. Confirm the heartbeat is actually running (look for `💓 Heartbeat started` in logs).
2. If `SPACE_ID` is not auto-detected, set `SPACE_URL` manually:
   ```
   https://YOUR_USERNAME-photo-spelling-backend.hf.space
   ```
3. Ensure the interval is not set too high (keep it under a few hours).

### MongoDB Atlas IP Whitelist

Hugging Face Spaces have dynamic IPs. In MongoDB Atlas:

1. Go to **Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access from Anywhere** (`0.0.0.0/0`).

---

## 11. Useful Commands

### Re-deploy After Code Changes

```bash
cd backend/
git add .
git commit -m "Update: description of changes"
git push hf main
```

The Space will automatically rebuild.

### Force Rebuild

In your Space page, click **Settings → Factory reboot** to force a fresh build.

### View Logs

Go to your Space → **Logs** tab, or use the HF CLI:

```bash
pip install huggingface_hub
huggingface-cli repo info spaces/YOUR_USERNAME/photo-spelling-backend
```

### Check Space Status via API

```bash
curl -s https://huggingface.co/api/spaces/YOUR_USERNAME/photo-spelling-backend | python -m json.tool
```

---

## Architecture Overview

```
┌──────────────┐    HTTPS     ┌──────────────────────────────────┐
│  React Native├─────────────►│  Hugging Face Space (Docker)     │
│  Frontend    │              │                                  │
└──────────────┘              │  ┌────────────────────────────┐  │
                              │  │  FastAPI (uvicorn :7860)   │  │
                              │  │                            │  │
                              │  │  /              → health   │  │
                              │  │  /health        → status   │  │
                              │  │  /detect-object → YOLO     │  │
                              │  │  /speech-to-text→ Whisper  │  │
                              │  │  /verify-answer → matcher  │  │
                              │  │  /auth/*        → MongoDB  │  │
                              │  │  /progress/*    → MongoDB  │  │
                              │  │                            │  │
                              │  │  💓 Heartbeat Thread       │  │
                              │  └─────────────┬──────────────┘  │
                              └────────────────┼─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │  MongoDB Atlas (Cloud)           │
                              └──────────────────────────────────┘
```

---

## Summary Checklist

- [ ] Hugging Face account created
- [ ] New Docker Space created (`photo-spelling-backend`)
- [ ] Secrets configured (`MONGODB_URI`, `MONGODB_DB_NAME`, `MODEL_PATH`)
- [ ] Code pushed to the Space via `git push hf main`
- [ ] Build completed successfully (check Logs tab)
- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] Heartbeat is running (`💓 Heartbeat started` in logs)
- [ ] Frontend `.env` updated with Space URL
- [ ] MongoDB Atlas IP whitelist set to `0.0.0.0/0`
