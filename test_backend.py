import requests
import json

# Test the backend with a simple request
def test_backend():
    print("Testing backend...")
    
    # Test health endpoint
    try:
        response = requests.get('http://localhost:8000/health')
        print(f"Health check: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return
    
    # Test optimization endpoint with minimal data
    try:
        # Create a simple test file
        with open('test_resume.docx', 'wb') as f:
            # Create a minimal docx file (this is just a test)
            f.write(b'PK\x03\x04\x14\x00\x00\x00\x08\x00')
        
        files = {'resume': open('test_resume.docx', 'rb')}
        data = {
            'jobDescription': 'Software Engineer position requiring Python, JavaScript, React',
            'extraKeywords': 'Typescript, Go, Ruby',
            'companyName': 'Test Company',
            'jobRole': 'Software Engineer'
        }
        
        print("Sending optimization request...")
        response = requests.post('http://localhost:8000/optimize-docx', files=files, data=data)
        print(f"Optimization response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Optimization result: {json.dumps(result, indent=2)}")
        else:
            print(f"Error response: {response.text}")
            
    except Exception as e:
        print(f"Optimization test failed: {e}")

if __name__ == "__main__":
    test_backend() 