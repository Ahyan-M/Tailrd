from flask import Flask, request, send_file, jsonify
from docx.api import Document
import tempfile
import os
from flask_cors import CORS
import re
import io
import json
from docx.shared import Pt
import string

app = Flask(__name__)
CORS(app)

# ATS Scoring weights and criteria
ATS_CRITERIA = {
    'keyword_match': 0.70,  # 60% - How well keywords match job description (increased from 35%)
    'formatting': 0.10,     # 20% - Clean formatting, proper sections (decreased from 25%)
    'content_quality': 0.20, # 15% - Professional language, achievements (decreased from 20%)
    'structure': 0.00,      # 5% - Proper resume structure (decreased from 15%)
    'length': 0.00          # 0% - Length is less important for optimization (decreased from 5%)
}

# ATS-friendly formatting requirements
ATS_FORMATTING_REQUIREMENTS = {
    'sections': ['experience', 'education', 'skills', 'summary', 'objective'],
    'avoid_elements': ['tables', 'images', 'charts', 'headers', 'footers', 'columns'],
    'preferred_fonts': ['arial', 'calibri', 'times new roman', 'georgia'],
    'max_length': 2000,  # words
    'min_length': 200    # words
}

# Predefined technical keywords by category (all in lowercase for matching)
TECHNICAL_KEYWORDS = {
    'programming_languages': {
        'python', 'java', 'javascript', 'js', 'typescript', 'ts', 'c++', 'c#', 'ruby', 'php', 'swift',
        'kotlin', 'go', 'golang', 'rust', 'scala', 'r', 'matlab', 'sql', 'perl', 'shell', 'bash',
        'dart', 'elixir', 'haskell', 'lua', 'assembly', 'fortran', 'cobol', 'ada', 'groovy', 'clojure',
        'c', 'f#', 'ocaml', 'erlang', 'julia', 'nim', 'crystal', 'zig', 'v', 'odin', 'pony'
    },
    'web_technologies': {
        'html', 'css', 'sass', 'less', 'react', 'angular', 'vue', 'node.js', 'nodejs', 'express',
        'django', 'flask', 'spring', 'asp.net', 'jquery', 'bootstrap', 'tailwind',
        'next.js', 'nuxt.js', 'svelte', 'sveltekit', 'astro', 'remix', 'gatsby', 'webpack', 'vite',
        'rollup', 'esbuild', 'parcel', 'graphql', 'apollo', 'prisma', 'sequelize', 'typeorm',
        'nestjs', 'fastapi', 'fastify', 'hapi', 'koa', 'web3', 'solidity', 'ethers.js', 'web3.js',
        'stripe', 'twilio', 'sendgrid', 'mailgun', 'socket.io', 'ws', 'websocket'
    },
    'databases': {
        'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'sql server', 'dynamodb',
        'cassandra', 'elasticsearch', 'neo4j', 'mariadb', 'cockroachdb', 'timescaledb', 'influxdb',
        'clickhouse', 'snowflake', 'bigquery', 'redshift', 'databricks', 'hive', 'hbase', 'couchdb',
        'rethinkdb', 'arangodb', 'fauna', 'supabase', 'planetscale', 'firebase', 'appwrite'
    },
    'cloud_platforms': {
        'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 'firebase',
        'cloudflare', 'vercel', 'netlify', 'alibaba cloud', 'oracle cloud', 'ibm cloud',
        'linode', 'vultr', 'render', 'railway', 'fly.io', 'supabase', 'appwrite', 'hasura',
        'stripe', 'twilio', 'sendgrid', 'mailgun', 'auth0', 'okta', 'cognito'
    },
    'data_science': {
        'pandas', 'numpy', 'scipy', 'scikit-learn', 'sklearn', 'tensorflow', 'pytorch', 'keras',
        'matplotlib', 'seaborn', 'plotly', 'tableau', 'power bi', 'jupyter', 'spss', 'sas',
        'opencv', 'pillow', 'statsmodels', 'xgboost', 'lightgbm', 'catboost', 'fastai',
        'transformers', 'spacy', 'nltk', 'gensim', 'word2vec', 'bert', 'gpt', 'llama',
        'streamlit', 'gradio', 'mlflow', 'kubeflow', 'ray', 'dask', 'vaex', 'modin', 'rapids'
    },
    'tools_and_platforms': {
        'git', 'docker', 'kubernetes', 'jenkins', 'jira', 'confluence', 'bitbucket', 'github',
        'gitlab', 'terraform', 'ansible', 'vagrant', 'postman', 'swagger', 'snowflake',
        'helm', 'istio', 'linkerd', 'prometheus', 'grafana', 'elk stack', 'elasticsearch',
        'logstash', 'kibana', 'splunk', 'datadog', 'newrelic', 'sentry', 'rollbar',
        'circleci', 'github actions', 'gitlab ci', 'travis ci', 'azure devops', 'teamcity',
        'bamboo', 'sonarqube', 'codecov', 'coveralls', 'semaphore', 'appveyor', 'wercker',
        'drone', 'concourse', 'spinnaker', 'argo', 'tekton', 'skaffold', 'tilt', 'lens',
        'rancher', 'openshift', 'minikube', 'kind', 'k3s', 'microk8s', 'kubectl', 'kustomize',
        'operator-sdk', 'crossplane', 'pulumi', 'cloudformation', 'serverless'
    },
    'machine_learning': {
        'nlp', 'computer vision', 'deep learning', 'neural networks', 'machine learning',
        'ai', 'artificial intelligence', 'data mining', 'regression', 'classification',
        'reinforcement learning', 'supervised learning', 'unsupervised learning',
        'semi-supervised learning', 'transfer learning', 'federated learning', 'active learning',
        'ensemble learning', 'bayesian optimization', 'hyperparameter tuning', 'feature engineering',
        'feature selection', 'dimensionality reduction', 'clustering', 'anomaly detection',
        'recommendation systems', 'natural language processing', 'speech recognition',
        'sentiment analysis', 'object detection', 'image segmentation', 'text classification',
        'named entity recognition', 'machine translation', 'question answering', 'text summarization',
        'generative adversarial networks', 'variational autoencoders', 'attention mechanisms',
        'transformers', 'cnn', 'rnn', 'lstm', 'gru', 'autoencoder', 'boltzmann machine',
        'hopfield network', 'self-organizing map', 'radial basis function', 'perceptron',
        'multilayer perceptron', 'backpropagation', 'gradient descent', 'stochastic gradient descent',
        'adam', 'rmsprop', 'adagrad', 'momentum', 'nesterov momentum', 'learning rate scheduling',
        'early stopping', 'dropout', 'batch normalization', 'weight decay', 'data augmentation',
        'cross-validation', 'k-fold cross-validation', 'stratified k-fold', 'leave-one-out',
        'bootstrap', 'precision', 'recall', 'f1-score', 'auc', 'roc curve', 'confusion matrix',
        'mean squared error', 'mean absolute error', 'r-squared', 'adjusted r-squared',
        'log loss', 'hinge loss', 'cross-entropy loss', 'kullback-leibler divergence',
        'jensen-shannon divergence', 'wasserstein distance', 'earth mover\'s distance',
        'hausdorff distance', 'chamfer distance', 'iou', 'dice coefficient', 'perplexity',
        'bleu score', 'rouge score', 'meteor score', 'cider score', 'spice score',
        'bert score', 'mover score', 'word mover\'s distance', 'cosine similarity',
        'euclidean distance', 'manhattan distance', 'chebyshev distance', 'minkowski distance',
        'mahalanobis distance', 'jaccard similarity', 'dice similarity', 'overlap coefficient',
        'sorensen-dice coefficient', 'tversky index', 'tanimoto coefficient', 'pearson correlation',
        'spearman correlation', 'kendall correlation', 'mutual information', 'entropy',
        'cross-entropy', 'kl divergence', 'js divergence'
    },
    'mobile_development': {
        'react native', 'flutter', 'xamarin', 'ionic', 'cordova', 'phonegap', 'objective-c',
        'dart', 'swift', 'kotlin', 'java', 'android studio', 'xcode', 'app store',
        'google play', 'firebase mobile', 'onesignal', 'push notifications', 'mobile testing',
        'appium', 'detox', 'fastlane', 'codemagic', 'bitrise', 'appcenter'
    },
    'game_development': {
        'unity', 'unreal engine', 'godot', 'cryengine', 'lumberyard', 'opengl', 'directx',
        'vulkan', 'metal', 'webgl', 'three.js', 'babylon.js', 'playcanvas', 'aframe',
        'phaser', 'pixi.js', 'matter.js', 'cannon.js', 'ammo.js', 'box2d', 'chipmunk',
        'monogame', 'libgdx', 'sfml', 'sdl', 'allegro', 'love2d', 'defold', 'corona',
        'cocos2d', 'spritekit', 'scenekit', 'metal performance shaders', 'compute shaders',
        'vertex shaders', 'fragment shaders', 'geometry shaders', 'tessellation shaders'
    },
    'blockchain_web3': {
        'ethereum', 'bitcoin', 'solidity', 'web3', 'ethers.js', 'web3.js', 'hardhat',
        'truffle', 'ganache', 'metamask', 'ipfs', 'polygon', 'binance smart chain',
        'cardano', 'polkadot', 'cosmos', 'solana', 'avalanche', 'chainlink', 'uniswap',
        'opensea', 'nft', 'defi', 'dao', 'smart contracts', 'consensus mechanisms',
        'proof of work', 'proof of stake', 'delegated proof of stake', 'proof of authority',
        'proof of space', 'proof of time', 'proof of capacity', 'proof of burn',
        'proof of activity', 'proof of importance', 'proof of reputation', 'proof of identity',
        'proof of location', 'proof of bandwidth', 'proof of storage', 'proof of computation',
        'proof of learning', 'proof of human', 'proof of brain', 'layer 1', 'layer 2',
        'sidechains', 'rollups', 'optimistic rollups', 'zk rollups', 'plasma', 'state channels',
        'lightning network', 'liquid network', 'atomic swaps', 'cross-chain bridges',
        'oracles', 'decentralized exchanges', 'automated market makers', 'yield farming',
        'liquidity mining', 'staking', 'governance tokens', 'utility tokens', 'security tokens',
        'stablecoins', 'wrapped tokens', 'token standards', 'erc-20', 'erc-721', 'erc-1155',
        'bep-20', 'bep-721', 'bep-1155', 'spl tokens', 'fungible tokens', 'non-fungible tokens',
        'semi-fungible tokens', 'tokenomics', 'token distribution', 'token vesting',
        'token burning', 'token minting', 'token staking', 'token farming', 'token swapping',
        'token lending', 'token borrowing', 'token insurance', 'token derivatives',
        'token options', 'token futures', 'token perpetuals', 'token options', 'token futures',
        'token perpetuals', 'token options', 'token futures', 'token perpetuals'
    }
}

# Flatten the keywords for easier searching
ALL_KEYWORDS = {keyword.lower() for category in TECHNICAL_KEYWORDS.values() for keyword in category}

# --- Industry-specific best-practice keyword lists ---
INDUSTRY_KEYWORDS = {
    'software_engineering': [
        # Languages
        'Python', 'Java', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Ruby', 'Kotlin', 'Swift',
        # Frameworks/Tools
        'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask', 'Spring', 'Express', 'Docker', 'Kubernetes',
        'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'REST', 'GraphQL', 'Microservices', 'Agile', 'Scrum',
        # Practices
        'Unit Testing', 'TDD', 'OOP', 'Design Patterns', 'DevOps', 'Cloud', 'API Development', 'Version Control',
        # Soft skills
        'Collaboration', 'Problem Solving', 'Communication'
    ],
    'data_analytics': [
        # Languages/Tools
        'Python', 'R', 'SQL', 'Excel', 'Tableau', 'Power BI', 'Looker', 'SAS', 'SPSS', 'Jupyter',
        # Libraries
        'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Scikit-learn', 'TensorFlow', 'PyTorch',
        # Concepts
        'Data Visualization', 'Data Cleaning', 'Data Mining', 'Statistical Analysis', 'ETL', 'Big Data',
        'Machine Learning', 'Predictive Modeling', 'Regression', 'Classification', 'A/B Testing',
        # Soft skills
        'Attention to Detail', 'Critical Thinking', 'Storytelling', 'Business Acumen'
    ],
    'finance': [
        # Concepts
        'Financial Analysis', 'Budgeting', 'Forecasting', 'Variance Analysis', 'Financial Modeling',
        'Valuation', 'Mergers & Acquisitions', 'Risk Management', 'Portfolio Management', 'Asset Allocation',
        # Tools
        'Excel', 'Bloomberg', 'QuickBooks', 'SAP', 'Oracle', 'Power BI', 'Tableau',
        # Regulations
        'GAAP', 'IFRS', 'SOX', 'Compliance',
        # Soft skills
        'Analytical Skills', 'Attention to Detail', 'Communication', 'Stakeholder Management'
    ]
}

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
        r'proficient in\s+([\w\s,;&]+)',
        r'experience with\s+([\w\s,;&]+)',
        r'knowledge of\s+([\w\s,;&]+)',
        r'skills?:\s*([\w\s,;&]+)',
        r'technologies?:\s*([\w\s,;&]+)',
        r'languages?:\s*([\w\s,;&]+)',
        r'frameworks?:\s*([\w\s,;&]+)',
        r'tools?:\s*([\w\s,;&]+)',
        r'platforms?:\s*([\w\s,;&]+)'
    ]
    
    for pattern in skill_patterns:
        matches = re.finditer(pattern, text.lower())
        for match in matches:
            skills_text = match.group(1)
            # Split on comma, semicolon, slash, ' and ', ' & ', and whitespace
            terms = re.split(r'[;,/]|\band\b|\&|\s+', skills_text)
            for term in terms:
                term = term.strip()
                if term and term in ALL_KEYWORDS:
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
        # More specific matching to avoid false positives
        if text_upper == 'SKILLS':
            sections['skills'] = i
        elif 'TOOLS' in text_upper and len(text_upper) < 20:  # Avoid matching "Tools/Frameworks:"
            sections['tools'] = i
        elif 'FRAMEWORKS' in text_upper and len(text_upper) < 20:
            sections['frameworks'] = i
        elif 'TECHNOLOGIES' in text_upper and len(text_upper) < 20:
            sections['technologies'] = i
    
    return sections

def insert_keywords_into_sections(doc, missing_keywords):
    if not missing_keywords:
        return doc

    def insert_after_header(header_variations):
        idx = None
        for i, para in enumerate(doc.paragraphs):
            text_upper = para.text.strip().upper()
            # Check for various header variations
            for header in header_variations:
                if header in text_upper and len(text_upper) < 30:  # Avoid matching text within sentences
                    idx = i
                    break
            if idx is not None:
                break
        
        if idx is not None:
            # Look for the next paragraph that contains skills/keywords
            for j in range(idx + 1, len(doc.paragraphs)):
                para = doc.paragraphs[j]
                text = para.text.strip()
                if text and (',' in text or '/' in text or '&' in text or ' and ' in text):
                    add_keywords_with_style(para, missing_keywords)
                    return True  # Successfully added keywords
            # If no suitable paragraph found, add keywords to the header paragraph itself
            if idx < len(doc.paragraphs) - 1:
                next_para = doc.paragraphs[idx + 1]
                if not next_para.text.strip():  # Empty paragraph
                    add_keywords_with_style(next_para, missing_keywords)
                    return True
        return False

    # Try different section header variations
    skills_headers = ["SKILLS", "TECHNICAL SKILLS", "SKILLS & EXPERTISE", "COMPETENCIES", "EXPERTISE"]
    tools_headers = ["TOOLS", "TECHNOLOGIES", "TECHNICAL TOOLS", "SOFTWARE", "PLATFORMS"]
    frameworks_headers = ["FRAMEWORKS", "LIBRARIES", "TECHNOLOGIES", "TECH STACK"]
    
    # Try to insert keywords in order of preference
    if insert_after_header(skills_headers):
        return doc
    if insert_after_header(tools_headers):
        return doc
    if insert_after_header(frameworks_headers):
        return doc
    
    # If no suitable section found, add a new Skills section at the end
    if missing_keywords:
        # Add a blank line first
        doc.add_paragraph("")
        # Add Skills header
        skills_header = doc.add_paragraph("Skills:")
        skills_header.style.font.name = 'Calibri'
        skills_header.style.font.size = Pt(11)
        skills_header.style.font.bold = True
        # Add keywords
        skills_para = doc.add_paragraph(", ".join(missing_keywords))
        skills_para.style.font.name = 'Calibri'
        skills_para.style.font.size = Pt(11)
    
    return doc

def docx_to_text(doc):
    """Convert DOCX document to plain text format"""
    text_content = []
    
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if text:
            text_content.append(text)
    
    return '\n\n'.join(text_content)

def create_export_filename(company_name, job_role, format_type):
    """Create a filename for the exported file"""
    if company_name and job_role:
        # Clean the filename to remove invalid characters
        safe_company = "".join(c for c in company_name if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_role = "".join(c for c in job_role if c.isalnum() or c in (' ', '-', '_')).strip()
        return f"{safe_company} {safe_role} Resume.{format_type}"
    else:
        return f"optimized_resume.{format_type}"

def add_keywords_with_style(paragraph, keywords):
    """Add keywords to a paragraph by appending them to existing text with proper formatting."""
    if not keywords:
        return
    
    original_text = paragraph.text.strip()
    
    # FIRST: Detect the user's preferred separator style
    separator = ' and '  # default
    if ' & ' in original_text:
        separator = ' & '
    elif ' and ' in original_text:
        separator = ' and '
    
    # SECOND: Clean the original text by removing all 'and' and '&' separators
    # Replace ' and ' and ' & ' with commas, then split
    cleaned_text = re.sub(r'\s+(?:and|&)\s+', ', ', original_text)
    
    # Extract existing skills by splitting on ALL possible separators
    existing_skills = []
    if cleaned_text:
        # Split on comma, semicolon, slash
        parts = re.split(r'[;,/]', cleaned_text)
        existing_skills = [part.strip() for part in parts if part.strip()]
    
    # Combine existing and new keywords, avoiding duplicates
    all_skills = existing_skills[:]
    for kw in keywords:
        if kw.lower() not in [s.lower() for s in all_skills]:
            all_skills.append(kw)
    
    if len(all_skills) == 0:
        return
    
    # Format the final string - ALWAYS use comma between all except last, user's separator before last
    if len(all_skills) == 1:
        final_text = all_skills[0]
    elif len(all_skills) == 2:
        final_text = all_skills[0] + separator + all_skills[1]
    else:
        # Multiple skills: comma between all except last, user's separator before last
        final_text = ', '.join(all_skills[:-1]) + separator + all_skills[-1]
    
    # Update the paragraph text
    if paragraph.runs:
        paragraph.runs[0].text = final_text
        # Clear any additional runs
        for run in paragraph.runs[1:]:
            run.text = ''
    else:
        run = paragraph.add_run(final_text)
        run.font.name = 'Calibri'
        run.font.size = Pt(11)

@app.route('/optimize-docx', methods=['POST'])
def optimize_docx():
    if 'resume' not in request.files or 'jobDescription' not in request.form:
        return jsonify({'error': 'Missing file or job description'}), 400

    resume_file = request.files['resume']
    job_description = request.form['jobDescription']
    company_name = request.form.get('companyName', '').strip()
    job_role = request.form.get('jobRole', '').strip()
    export_format = request.form.get('exportFormat', 'docx').lower()

    # Save uploaded file to a temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        resume_file.save(tmp.name)
        doc = Document(tmp.name)

    # Extract all text for keyword matching and ATS scoring
    full_text = '\n'.join([p.text for p in doc.paragraphs])
    
    # Calculate original ATS score
    original_ats_score = calculate_ats_score(full_text, job_description)
    
    # Use the new technical keyword extraction that preserves case
    keywords = extract_technical_keywords(job_description)
    missing_keywords = [kw for kw in keywords if kw.lower() not in full_text.lower()]

    # Insert missing keywords into existing Skills section
    doc = insert_keywords_into_sections(doc, missing_keywords)
    
    # Get optimized text for ATS scoring
    optimized_text = '\n'.join([p.text for p in doc.paragraphs])
    
    # Calculate optimized ATS score
    optimized_ats_score = calculate_ats_score(optimized_text, job_description, original_ats_score['total_score'])

    # Handle different export formats
    if export_format == 'txt':
        # Convert to plain text
        text_content = docx_to_text(doc)
        text_buffer = io.BytesIO()
        text_buffer.write(text_content.encode('utf-8'))
        text_buffer.seek(0)
        filename = create_export_filename(company_name, job_role, 'txt')
        response = send_file(
            text_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='text/plain'
        )
    else:
        # Default: DOCX format
        out_fd, out_path = tempfile.mkstemp(suffix='.docx')
        os.close(out_fd)
        doc.save(out_path)
        filename = create_export_filename(company_name, job_role, 'docx')
        response = send_file(out_path, as_attachment=True, download_name=filename)

    # Add ATS scores to response headers for frontend access
    response.headers['X-Original-ATS-Score'] = str(original_ats_score['total_score'])
    response.headers['X-Optimized-ATS-Score'] = str(optimized_ats_score['total_score'])
    response.headers['X-ATS-Improvement'] = str(optimized_ats_score['improvement'])
    
    # Always return JSON with detailed ATS scores and file info
    return jsonify({
        'original_ats_score': original_ats_score,
        'optimized_ats_score': optimized_ats_score,
        'keywords': list(keywords.keys()) if isinstance(keywords, dict) else keywords,
        'missing_keywords': missing_keywords,
        'keywords_added': len(missing_keywords),
        'resumeText': optimized_text[:1000] + "..." if len(optimized_text) > 1000 else optimized_text,
        'download_ready': True,
        'message': f'Resume optimized successfully! Added {len(missing_keywords)} keywords. ATS score improved by {optimized_ats_score["improvement"]:.1f} points.',
        'debug_info': {
            'original_text_length': len(full_text),
            'optimized_text_length': len(optimized_text),
            'text_added': len(optimized_text) - len(full_text),
            'original_keyword_score': original_ats_score['keyword_score'],
            'optimized_keyword_score': optimized_ats_score['keyword_score'],
            'keyword_improvement': optimized_ats_score['keyword_score'] - original_ats_score['keyword_score']
        }
    })

@app.route('/export-formats', methods=['GET'])
def get_export_formats():
    """Return available export formats"""
    return jsonify({
        'formats': [
            {
                'value': 'docx',
                'label': 'Microsoft Word (.docx)',
                'description': 'Best for editing and ATS compatibility',
                'icon': '\ud83d\udcc4'
            },
            {
                'value': 'txt',
                'label': 'Plain Text (.txt)',
                'description': 'Simple text format for basic applications',
                'icon': '\ud83d\udcdd'
            }
        ]
    })

# --- Industry inference from job description ---
def infer_industry(job_description):
    """Infer the most likely industry from the job description."""
    scores = {k: 0 for k in INDUSTRY_KEYWORDS}
    text = job_description.lower()
    
    # Count keyword matches for each industry
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text:
                scores[industry] += 1
    
    # Also check for common industry terms
    industry_indicators = {
        'software_engineering': ['software', 'developer', 'programmer', 'engineer', 'coding', 'programming', 'web', 'mobile', 'app', 'frontend', 'backend', 'fullstack'],
        'data_analytics': ['data', 'analytics', 'analyst', 'business intelligence', 'bi', 'reporting', 'dashboard', 'kpi', 'metrics', 'statistics'],
        'finance': ['finance', 'financial', 'accounting', 'budget', 'forecast', 'investment', 'banking', 'trading', 'risk', 'compliance']
    }
    
    for industry, indicators in industry_indicators.items():
        for indicator in indicators:
            if indicator in text:
                scores[industry] += 1
    
    # Return the industry with the highest score, default to software_engineering if no clear match
    best_industry = max(scores.items(), key=lambda x: x[1])
    return best_industry[0] if best_industry[1] > 0 else 'software_engineering'

# --- Keyword importance scoring ---
def score_keywords(job_description, industry):
    """Return a dict of keyword: score, based on frequency and industry importance."""
    text = job_description.lower()
    industry_keywords = [kw.lower() for kw in INDUSTRY_KEYWORDS[industry]]
    scores = {}
    for kw in set(re.findall(r'\b\w[\w\+\#\.\-]*\b', job_description, re.IGNORECASE)):
        freq = text.count(kw.lower())
        importance = 2 if kw.lower() in industry_keywords else 1
        if freq > 0:
            scores[kw] = freq * importance
    return scores

# --- Suggest up to 6 high-impact, industry-specific keywords not already in the resume or job description ---
def suggest_extra_keywords(resume_text, job_description, industry, max_suggestions=6):
    # Normalize resume words: lowercase, remove punctuation
    resume_words = set([
        w.lower().strip(string.punctuation)
        for w in re.findall(r'\b\w[\w\+\#\.\-]*\b', resume_text)
    ])
    
    # Normalize job description words: lowercase, remove punctuation
    job_words = set([
        w.lower().strip(string.punctuation)
        for w in re.findall(r'\b\w[\w\+\#\.\-]*\b', job_description)
    ])
    
    # Use comprehensive technical keywords with proper case
    all_technical_keywords = []
    for category, keywords in TECHNICAL_KEYWORDS.items():
        all_technical_keywords.extend(keywords)
    
    # Also include industry-specific keywords (these already have proper case)
    industry_keywords = INDUSTRY_KEYWORDS.get(industry, [])
    all_keywords = all_technical_keywords + industry_keywords
    
    # Remove duplicates and filter out keywords already in resume OR job description
    suggestions = []
    seen = set()
    
    for kw in all_keywords:
        kw_lower = kw.lower().strip(string.punctuation)
        # Only suggest keywords that are NOT in resume AND NOT in job description
        if kw_lower not in resume_words and kw_lower not in job_words and kw_lower not in seen:
            # Use proper case for display - capitalize first letter and handle special cases
            if kw.lower() in ['python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue', 'node.js', 'django', 'flask', 'spring', 'express', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'sql', 'mongodb', 'redis', 'mysql', 'postgresql', 'html', 'css', 'php', 'ruby', 'swift', 'kotlin', 'go', 'rust', 'scala', 'r', 'matlab', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'tableau', 'power bi', 'jupyter', 'spark', 'hadoop', 'elasticsearch', 'neo4j', 'cassandra', 'dynamodb', 'firebase', 'heroku', 'vercel', 'netlify', 'github', 'gitlab', 'bitbucket', 'jenkins', 'circleci', 'travis ci', 'terraform', 'ansible', 'vagrant', 'postman', 'swagger', 'graphql', 'rest api', 'microservices', 'agile', 'scrum', 'devops', 'ci/cd', 'api development', 'database design', 'system architecture', 'performance optimization', 'security', 'testing', 'code review', 'version control', 'linux', 'shell scripting', 'cloud computing', 'machine learning', 'artificial intelligence', 'data science', 'big data', 'etl', 'data visualization', 'statistical analysis', 'predictive modeling', 'regression', 'classification', 'clustering', 'nlp', 'computer vision', 'deep learning', 'neural networks', 'natural language processing', 'sentiment analysis', 'object detection', 'image segmentation', 'text classification', 'named entity recognition', 'machine translation', 'question answering', 'text summarization', 'recommendation systems', 'anomaly detection', 'time series analysis', 'a/b testing', 'hypothesis testing', 'statistical modeling', 'data mining', 'feature engineering', 'model validation', 'cross-validation', 'hyperparameter tuning', 'ensemble learning', 'transfer learning', 'reinforcement learning', 'unsupervised learning', 'supervised learning', 'semi-supervised learning', 'federated learning', 'active learning', 'online learning', 'batch learning', 'incremental learning', 'meta-learning', 'multi-task learning', 'few-shot learning', 'zero-shot learning', 'one-shot learning', 'curriculum learning', 'self-supervised learning', 'contrastive learning', 'generative adversarial networks', 'variational autoencoders', 'attention mechanisms', 'backpropagation', 'gradient descent', 'stochastic gradient descent', 'learning rate scheduling', 'early stopping', 'batch normalization', 'weight decay', 'data augmentation', 'k-fold cross-validation', 'stratified k-fold', 'leave-one-out', 'precision', 'recall', 'f1-score', 'roc curve', 'confusion matrix', 'mean squared error', 'mean absolute error', 'r-squared', 'adjusted r-squared', 'log loss', 'hinge loss', 'cross-entropy loss', 'kullback-leibler divergence', 'jensen-shannon divergence', 'wasserstein distance', 'earth mover\'s distance', 'hausdorff distance', 'chamfer distance', 'dice coefficient', 'bleu score', 'rouge score', 'meteor score', 'cider score', 'spice score', 'bert score', 'mover score', 'word mover\'s distance', 'cosine similarity', 'euclidean distance', 'manhattan distance', 'chebyshev distance', 'minkowski distance', 'mahalanobis distance', 'jaccard similarity', 'dice similarity', 'overlap coefficient', 'sorensen-dice coefficient', 'tversky index', 'tanimoto coefficient', 'pearson correlation', 'spearman correlation', 'kendall correlation', 'mutual information', 'cross-entropy', 'kl divergence', 'js divergence']:
                # Use proper case for common technical terms
                display_kw = kw.title()
            elif kw.lower() in ['ci/cd', 'rest api', 'api development', 'database design', 'system architecture', 'performance optimization', 'version control', 'shell scripting', 'cloud computing', 'machine learning', 'artificial intelligence', 'data science', 'big data', 'data visualization', 'statistical analysis', 'predictive modeling', 'natural language processing', 'sentiment analysis', 'object detection', 'image segmentation', 'text classification', 'named entity recognition', 'machine translation', 'question answering', 'text summarization', 'recommendation systems', 'anomaly detection', 'time series analysis', 'a/b testing', 'hypothesis testing', 'statistical modeling', 'data mining', 'feature engineering', 'model validation', 'cross-validation', 'hyperparameter tuning', 'ensemble learning', 'transfer learning', 'reinforcement learning', 'unsupervised learning', 'supervised learning', 'semi-supervised learning', 'federated learning', 'active learning', 'online learning', 'batch learning', 'incremental learning', 'meta-learning', 'multi-task learning', 'few-shot learning', 'zero-shot learning', 'one-shot learning', 'curriculum learning', 'self-supervised learning', 'contrastive learning', 'generative adversarial networks', 'variational autoencoders', 'attention mechanisms', 'backpropagation', 'gradient descent', 'stochastic gradient descent', 'learning rate scheduling', 'early stopping', 'batch normalization', 'weight decay', 'data augmentation', 'k-fold cross-validation', 'stratified k-fold', 'leave-one-out', 'precision', 'recall', 'f1-score', 'roc curve', 'confusion matrix', 'mean squared error', 'mean absolute error', 'r-squared', 'adjusted r-squared', 'log loss', 'hinge loss', 'cross-entropy loss', 'kullback-leibler divergence', 'jensen-shannon divergence', 'wasserstein distance', 'earth mover\'s distance', 'hausdorff distance', 'chamfer distance', 'dice coefficient', 'bleu score', 'rouge score', 'meteor score', 'cider score', 'spice score', 'bert score', 'mover score', 'word mover\'s distance', 'cosine similarity', 'euclidean distance', 'manhattan distance', 'chebyshev distance', 'minkowski distance', 'mahalanobis distance', 'jaccard similarity', 'dice similarity', 'overlap coefficient', 'sorensen-dice coefficient', 'tversky index', 'tanimoto coefficient', 'pearson correlation', 'spearman correlation', 'kendall correlation', 'mutual information', 'cross-entropy', 'kl divergence', 'js divergence']:
                # Use proper case for multi-word terms
                display_kw = ' '.join(word.title() for word in kw.split())
            else:
                # For other terms, just capitalize first letter
                display_kw = kw.title()
            
            suggestions.append(display_kw)
            seen.add(kw_lower)
            if len(suggestions) >= max_suggestions:
                break
    
    # If we don't have enough suggestions, add some common technical terms with proper case
    if len(suggestions) < max_suggestions:
        common_tech_terms = [
            'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'REST API', 'GraphQL',
            'Microservices', 'Agile', 'Scrum', 'DevOps', 'Cloud Computing', 'API Development',
            'Database Design', 'System Architecture', 'Performance Optimization', 'Security',
            'Testing', 'Code Review', 'Version Control', 'Linux', 'Shell Scripting'
        ]
        
        for term in common_tech_terms:
            term_lower = term.lower().strip(string.punctuation)
            if term_lower not in resume_words and term_lower not in job_words and term_lower not in seen:
                suggestions.append(term)
                seen.add(term_lower)
                if len(suggestions) >= max_suggestions:
                    break
    
    return suggestions[:max_suggestions]

@app.route('/suggest-keywords', methods=['POST'])
def suggest_keywords():
    if 'resume' not in request.files or 'jobDescription' not in request.form:
        return jsonify({'error': 'Missing file or job description'}), 400
    resume_file = request.files['resume']
    job_description = request.form['jobDescription']
    # Save uploaded file to a temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        resume_file.save(tmp.name)
        doc = Document(tmp.name)
    resume_text = '\n'.join([p.text for p in doc.paragraphs])
    industry = infer_industry(job_description)
    suggestions = suggest_extra_keywords(resume_text, job_description, industry)
    
    # Add debug information
    resume_words = set([
        w.lower().strip(string.punctuation)
        for w in re.findall(r'\b\w[\w\+\#\.\-]*\b', resume_text)
    ])
    
    return jsonify({
        'industry': industry,
        'suggested_keywords': suggestions,
        'debug_info': {
            'resume_text_length': len(resume_text),
            'resume_words_count': len(resume_words),
            'suggestions_count': len(suggestions),
            'industry_keywords_available': len(INDUSTRY_KEYWORDS.get(industry, [])),
            'technical_keywords_total': sum(len(keywords) for keywords in TECHNICAL_KEYWORDS.values())
        }
    })

@app.route('/finalize-resume', methods=['POST'])
def finalize_resume():
    if 'resume' not in request.files or 'jobDescription' not in request.form or 'extraKeywords' not in request.form:
        return jsonify({'error': 'Missing file, job description, or extra keywords'}), 400
    resume_file = request.files['resume']
    job_description = request.form['jobDescription']
    extra_keywords = request.form.get('extraKeywords', '')
    company_name = request.form.get('companyName', '').strip()
    job_role = request.form.get('jobRole', '').strip()
    export_format = request.form.get('exportFormat', 'docx').lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        resume_file.save(tmp.name)
        doc = Document(tmp.name)

    full_text = '\n'.join([p.text for p in doc.paragraphs])
    
    # Calculate original ATS score
    original_ats_score = calculate_ats_score(full_text, job_description)
    
    job_keywords = extract_technical_keywords(job_description)
    missing_job_keywords = [kw for kw in job_keywords if kw.lower() not in full_text.lower()]
    extra_keywords_list = [s.strip() for s in re.split(r'[;,/]|\\band\\b|\\&', extra_keywords) if s.strip()]
    all_keywords = missing_job_keywords + extra_keywords_list
    unique_keywords = []
    seen = set()
    for kw in all_keywords:
        if kw.lower() not in seen:
            unique_keywords.append(kw)
            seen.add(kw.lower())
    doc = insert_keywords_into_sections(doc, unique_keywords)
    
    # Get final optimized text for ATS scoring
    final_text = '\n'.join([p.text for p in doc.paragraphs])
    
    # Calculate final optimized ATS score
    final_ats_score = calculate_ats_score(final_text, job_description, original_ats_score['total_score'])

    if export_format == 'txt':
        text_content = docx_to_text(doc)
        text_buffer = io.BytesIO()
        text_buffer.write(text_content.encode('utf-8'))
        text_buffer.seek(0)
        filename = create_export_filename(company_name, job_role, 'txt')
        response = send_file(
            text_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='text/plain'
        )
    else:
        out_fd, out_path = tempfile.mkstemp(suffix='.docx')
        os.close(out_fd)
        doc.save(out_path)
        filename = create_export_filename(company_name, job_role, 'docx')
        response = send_file(out_path, as_attachment=True, download_name=filename)
    
    # Add ATS scores to response headers
    response.headers['X-Original-ATS-Score'] = str(original_ats_score['total_score'])
    response.headers['X-Optimized-ATS-Score'] = str(final_ats_score['total_score'])
    response.headers['X-ATS-Improvement'] = str(final_ats_score['improvement'])
    
    return response

def calculate_ats_score(resume_text, job_description, original_score=None):
    """
    Calculate ATS score for a resume based on multiple criteria
    Returns a score between 0-100
    """
    if not resume_text or not job_description:
        return {
            'total_score': 0,
            'keyword_score': 0,
            'formatting_score': 0,
            'content_score': 0,
            'structure_score': 0,
            'length_score': 0,
            'improvement': 0
        }
    
    # Normalize text for analysis
    resume_lower = resume_text.lower()
    job_lower = job_description.lower()
    
    # 1. Keyword Match Score (35%)
    keyword_score = calculate_keyword_match_score(resume_lower, job_lower)
    
    # 2. Formatting Score (25%)
    formatting_score = calculate_formatting_score(resume_text)
    
    # 3. Content Quality Score (20%)
    content_score = calculate_content_quality_score(resume_text)
    
    # 4. Structure Score (15%)
    structure_score = calculate_structure_score(resume_text)
    
    # 5. Length Score (5%)
    length_score = calculate_length_score(resume_text)
    
    # Calculate weighted total score
    total_score = (
        keyword_score * ATS_CRITERIA['keyword_match'] +
        formatting_score * ATS_CRITERIA['formatting'] +
        content_score * ATS_CRITERIA['content_quality'] +
        structure_score * ATS_CRITERIA['structure'] +
        length_score * ATS_CRITERIA['length']
    )
    
    # Ensure score is between 0-100
    total_score = max(0, min(100, total_score))
    
    return {
        'total_score': round(total_score, 1),
        'keyword_score': round(keyword_score, 1),
        'formatting_score': round(formatting_score, 1),
        'content_score': round(content_score, 1),
        'structure_score': round(structure_score, 1),
        'length_score': round(length_score, 1),
        'improvement': round(total_score - (original_score or 0), 1) if original_score else 0
    }

def calculate_keyword_match_score(resume_text, job_description):
    """Calculate keyword matching score (0-100)"""
    # Extract keywords from job description
    job_keywords = extract_job_keywords(job_description)
    
    if not job_keywords:
        return 50  # Default score if no keywords found
    
    # Normalize resume text for matching
    resume_lower = resume_text.lower()
    
    # Count matched keywords with more robust matching
    matched_keywords = []
    for keyword in job_keywords:
        keyword_lower = keyword.lower()
        # Check for exact word boundary matches
        pattern = r'\b' + re.escape(keyword_lower) + r'\b'
        if re.search(pattern, resume_lower):
            matched_keywords.append(keyword)
        # Also check for partial matches (for multi-word keywords)
        elif keyword_lower in resume_lower:
            matched_keywords.append(keyword)
    
    # Calculate match percentage
    match_percentage = len(matched_keywords) / len(job_keywords)
    
    # More generous scoring - if we have a good number of keywords, give high scores
    if match_percentage >= 0.7:  # 70% or more keywords matched
        return 100
    elif match_percentage >= 0.5:  # 50% or more keywords matched
        return 90
    elif match_percentage >= 0.3:  # 30% or more keywords matched
        return 80
    elif match_percentage >= 0.2:  # 20% or more keywords matched
        return 70
    elif match_percentage >= 0.1:  # 10% or more keywords matched
        return 60
    else:
        return 40  # Minimum score even with few matches

def extract_job_keywords(job_description):
    """Extract important keywords from job description using the same comprehensive approach as extract_technical_keywords"""
    # Use the same comprehensive keyword extraction as extract_technical_keywords
    keywords = extract_technical_keywords(job_description)
    
    # Also extract additional keywords using the original approach for broader coverage
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
    
    # Extract words that are likely keywords (technical terms, skills, etc.)
    words = re.findall(r'\b[a-zA-Z]{3,}\b', job_description.lower())
    additional_keywords = []
    
    for word in words:
        if (word not in stop_words and 
            len(word) > 2 and 
            word in ALL_KEYWORDS):
            additional_keywords.append(word)
    
    # Also look for multi-word phrases
    phrases = re.findall(r'\b[a-zA-Z\s]{3,20}\b', job_description.lower())
    for phrase in phrases:
        phrase = phrase.strip()
        if len(phrase.split()) > 1 and any(keyword in phrase for keyword in ALL_KEYWORDS):
            additional_keywords.append(phrase)
    
    # Combine both approaches and remove duplicates
    all_keywords = list(keywords) + additional_keywords
    unique_keywords = []
    seen = set()
    for kw in all_keywords:
        if kw.lower() not in seen:
            unique_keywords.append(kw)
            seen.add(kw.lower())
    
    return unique_keywords[:30]  # Limit to top 30 keywords

def calculate_formatting_score(resume_text):
    """Calculate formatting score (0-100)"""
    score = 80  # Start with higher base score
    
    # Check for problematic elements
    problematic_patterns = [
        r'<table', r'<img', r'<chart', r'<header', r'<footer',
        r'columns?', r'text-align:\s*center', r'position:\s*absolute'
    ]
    
    for pattern in problematic_patterns:
        if re.search(pattern, resume_text, re.IGNORECASE):
            score -= 10  # Reduced penalty
    
    # Check for good formatting elements
    good_patterns = [
        r'\n\s*\n',  # Proper paragraph breaks
        r'[A-Z][a-z]+\s*:',  # Section headers
        r'\d{4}',  # Years (experience dates)
    ]
    
    for pattern in good_patterns:
        if re.search(pattern, resume_text):
            score += 5
    
    # Bonus for having skills section (common in optimized resumes)
    if re.search(r'skills?', resume_text, re.IGNORECASE):
        score += 10
    
    return max(0, min(100, score))

def calculate_content_quality_score(resume_text):
    """Calculate content quality score (0-100)"""
    score = 70  # Start with higher base score
    
    # Check for action verbs (good for resumes)
    action_verbs = [
        'developed', 'implemented', 'managed', 'created', 'designed', 'built',
        'improved', 'increased', 'decreased', 'led', 'coordinated', 'organized',
        'analyzed', 'researched', 'planned', 'executed', 'delivered', 'achieved',
        'maintained', 'optimized', 'streamlined', 'automated', 'integrated'
    ]
    
    action_verb_count = sum(1 for verb in action_verbs if verb in resume_text.lower())
    score += min(20, action_verb_count * 2)  # Reduced max points but higher base
    
    # Check for quantifiable achievements
    achievement_patterns = [
        r'\d+%', r'\d+\s*percent', r'\$\d+', r'\d+\s*dollars',
        r'increased by \d+', r'decreased by \d+', r'reduced by \d+',
        r'improved by \d+', r'grew by \d+', r'managed \d+'
    ]
    
    achievement_count = sum(1 for pattern in achievement_patterns if re.search(pattern, resume_text, re.IGNORECASE))
    score += min(10, achievement_count * 2)  # Reduced max points
    
    # Bonus for having technical keywords (indicates good content)
    technical_keywords = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes']
    tech_keyword_count = sum(1 for kw in technical_keywords if kw in resume_text.lower())
    score += min(10, tech_keyword_count * 2)
    
    return max(0, min(100, score))

def calculate_structure_score(resume_text):
    """Calculate structure score (0-100)"""
    score = 80  # Start with higher base score
    
    # Check for required sections
    required_sections = ['experience', 'education', 'skills']
    section_count = sum(1 for section in required_sections if section in resume_text.lower())
    score += section_count * 10  # Reduced points per section but higher base
    
    # Check for proper section headers
    header_patterns = [
        r'experience', r'education', r'skills', r'summary', r'objective',
        r'work history', r'employment', r'qualifications', r'achievements'
    ]
    
    header_count = sum(1 for pattern in header_patterns if re.search(pattern, resume_text, re.IGNORECASE))
    score += min(10, header_count * 2)  # Reduced max points
    
    return max(0, min(100, score))

def calculate_length_score(resume_text):
    """Calculate length score (0-100)"""
    word_count = len(resume_text.split())
    
    if ATS_FORMATTING_REQUIREMENTS['min_length'] <= word_count <= ATS_FORMATTING_REQUIREMENTS['max_length']:
        return 100
    elif word_count < ATS_FORMATTING_REQUIREMENTS['min_length']:
        # Penalize for being too short
        return max(0, 100 - (ATS_FORMATTING_REQUIREMENTS['min_length'] - word_count) * 2)
    else:
        # Penalize for being too long
        return max(0, 100 - (word_count - ATS_FORMATTING_REQUIREMENTS['max_length']) * 0.5)

def optimize_for_ats(resume_text, job_description, target_score=95):
    """
    Optimize resume text to achieve target ATS score
    Returns optimized text and new score
    """
    current_score = calculate_ats_score(resume_text, job_description)
    
    if current_score['total_score'] >= target_score:
        return resume_text, current_score
    
    # Extract missing keywords
    job_keywords = extract_job_keywords(job_description.lower())
    resume_lower = resume_text.lower()
    missing_keywords = [kw for kw in job_keywords if kw.lower() not in resume_lower]
    
    # Add missing keywords strategically
    optimized_text = resume_text
    
    # Add missing keywords to skills section or create one
    if missing_keywords:
        skills_section = "\n\nSkills:\n"
        skills_section += ", ".join(missing_keywords[:10])  # Limit to 10 keywords
        optimized_text += skills_section
    
    # Recalculate score
    new_score = calculate_ats_score(optimized_text, job_description, current_score['total_score'])
    
    return optimized_text, new_score

@app.route('/calculate-ats-score', methods=['POST'])
def calculate_ats_score_endpoint():
    """Calculate ATS score for uploaded resume"""
    try:
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided'}), 400
        
        resume_file = request.files['resume']
        job_description = request.form.get('jobDescription', '')
        
        if not job_description:
            return jsonify({'error': 'Job description is required'}), 400
        
        # Read the DOCX file
        doc = Document(resume_file)
        resume_text = docx_to_text(doc)
        
        # Calculate ATS score
        ats_score = calculate_ats_score(resume_text, job_description)
        
        return jsonify({
            'ats_score': ats_score,
            'resume_text': resume_text[:500] + "..." if len(resume_text) > 500 else resume_text
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/optimize-ats', methods=['POST'])
def optimize_ats_endpoint():
    """Optimize resume for ATS and return new score"""
    try:
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided'}), 400
        
        resume_file = request.files['resume']
        job_description = request.form.get('jobDescription', '')
        target_score = int(float(request.form.get('targetScore', 95)))
        
        if not job_description:
            return jsonify({'error': 'Job description is required'}), 400
        
        # Read the DOCX file
        doc = Document(resume_file)
        original_text = docx_to_text(doc)
        
        # Calculate original ATS score
        original_score = calculate_ats_score(original_text, job_description)
        
        # Optimize for ATS
        optimized_text, optimized_score = optimize_for_ats(original_text, job_description, target_score)
        
        # Create optimized document
        optimized_doc = Document()
        
        # Add optimized content
        for paragraph in optimized_text.split('\n'):
            if paragraph.strip():
                p = optimized_doc.add_paragraph(paragraph.strip())
                p.style.font.name = 'Calibri'
                p.style.font.size = Pt(11)
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.docx')
        optimized_doc.save(temp_file.name)
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name="ats_optimized_resume.docx",
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download-optimized', methods=['POST'])
def download_optimized():
    """Download the optimized resume file"""
    try:
        if 'resume' not in request.files or 'jobDescription' not in request.form:
            return jsonify({'error': 'Missing file or job description'}), 400

        resume_file = request.files['resume']
        job_description = request.form['jobDescription']
        company_name = request.form.get('companyName', '').strip()
        job_role = request.form.get('jobRole', '').strip()
        export_format = request.form.get('exportFormat', 'docx').lower()

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

        # Handle different export formats
        if export_format == 'txt':
            # Convert to plain text
            text_content = docx_to_text(doc)
            text_buffer = io.BytesIO()
            text_buffer.write(text_content.encode('utf-8'))
            text_buffer.seek(0)
            filename = create_export_filename(company_name, job_role, 'txt')
            return send_file(
                text_buffer,
                as_attachment=True,
                download_name=filename,
                mimetype='text/plain'
            )
        else:
            # Default: DOCX format
            out_fd, out_path = tempfile.mkstemp(suffix='.docx')
            os.close(out_fd)
            doc.save(out_path)
            filename = create_export_filename(company_name, job_role, 'docx')
            return send_file(out_path, as_attachment=True, download_name=filename)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/debug-keywords', methods=['POST'])
def debug_keywords():
    """Debug endpoint to test keyword extraction and ATS scoring"""
    if 'resume' not in request.files or 'jobDescription' not in request.form:
        return jsonify({'error': 'Missing file or job description'}), 400

    resume_file = request.files['resume']
    job_description = request.form['jobDescription']

    # Save uploaded file to a temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        resume_file.save(tmp.name)
        doc = Document(tmp.name)

    # Extract all text
    full_text = '\n'.join([p.text for p in doc.paragraphs])
    
    # Extract keywords using both methods
    technical_keywords = extract_technical_keywords(job_description)
    job_keywords = extract_job_keywords(job_description)
    
    # Calculate ATS scores
    original_ats_score = calculate_ats_score(full_text, job_description)
    
    # Find missing keywords
    missing_keywords = [kw for kw in technical_keywords if kw.lower() not in full_text.lower()]
    
    # Simulate adding keywords
    test_text = full_text + "\n\nSkills: " + ", ".join(missing_keywords[:10])
    test_ats_score = calculate_ats_score(test_text, job_description, original_ats_score['total_score'])
    
    # Detailed keyword matching analysis
    resume_lower = full_text.lower()
    matched_keywords = []
    for keyword in job_keywords:
        keyword_lower = keyword.lower()
        pattern = r'\b' + re.escape(keyword_lower) + r'\b'
        if re.search(pattern, resume_lower):
            matched_keywords.append(keyword)
        elif keyword_lower in resume_lower:
            matched_keywords.append(keyword)
    
    match_percentage = len(matched_keywords) / len(job_keywords) if job_keywords else 0
    
    return jsonify({
        'resume_text_length': len(full_text),
        'technical_keywords_found': len(technical_keywords),
        'job_keywords_found': len(job_keywords),
        'missing_keywords': missing_keywords,
        'matched_keywords': matched_keywords,
        'match_percentage': match_percentage,
        'original_ats_score': original_ats_score,
        'test_ats_score': test_ats_score,
        'technical_keywords': technical_keywords,
        'job_keywords': job_keywords,
        'resume_preview': full_text[:500] + "..." if len(full_text) > 500 else full_text,
        'score_breakdown': {
            'keyword_score': original_ats_score['keyword_score'],
            'formatting_score': original_ats_score['formatting_score'],
            'content_score': original_ats_score['content_score'],
            'structure_score': original_ats_score['structure_score'],
            'length_score': original_ats_score['length_score']
        }
    })

@app.route('/test-suggestions', methods=['POST'])
def test_suggestions():
    """Test endpoint to debug keyword suggestions"""
    if 'resume' not in request.files or 'jobDescription' not in request.form:
        return jsonify({'error': 'Missing file or job description'}), 400

    resume_file = request.files['resume']
    job_description = request.form['jobDescription']

    # Save uploaded file to a temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        resume_file.save(tmp.name)
        doc = Document(tmp.name)

    resume_text = '\n'.join([p.text for p in doc.paragraphs])
    industry = infer_industry(job_description)
    suggestions = suggest_extra_keywords(resume_text, job_description, industry)
    
    # Get all available keywords for comparison
    all_technical_keywords = []
    for category, keywords in TECHNICAL_KEYWORDS.items():
        all_technical_keywords.extend(keywords)
    
    industry_keywords = INDUSTRY_KEYWORDS.get(industry, [])
    
    # Normalize resume words
    resume_words = set([
        w.lower().strip(string.punctuation)
        for w in re.findall(r'\b\w[\w\+\#\.\-]*\b', resume_text)
    ])
    
    return jsonify({
        'industry': industry,
        'suggested_keywords': suggestions,
        'resume_text_preview': resume_text[:200] + "..." if len(resume_text) > 200 else resume_text,
        'resume_words_count': len(resume_words),
        'resume_words_sample': list(resume_words)[:20],
        'industry_keywords': industry_keywords,
        'technical_keywords_sample': all_technical_keywords[:50],
        'total_technical_keywords': len(all_technical_keywords),
        'debug_info': {
            'resume_text_length': len(resume_text),
            'suggestions_count': len(suggestions),
            'industry_keywords_available': len(industry_keywords),
            'technical_keywords_total': len(all_technical_keywords)
        }
    })

if __name__ == '__main__':
    app.run(port=8000, debug=False, use_reloader=False) 