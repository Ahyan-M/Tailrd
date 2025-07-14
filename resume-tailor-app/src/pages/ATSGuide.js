import React from 'react';
import { ReactComponent as CheckCircleIcon } from '../assets/icons/check-circle.svg';
import { ReactComponent as CircleXmarkIcon } from '../assets/icons/circle-xmark.svg';

const ATSGuide = ({ darkMode }) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          ATS Guide & About Tailrd
        </h1>
        <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Your complete guide to optimizing resumes for Applicant Tracking Systems
        </p>
      </div>

      {/* About Us Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 mb-8`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Our Story
        </h2>
        <div className="space-y-4">
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Tailrd was created by Ahyan Mehta and Nehal Huda with a shared vision to simplify and streamline the job application journey. We noticed that job seekers often juggle too many tools, such as editing resumes in Word, tracking progress in spreadsheets, using separate AI tools for keyword suggestions, and applying through entirely different platforms. It felt messy and overwhelming. So we built Tailrd, a single platform that combines smart resume optimization, real-time ATS scoring, and job tracking all in one place. Everything you need to build a strong application, without the chaos.</p>
          
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Our mission with Tailrd is to empower job seekers everywhere with a smarter and more efficient way to navigate the modern job market, all from one centralized platform.

          </p>
        </div>
      </div>

      {/* What is ATS Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 mb-8`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          What is an ATS?
        </h2>
        <div className="space-y-4">
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            An Applicant Tracking System (ATS) is software used by employers to collect, sort, scan, and rank job applications. 
            These systems are designed to help recruiters and hiring managers manage large volumes of applications efficiently.
          </p>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <strong>Key Facts:</strong>
          </p>
          <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <li>75% of companies use ATS software to screen candidates</li>
            <li>ATS systems scan resumes for specific keywords and phrases</li>
            <li>Resumes that don't match the job requirements are often rejected automatically</li>
            <li>Formatting issues can cause qualified candidates to be filtered out</li>
          </ul>
        </div>
      </div>

      {/* How to Use Tailrd Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 mb-8`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          How to Use Tailrd Effectively
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Step 1 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">1</div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Upload Your Resume</h3>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Start by uploading your current resume in DOCX or PDF format. Our system will analyze your existing content and 
              identify areas for improvement.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Enter Job Details</h3>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Provide the company name, job role, and job description. This information helps our AI identify the most relevant 
              keywords and skills for your target position.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">3</div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Review Keywords</h3>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Our system will suggest relevant keywords from the job description. Select the ones that match your skills and 
              experience to include in your optimized resume.
            </p>
          </div>

          {/* Step 4 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">4</div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Optimize & Download</h3>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Click "Optimize Resume" to generate your ATS-optimized version. Review the ATS score and download your 
              enhanced resume ready for application.
            </p>
          </div>
        </div>
      </div>

      {/* Best Practices Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 mb-8`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          ATS Best Practices
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4 p-4 rounded-lg bg-green-100 ${darkMode ? 'bg-green-900' : ''}">
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>              <CheckCircleIcon className="w-5 h-5 text-green-600" /> Do's
            </h3>
            <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>              <li>Use standard section headings (Experience, Education, Skills)</li>
              <li>Include relevant keywords from the job description</li>
              <li>Use simple, clean formatting</li>
              <li>Quantify achievements with numbers and percentages</li>
              <li>Use reverse chronological order for experience</li>
              <li>Keep your resume to 1-2 pages maximum</li>
            </ul>
          </div>
          
          <div className="space-y-4 p-4 rounded-lg bg-red-100 ${darkMode ? 'bg-red-900' : ''}">
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>              <CircleXmarkIcon className="w-5 h-5 text-red-500" /> Don'ts
            </h3>
            <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>              <li>Avoid complex graphics, tables, or images</li>
              <li>Don't use fancy fonts or excessive formatting</li>
              <li>Avoid headers and footers</li>
              <li>Don't use abbreviations without explanation</li>
              <li>Avoid submitting as image files (JPG, PNG)</li>
              <li>Don't include personal information like photos</li>
            </ul>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default ATSGuide; 