import React from 'react';
import { ReactComponent as CheckCircleIcon } from '../assets/icons/check-circle.svg';
import { ReactComponent as CircleXmarkIcon } from '../assets/icons/circle-xmark.svg';
import profilePic from '../assets/icons/pic.jpg';
import partnerPic from '../assets/icons/1732677808479.jpg';

const ATSGuide = ({ darkMode }) => {
  return (
    <div className="max-w-6xl w-full mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Hero Section */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className={`text-2xl md:text-4xl font-bold mb-2 md:mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Learn & About Tailrd</h1>
        <p className={`text-base md:text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your complete guide to optimizing resumes for Applicant Tracking Systems</p>
      </div>

      {/* About Us Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4 md:p-8 mb-6 md:mb-8 w-full`}>
        <h2 className={`text-lg md:text-2xl font-bold mb-4 md:mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>About Us</h2>
        <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>Tailrd was created by Ahyan Mehta and Nehal Huda with a shared vision to simplify and streamline the job application journey. We noticed that job seekers often juggle too many tools, such as editing resumes in Word, tracking progress in spreadsheets, using separate AI tools for keyword suggestions, and applying through entirely different platforms. It felt messy and overwhelming. So we built Tailrd, a single platform that combines smart resume optimization, real-time ATS scoring, and job tracking all in one place. Everything you need to build a strong application, without the chaos.</p>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>Our mission with Tailrd is to empower job seekers everywhere with a smarter and more efficient way to navigate the modern job market, all from one centralized platform.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 items-center justify-center">
          {/* Profile 1 */}
          <div className="flex flex-col items-center">
            <img src={profilePic} alt="Profile 1" className="w-28 h-28 rounded-full object-cover border-4 border-gray-300 mb-3" />
            <div className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ahyan Mehta</div>
            <a href="https://www.linkedin.com/in/ahyanmehta1/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1">LinkedIn</a>
          </div>
          {/* Profile 2 */}
          <div className="flex flex-col items-center">
            <img src={partnerPic} alt="Profile 2" className="w-28 h-28 rounded-full object-cover border-4 border-gray-300 mb-3" />
            <div className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Nehal Huda</div>
            <a href="https://www.linkedin.com/in/nehalhuda/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1">LinkedIn</a>
          </div>
        </div>
      </div>

      {/* What is an ATS Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4 md:p-8 mb-6 md:mb-8 w-full`}>
        <h2 className={`text-lg md:text-2xl font-bold mb-4 md:mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>What is an ATS?</h2>
        <div className="space-y-3 md:space-y-4">
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>An Applicant Tracking System (ATS) is software used by employers to collect, sort, scan, and rank job applications. These systems are designed to help recruiters and hiring managers manage large volumes of applications efficiently.</p>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}><strong>Key Facts:</strong></p>
          <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>
            <li>75% of companies use ATS software to screen candidates</li>
            <li>ATS systems scan resumes for specific keywords and phrases</li>
            <li>Resumes that don't match the job requirements are often rejected automatically</li>
            <li>Formatting issues can cause qualified candidates to be filtered out</li>
          </ul>
        </div>
      </div>

      {/* How to Use Tailrd Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4 md:p-8 mb-6 md:mb-8 w-full`}>
        <h2 className={`text-lg md:text-2xl font-bold mb-4 md:mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>How to Use Tailrd Effectively</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Step 1 */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">1</div>
              <h3 className={`text-base md:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Upload Your Resume</h3>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>Start by uploading your current resume in DOCX or PDF format. Our system will analyze your existing content and identify areas for improvement.</p>
          </div>
          {/* Step 2 */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h3 className={`text-base md:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Enter Job Details</h3>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>Provide the company name, job role, and job description. This information helps our AI identify the most relevant keywords and skills for your target position.</p>
          </div>
        </div>
      </div>

      {/* ATS Best Practices Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4 md:p-8 mb-6 md:mb-8 w-full`}>
        <h2 className={`text-lg md:text-2xl font-bold mb-4 md:mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>ATS Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className={`space-y-3 md:space-y-4 p-4 rounded-lg ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}>
            <h3 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>              <CheckCircleIcon className="w-5 h-5 text-green-600" /> Do's</h3>
            <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>
              <li>Use standard section headings (Experience, Education, Skills)</li>
              <li>Include relevant keywords from the job description</li>
              <li>Use simple, clean formatting</li>
              <li>Quantify achievements with numbers and percentages</li>
              <li>Use reverse chronological order for experience</li>
              <li>Keep your resume to 1-2 pages maximum</li>
            </ul>
          </div>
          <div className={`space-y-3 md:space-y-4 p-4 rounded-lg ${darkMode ? 'bg-red-900' : 'bg-red-100'}`}>
            <h3 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>              <CircleXmarkIcon className="w-5 h-5 text-red-600" /> Don'ts</h3>
            <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm md:text-base`}>
              <li>Use tables, images, or graphics</li>
              <li>Include irrelevant personal information</li>
              <li>Use fancy fonts or colors</li>
              <li>Submit your resume as a photo or scanned document</li>
              <li>Overuse buzzwords or clichés</li>
              <li>Lie or exaggerate your experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSGuide; 