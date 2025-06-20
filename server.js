const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mammoth = require('mammoth');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Helper: Extract text from PDF
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

// Helper: Extract text from DOCX using mammoth
async function extractTextFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// Helper: Simple keyword extraction (most frequent words)
function extractKeywords(text, num = 10) {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  const freq = {};
  words.forEach(w => (freq[w] = (freq[w] || 0) + 1));
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, num)
    .map(([word]) => word);
}

// Helper: Insert missing keywords into Skills/Tools section or create one
function insertKeywordsIntoSkillsSection(resumeText, missingKeywords) {
  if (missingKeywords.length === 0) return resumeText;

  const skillsSectionRegex = /(skills|tools)[:\-\s]*([\s\S]*?)(\n\n|$)/i;
  const match = resumeText.match(skillsSectionRegex);

  if (match) {
    // Add missing keywords to the found section
    const sectionTitle = match[1];
    const sectionContent = match[2];
    const sectionEnd = match[3];
    // Avoid duplicate keywords
    const existingSkills = sectionContent
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    const newSkills = missingKeywords.filter(
      kw => !existingSkills.includes(kw.toLowerCase())
    );
    const updatedSection = sectionContent.trim().length > 0
      ? sectionContent.trim() + (newSkills.length ? ', ' + newSkills.join(', ') : '')
      : newSkills.join(', ');
    return resumeText.replace(
      skillsSectionRegex,
      `${sectionTitle}: ${updatedSection}${sectionEnd}`
    );
  } else {
    // No skills/tools section found, add one at the end
    return (
      resumeText +
      `\n\nSkills: ${missingKeywords.join(', ')}`
    );
  }
}

// Main endpoint
app.post('/api/optimize-resume', upload.single('resume'), async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription;
    const companyName = req.body.companyName || '';
    const jobRole = req.body.jobRole || '';
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    let resumeText = '';
    let isDocx = false;
    if (file.mimetype === 'application/pdf') {
      resumeText = await extractTextFromPDF(file.path);
    } else if (
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword'
    ) {
      resumeText = await extractTextFromDocx(file.path);
      isDocx = true;
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Extract keywords from job description
    const keywords = extractKeywords(jobDescription);

    // Find missing keywords
    const missingKeywords = keywords.filter(
      (kw) => !resumeText.toLowerCase().includes(kw)
    );

    // Insert missing keywords into Skills/Tools section or create one
    let newResumeText = insertKeywordsIntoSkillsSection(resumeText, missingKeywords);

    // Generate a new Word file
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(newResumeText)],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    // Create personalized filename
    let filename = "optimized_resume.docx";
    if (companyName.trim() && jobRole.trim()) {
      // Clean the filename to remove invalid characters
      const safeCompany = companyName.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
      const safeRole = jobRole.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
      filename = `${safeCompany} ${safeRole} Resume.docx`;
    }

    // Send the new file as a download
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});