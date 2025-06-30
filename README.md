# Tailrd

Tailrd is a modern, minimalistic SaaS web application that helps you optimize your resume for Applicant Tracking Systems (ATS) using AI. It analyzes your resume and job descriptions, suggests relevant keywords, and intelligently enhances your resume to improve your chances of getting noticed by recruiters.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Frontend Pages & Flow](#frontend-pages--flow)
- [Backend API](#backend-api)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Privacy & Terms](#privacy--terms)
- [Contact & Support](#contact--support)

---

## Features

- **Multi-Page SaaS UI**: Dashboard, Resume Optimizer, Job Tracker, and more, with a Notion/Linear/Vercel-inspired minimal design.
- **Resume Optimization**: Upload your resume (PDF/DOCX/TXT), input job details, and get an optimized, ATS-friendly DOCX file.
- **AI-Powered Keyword Suggestions**: Extracts and suggests missing keywords based on job description and industry best practices.
- **ATS Scoring**: Calculates and displays ATS compatibility scores, with detailed breakdowns.
- **Job Application Tracker**: Track all your job applications, statuses, and improvements in one place.
- **Progress Stepper**: Visual step-by-step navigation for the resume optimization process.
- **Responsive & Accessible**: Fully responsive, dark mode support, and accessible design.
- **User Authentication**: (via Supabase) for saving and tracking job applications.
- **Minimal, Professional UI**: Clean layouts, subtle borders, whitespace, and minimal iconography.
- **Privacy & Security**: Data is stored securely and never sold to third parties.

---

## Tech Stack

### Frontend

- **React.js** (with Create React App)
- **Tailwind CSS** (utility-first styling)
- **Slate** (rich text editing for resume content)
- **React Toastify** (notifications)
- **Supabase** (user authentication & data storage)
- **Lucide React** (minimal icon set)
- **Other**: PDF.js, TinyMCE, Vercel Analytics

### Backend

- **Flask** (Python web API)
- **python-docx** (DOCX manipulation)
- **PyPDF2** (PDF text extraction)
- **mammoth** (DOCX text extraction)
- **Flask-CORS** (CORS support)
- **gunicorn** (production server)
- **reportlab, Pillow, docx2pdf** (file handling)

---

## Project Structure

```
SummerProject/
├── app.py                  # Flask backend API
├── requirements.txt        # Backend dependencies
├── resume-tailor-app/
│   ├── package.json        # Frontend dependencies
│   ├── src/
│   │   ├── App.js          # Main React app logic
│   │   ├── config.js       # API endpoint config
│   │   ├── supabase.js     # Supabase client setup
│   │   ├── SlateEditor.js  # Rich text editor
│   │   ├── components/
│   │   │   ├── Navigation.js
│   │   │   └── ProgressStepper.js
│   │   └── pages/
│   │       ├── Dashboard.js
│   │       ├── ResumeOptimizer.js
│   │       ├── JobTracker.js
│   │       ├── Contact.js
│   │       ├── PrivacyPolicy.js
│   │       └── TermsOfService.js
│   └── public/
├── uploads/                # Temporary file storage
└── README.md               # Project documentation
```

---

## Installation & Setup

### Prerequisites

- Python 3.7+
- Node.js 14+
- npm

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd SummerProject
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```
- The backend runs on `http://localhost:8000` by default.

### 3. Frontend Setup

```bash
cd resume-tailor-app
npm install
npm start
```
- The frontend runs on `http://localhost:3000` by default.

---

## Usage Guide

1. **Sign In** (if authentication is enabled)
2. **Dashboard**: View stats, recent applications, and quick actions.
3. **Resume Optimizer**:
   - Upload your resume (PDF, DOCX, or TXT).
   - Enter job details (company, role, job description).
   - Optimize your resume and review ATS score and keyword suggestions.
   - Download the optimized DOCX file.
4. **Job Tracker**: Track all your job applications, statuses, and ATS improvements.
5. **Contact, Privacy, Terms**: Access support and legal pages from the navigation bar.

---

## Frontend Pages & Flow

- **Dashboard**: Overview of your applications, stats, and quick actions.
- **Resume Optimizer**: Step-by-step flow (Upload → Job Details → Optimize → Download) with a progress stepper.
- **Job Tracker**: List and manage all job applications, update statuses, and see ATS improvements.
- **Contact**: Support email and contact info.
- **Privacy Policy**: Data privacy details.
- **Terms of Service**: Usage terms and legal info.
- **Navigation**: Persistent top bar for switching between pages and toggling dark mode.

---

## Backend API

### Main Endpoints

- `POST /optimize-docx`  
  - **Input**: Resume file, job description, company, job role  
  - **Output**: Optimized DOCX file

- `POST /suggest-keywords`  
  - **Input**: Resume text, job description, industry  
  - **Output**: List of suggested keywords

- `POST /finalize-resume`  
  - **Input**: Resume, job description, selected keywords  
  - **Output**: Final optimized DOCX

- `POST /calculate-ats-score`  
  - **Input**: Resume text, job description  
  - **Output**: ATS score breakdown

- `POST /optimize-ats`  
  - **Input**: Resume text, job description, target score  
  - **Output**: Optimized resume text

- `POST /download-optimized`  
  - **Input**: Resume, job description, selected keywords  
  - **Output**: Download link for optimized DOCX

- `GET /export-formats`  
  - **Output**: Supported export formats

#### All endpoints return JSON on error.

---

## Configuration

- **API URLs**: Set in `resume-tailor-app/src/config.js` (supports local, Render, or custom domain).
- **Supabase**: Credentials in `resume-tailor-app/src/supabase.js` (for authentication and job tracking).
- **Frontend/Backend Ports**: 3000 (React), 8000 (Flask) by default.
- **CORS**: Enabled in Flask for frontend-backend communication.

---

## Deployment

### Backend

- For production, use Gunicorn:
  ```bash
  pip install gunicorn
  gunicorn -w 4 -b 0.0.0.0:8000 app:app
  ```

### Frontend

- Build for production:
  ```bash
  npm run build
  ```
- Deploy the `build/` folder to your preferred static hosting (Vercel, Netlify, etc).

---

## Privacy & Terms

- **Privacy Policy**: Your data is stored securely and never sold to third parties. Used only to provide and improve the service.
- **Terms of Service**: Use the service lawfully. Abuse or illegal activity may result in account suspension.

---

## Contact & Support

- Email: [support@tailrd.com](mailto:support@tailrd.com)
- For help, feedback, or questions, use the Contact page or email above.

---

**Tailrd — Made for job seekers, by job seekers.**

---
