import React, { useState } from "react";

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) {
      alert("Please upload a resume and enter a job description.");
      return;
    }
    setLoading(true);
    setResult(null);
    setDownloadUrl(null);
  
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    formData.append("companyName", companyName);
    formData.append("jobRole", jobRole);
  
    try {
      let response;
      // If DOCX, use Python backend
      if (
        resumeFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        resumeFile.name.endsWith(".docx")
      ) {
        response = await fetch("http://localhost:8000/optimize-docx", {
          method: "POST",
          body: formData,
        });
      } else {
        // Otherwise, use Node backend (for PDF or fallback)
        response = await fetch("http://localhost:5000/api/optimize-resume", {
          method: "POST",
          body: formData,
        });
      }
  
      if (response.headers.get("content-type").includes("application/json")) {
        // Error response
        const data = await response.json();
        setResult(data);
      } else {
        // File response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
      }
    } catch (err) {
      alert("Error uploading file or connecting to server.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A]">
      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        {/* Header with Logo */}
        <div className="mb-12">
          {/* Logo and title centered */}
          <div className="flex justify-center items-center mb-8">
            <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center shadow-lg mr-4">
              <span className="text-white text-xl font-bold">T</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent">
              Tailrd
            </h1>
          </div>
          
          <div className="text-center">
            <p className="text-xl max-w-2xl mx-auto text-[#4B5563]">
              Transform your resume with AI-powered optimization tailored to your dream job
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] p-8 mb-8 transition-all duration-300 transform hover:scale-[1.02]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">
                Upload Resume
              </label>
              <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 text-center transition-all duration-300 hover:scale-105 hover:border-[#2563EB] bg-[#FAFAFA]">
                <input 
                  type="file" 
                  accept=".docx" 
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <div className="text-[#2563EB] mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="font-medium text-[#1A1A1A]">
                    {resumeFile ? resumeFile.name : "Click to upload DOCX document"}
                  </p>
                  <p className="text-sm mt-2 text-[#4B5563]">
                    Only DOCX files accepted
                  </p>
                </label>
              </div>
            </div>

            {/* Company and Role Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#1A1A1A]">
                  Company Name
                </label>
                <input
                  type="text"
                  className="w-full border border-[#E5E7EB] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-300 bg-white text-[#1A1A1A] placeholder-[#4B5563]"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Microsoft..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#1A1A1A]">
                  Job Role
                </label>
                <input
                  type="text"
                  className="w-full border border-[#E5E7EB] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-300 bg-white text-[#1A1A1A] placeholder-[#4B5563]"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g., Software Engineer..."
                />
              </div>
            </div>

            {/* Job Description Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#1A1A1A]">
                Job Description
              </label>
              <textarea
                className="w-full border border-[#E5E7EB] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-300 resize-none bg-white text-[#1A1A1A] placeholder-[#4B5563]"
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to help us optimize your resume..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing your resume...
                </div>
              ) : (
                "Optimize Resume"
              )}
            </button>
          </form>
        </div>

        {/* Sticky Download Section */}
        {downloadUrl && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 rounded-2xl shadow-2xl border border-[#E5E7EB] bg-white p-6 max-w-md w-full mx-4 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1 text-[#1A1A1A]">
                  🎉 Resume Ready!
                </h3>
                <p className="text-[#4B5563]">
                  Your optimized resume is ready
                </p>
              </div>
              <a
                href={downloadUrl}
                download={companyName && jobRole ? `${companyName} ${jobRole} Resume.docx` : "optimized_resume.docx"}
                className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </a>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] p-8 transition-all duration-500 animate-fade-in">
            <h2 className="text-2xl font-semibold mb-6 text-[#1A1A1A]">
              ✨ Analysis Results
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4 text-[#1A1A1A]">
                  🏷️ Extracted Keywords
                </h3>
                <div className="bg-[#FAFAFA] rounded-xl p-6">
                  {result.keywords && result.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {result.keywords.map((keyword, index) => (
                        <span 
                          key={index}
                          className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white px-4 py-2 rounded-full text-sm font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#4B5563]">
                      No keywords found.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 text-[#1A1A1A]">
                  📄 Resume Preview
                </h3>
                <div className="bg-[#FAFAFA] rounded-xl p-6 max-h-64 overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap font-sans text-[#1A1A1A]">
                    {result.resumeText}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;