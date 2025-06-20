from flask import Flask, request, send_file, jsonify
from docx import Document
import tempfile
import os
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

# Predefined technical keywords by category (all in lowercase for matching)
TECHNICAL_KEYWORDS = {
    'programming_languages': {
        'python', 'java', 'javascript', 'js', 'typescript', 'ts', 'c++', 'c#', 'ruby', 'php', 'swift',
        'kotlin', 'go', 'golang', 'rust', 'scala', 'r', 'matlab', 'sql', 'perl', 'shell', 'bash'
    },
    'web_technologies': {
        'html', 'css', 'sass', 'less', 'react', 'angular', 'vue', 'node.js', 'nodejs', 'express',
        'django', 'flask', 'spring', 'asp.net', 'jquery', 'bootstrap', 'tailwind'
    },
    'databases': {
        'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'sql server', 'dynamodb',
        'cassandra', 'elasticsearch', 'neo4j', 'mariadb'
    },
    'cloud_platforms': {
        'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 'firebase',
        'cloudflare', 'vercel', 'netlify'
    },
    'data_science': {
        'pandas', 'numpy', 'scipy', 'scikit-learn', 'sklearn', 'tensorflow', 'pytorch', 'keras',
        'matplotlib', 'seaborn', 'plotly', 'tableau', 'power bi', 'jupyter', 'spss', 'sas'
    },
    'tools_and_platforms': {
        'git', 'docker', 'kubernetes', 'jenkins', 'jira', 'confluence', 'bitbucket', 'github',
        'gitlab', 'terraform', 'ansible', 'vagrant', 'postman', 'swagger', 'snowflake'
    },
    'machine_learning': {
        'nlp', 'computer vision', 'deep learning', 'neural networks', 'machine learning',
        'ai', 'artificial intelligence', 'data mining', 'regression', 'classification'
    }
}

# Flatten the keywords for easier searching
ALL_KEYWORDS = {keyword.lower() for category in TECHNICAL_KEYWORDS.values() for keyword in category}

def find_keyword_with_original_case(text, keyword_lower):
    """Find the keyword in the text and return it with its original case"""
    pattern = r'\b' + re.escape(keyword_lower) + r'\b'
    match = re.search(pattern, text.lower())
    if match:
        start, end = match.span()
        # Return the original casing from the text
        return text[start:end]
    return keyword_lower

def extract_technical_keywords(text):
    found_keywords = {}  # Dictionary to store keyword: original_case pairs
    
    # First, look for exact matches
    for keyword in ALL_KEYWORDS:
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, text.lower()):
            # Store the original case version
            original_case = find_keyword_with_original_case(text, keyword)
            found_keywords[keyword] = original_case
    
    # Look for specific patterns
    skill_patterns = [
        r'proficient in\s+([\w\s,]+)',
        r'experience with\s+([\w\s,]+)',
        r'knowledge of\s+([\w\s,]+)',
        r'skills?:\s*([\w\s,]+)',
        r'technologies?:\s*([\w\s,]+)',
        r'languages?:\s*([\w\s,]+)',
        r'frameworks?:\s*([\w\s,]+)',
        r'tools?:\s*([\w\s,]+)',
        r'platforms?:\s*([\w\s,]+)'
    ]
    
    for pattern in skill_patterns:
        matches = re.finditer(pattern, text.lower())
        for match in matches:
            skills_text = match.group(1)
            terms = re.split(r'[,;/\s]+', skills_text)
            for term in terms:
                term = term.strip()
                if term in ALL_KEYWORDS:
                    original_case = find_keyword_with_original_case(text, term)
                    found_keywords[term] = original_case
    
    # Sort keywords by their order of appearance in the original text
    # and return the original case versions
    sorted_keywords = sorted(found_keywords.values(), 
                           key=lambda x: text.lower().index(x.lower()))
    
    return sorted_keywords

def categorize_keywords(keywords):
    """Categorize keywords into different types based on our predefined categories"""
    categorized = {
        'programming_languages': [],
        'web_technologies': [],
        'databases': [],
        'cloud_platforms': [],
        'data_science': [],
        'tools_and_platforms': [],
        'machine_learning': []
    }
    
    for keyword in keywords:
        keyword_lower = keyword.lower()
        for category, keyword_set in TECHNICAL_KEYWORDS.items():
            if keyword_lower in keyword_set:
                categorized[category].append(keyword)
                break
    
    return categorized

def find_section_paragraphs(doc):
    """Find existing sections in the document and return their paragraph indices"""
    sections = {}
    for i, para in enumerate(doc.paragraphs):
        text_upper = para.text.upper().strip()
        if 'SKILLS' in text_upper:
            sections['skills'] = i
        elif 'TOOLS' in text_upper:
            sections['tools'] = i
        elif 'FRAMEWORKS' in text_upper:
            sections['frameworks'] = i
        elif 'TECHNOLOGIES' in text_upper:
            sections['technologies'] = i
    
    return sections

def insert_keywords_into_sections(doc, missing_keywords):
    if not missing_keywords:
        return doc
    
    # Categorize the keywords
    categorized = categorize_keywords(missing_keywords)
    
    # Find existing sections
    sections = find_section_paragraphs(doc)
    
    # Define which categories go to which sections (prioritized order)
    section_mapping = {
        'frameworks': ['web_technologies'],  # Web frameworks go to frameworks section first
        'tools': ['tools_and_platforms'],    # Tools go to tools section
        'technologies': ['cloud_platforms'], # Cloud platforms go to technologies
        'skills': ['programming_languages', 'databases', 'data_science', 'machine_learning']  # Everything else goes to skills
    }
    
    # Track which keywords have been placed to avoid duplicates
    placed_keywords = set()
    
    # If we have specific sections, use them in priority order
    if sections:
        for section_name in ['frameworks', 'tools', 'technologies', 'skills']:
            if section_name in sections:
                section_index = sections[section_name]
                if section_name in section_mapping:
                    # Get keywords that should go to this section
                    relevant_categories = section_mapping[section_name]
                    section_keywords = []
                    for category in relevant_categories:
                        for keyword in categorized[category]:
                            if keyword not in placed_keywords:
                                section_keywords.append(keyword)
                                placed_keywords.add(keyword)
                    
                    if section_keywords:
                        # Find the skills list paragraph (next non-empty paragraph after header)
                        for i in range(section_index + 1, len(doc.paragraphs)):
                            para = doc.paragraphs[i]
                            if para.text.strip():  # Found the skills list
                                para.text = para.text.strip() + ', ' + ', '.join(section_keywords)
                                break
    
    # If no specific sections found or if we still have unplaced keywords, put them in Skills
    remaining_keywords = [kw for kw in missing_keywords if kw not in placed_keywords]
    if remaining_keywords:
        skills_found = False
        for para in doc.paragraphs:
            if skills_found:
                if para.text.strip():
                    para.text = para.text.strip() + ', ' + ', '.join(remaining_keywords)
                    break
            elif 'SKILLS' in para.text.upper():
                skills_found = True
                continue
    
    return doc

@app.route('/optimize-docx', methods=['POST'])
def optimize_docx():
    if 'resume' not in request.files or 'jobDescription' not in request.form:
        return jsonify({'error': 'Missing file or job description'}), 400

    resume_file = request.files['resume']
    job_description = request.form['jobDescription']
    company_name = request.form.get('companyName', '').strip()
    job_role = request.form.get('jobRole', '').strip()

    # Save uploaded file to a temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        resume_file.save(tmp.name)
        doc = Document(tmp.name)

    # Extract all text for keyword matching
    full_text = '\n'.join([p.text for p in doc.paragraphs])
    
    # Use the new technical keyword extraction that preserves case
    keywords = extract_technical_keywords(job_description)
    missing_keywords = [kw for kw in keywords if kw.lower() not in full_text.lower()]

    # Insert missing keywords into existing Skills section
    doc = insert_keywords_into_sections(doc, missing_keywords)

    # Save new docx to temp file
    out_fd, out_path = tempfile.mkstemp(suffix='.docx')
    os.close(out_fd)
    doc.save(out_path)

    # Create personalized filename
    if company_name and job_role:
        # Clean the filename to remove invalid characters
        safe_company = "".join(c for c in company_name if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_role = "".join(c for c in job_role if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_company} {safe_role} Resume.docx"
    else:
        filename = "optimized_resume.docx"

    # Send file back with personalized filename
    return send_file(out_path, as_attachment=True, download_name=filename)

if __name__ == '__main__':
    app.run(port=8000, debug=True)