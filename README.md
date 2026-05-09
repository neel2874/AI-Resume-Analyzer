# AI Resume Analyzer

An intelligent, full-stack application that analyzes resumes against job descriptions (JDs) using OpenAI's advanced language models. The system acts as an automated Applicant Tracking System (ATS) and technical recruiter, providing candidates with match scores, summaries, strengths, missing skills, and actionable improvement feedback.

## Features

- **User Authentication:** Secure user registration and login system.
- **AI-Powered Analysis:** Extracts text from PDF resumes and evaluates it against provided job descriptions using OpenAI (GPT-4o-mini).
- **Detailed Insights:** Outputs a customized evaluation including:
  - Match score percentage (0-100)
  - Candidate fit summary
  - Identified strengths
  - Missing skills
  - Actionable improvements
- **History Tracking:** Automatically saves all past resume analysis results to a MongoDB database for easy retrieval, review, and tracking.
- **Seamless UI:** Built with React, Vite, and styled with Tailwind CSS for a modern, responsive, and engaging user experience.

## Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS (v4)
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **AI Integration:** OpenAI API 
- **File Processing:** Multer for file uploads, PDF-Parse for text extraction

## Prerequisites

Before you begin, ensure you have the following ready:
- **Node.js** (v18 or higher recommended)
- **NPM** package manager
- **MongoDB** cluster (can be a local DB or MongoDB Atlas)
- **OpenAI API Key** (for resume analysis)
- **Mistral AI API Key** (optional alternative for resume analysis)

## Getting Started

### 1. Installation

Clone the repository and install the required dependencies (both frontend and backend packages are managed from the root `package.json`):

```bash
# Install dependencies
npm install
```

### 2. Environment Variables

The backend configuration relies on local environment variables. Create a `.env` file in the `backend` folder:

```bash
# Create backend environment variables
touch backend/.env
```

Add your specific configuration to `backend/.env`:
```env
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
MISTRAL_API_KEY=your_mistral_api_key
```

### 3. Running the Application

You can run both the frontend and backend servers together concurrently using the provided startup script:

```bash
# Start both React Frontend & Express Backend
npm run dev:all
```

Alternatively, to run them separately:

- **Frontend Server:**
  ```bash
  npm run dev
  ```
- **Backend API Server:**
  ```bash
  npm run server
  ```

*The frontend application will run on `http://localhost:5173` (Vite Default) and the live backend API is hosted at `https://ai-resume-analyzer-65sa.onrender.com`.*

## Folder Structure

```text
├── backend/
│   ├── .env                    # Backend environmental config
│   └── Models/
│       ├── Analysis.js         # MongoDB Schema for saved analyses
│       └── User.js             # MongoDB Schema for users
├── src/                        # Frontend React UI components and pages
├── uploads/                    # Temporary folder for PDF parsing
├── server.js                   # Main Express application & API Routes
└── package.json                # Project dependencies and scripts
```

## API Endpoints

### Authentication
- **`POST /api/auth/register`** - Registers a new user. Expects `name`, `email`, `password`.
- **`POST /api/auth/login`** - Authenticates a user. Expects `email`, `password`.

### Core Application
- **`POST /api/analyze`** - Uploads a PDF resume and compares it against a JD text.
  - **Payload (multipart/form-data):** `resume` (PDF file), `jd` (Text), `userEmail` (Text).
- **`GET /api/history?email=<userEmail>`** - Retrieves all historical ATS scan data for the current user.
- **`DELETE /api/history/:id`** - Deletes a specific scan record from the database.

## Usage Guide
1. Create a user account via the registration portal or login.
2. Paste the target Job Description in the input field.
3. Upload your Resume (PDF format).
4. Click Analyze – The system will parse the PDF, transmit the content payload to OpenAI, and return detailed compatibility insights.
5. Visit your profile/history to view all your past tailored feedback.

---
*Built to help candidates optimize their application profiles.*
