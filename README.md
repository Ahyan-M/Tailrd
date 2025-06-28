# Tailrd

A web application that optimizes your resume by analyzing job descriptions and intelligently adding relevant keywords and skills to increase your chances of getting hired.

## 🚀 Features

- **Smart Keyword Extraction**: Automatically identifies technical skills and keywords from job descriptions
- **Intelligent Optimization**: Adds missing keywords to appropriate sections (Skills, Tools, Frameworks, etc.), which helps with getting a impressive score in an ATS.
- **Professional Output**: Always returns a clean, optimized DOCX file
- **Modern UI**: Beautiful, responsive and minimialistic interface with dark mode support
- **Real-time Processing**: Fast optimization with immediate download 

## 🛠️ Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript (ES6+)** - Modern JavaScript features

### Backend
- **Flask** - Python web framework
- **python-docx** - DOCX file manipulation
- **PyPDF2** - PDF text extraction
- **mammoth** - DOCX text extraction
- **flask-cors** - Cross-origin resource sharing

## 📋 Prerequisites

- Python 3.7+
- Node.js 14+
- npm or yarn

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/resume-tailor.git
cd resume-tailor
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install flask python-docx PyPDF2 mammoth flask-cors

# Start the Flask server
python app.py
```
The backend will run on `http://localhost:8000`

### 3. Frontend Setup
```bash
# Navigate to the React app directory
cd resume-tailor-app

# Install dependencies
npm install

# Start the development server
npm start
```
The frontend will run on `http://localhost:3000`

## 📖 Usage

1. **Upload Resume**: Drag and drop or click to upload your PDF or DOCX resume
2. **Enter Job Details**: 
   - Company name (optional)
   - Job role (optional)
   - Job description (required)
3. **Optimize**: Click "Optimize Resume" to process your resume
4. **Download**: Get your optimized resume as a DOCX file

## 🔌 API Documentation

### Endpoint: `POST /optimize-docx`

**URL:** `http://localhost:8000/optimize-docx`

**Request Format:** `multipart/form-data`

**Parameters:**
- `resume` (file, required) - Resume file (PDF or DOCX)
- `jobDescription` (string, required) - Job description text
- `companyName` (string, optional) - Company name
- `jobRole` (string, optional) - Job role/title

**Response:**
- **Success**: DOCX file download
- **Error**: JSON error message

**Example Response:**
```json
{
  "error": "Missing file or job description"
}
```

## 🏗️ Project Structure

```
resume-tailor/
├── app.py                 # Flask backend server
├── README.md             # Project documentation
├── resume-tailor-app/    # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Styles
│   │   └── index.js      # React entry point
│   ├── package.json      # Frontend dependencies
│   └── README.md         # Frontend documentation
└── uploads/              # Temporary file storage
```

## 🎯 How It Works

1. **Text Extraction**: The system extracts text from uploaded PDF or DOCX files
2. **Keyword Analysis**: Analyzes the job description to identify relevant technical keywords using predefined categories
3. **Smart Categorization**: Categorizes keywords into:
   - Programming Languages
   - Web Technologies
   - Databases
   - Cloud Platforms
   - Data Science Tools
   - Development Tools
   - Machine Learning
4. **Intelligent Placement**: Adds missing keywords to appropriate sections in the resume using rule-based logic
5. **File Generation**: Creates an optimized DOCX file for download

## 🔧 Configuration

### Backend Configuration
- **Port**: Default 8000 (change in `app.py`)
- **CORS**: Enabled for frontend communication
- **File Size**: No explicit limit (handled by Flask defaults)

### Frontend Configuration
- **API URL**: Configured to `http://localhost:8000/optimize-docx`
- **Port**: Default 3000 (React default)

## 🚀 Deployment

### Backend Deployment
```bash
# For production, use a WSGI server like Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy the build folder to your hosting service
```

**Made with ❤️ for job seekers everywhere**
