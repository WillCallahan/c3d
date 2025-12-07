import pytest
import requests
import time
import os

API_ENDPOINT = os.environ.get("API_ENDPOINT", "https://cr5cbxhsvd.execute-api.us-east-1.amazonaws.com/Prod")


@pytest.mark.e2e
class TestE2EWorkflow:
    """End-to-end tests that invoke the real AWS API"""
    
    def test_upload_url_endpoint(self):
        """Test getting an upload URL"""
        response = requests.post(
            f"{API_ENDPOINT}/upload-url",
            json={"fileName": "test.step", "targetFormat": "stl"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "uploadUrl" in data
        assert "jobId" in data
        assert data["uploadUrl"].startswith("https://")
        
        return data["jobId"]
    
    def test_upload_url_missing_filename(self):
        """Test upload URL with missing filename"""
        response = requests.post(
            f"{API_ENDPOINT}/upload-url",
            json={}
        )
        
        assert response.status_code == 400
        assert "fileName required" in response.text
    
    def test_status_endpoint_not_found(self):
        """Test status check for non-existent job"""
        response = requests.get(f"{API_ENDPOINT}/status/nonexistent-job-id")
        
        assert response.status_code == 404
    
    def test_download_url_not_ready(self):
        """Test download URL for job that's not complete"""
        response = requests.get(f"{API_ENDPOINT}/download-url/nonexistent-job-id")
        
        assert response.status_code == 404
    
    def test_full_workflow_with_mock_file(self):
        """Test complete workflow: upload URL -> status check"""
        # Step 1: Get upload URL
        response = requests.post(
            f"{API_ENDPOINT}/upload-url",
            json={"fileName": "test.step", "targetFormat": "stl"}
        )
        assert response.status_code == 200
        data = response.json()
        job_id = data["jobId"]
        upload_url = data["uploadUrl"]
        
        # Step 2: Verify we can check status (should be pending or not found initially)
        response = requests.get(f"{API_ENDPOINT}/status/{job_id}")
        assert response.status_code in [200, 404]
        
        # Step 3: Upload a small test file
        test_content = b"STEP test file content"
        upload_response = requests.put(upload_url, data=test_content)
        assert upload_response.status_code == 200
        
        # Step 4: Check status again (should exist now)
        time.sleep(2)  # Wait for S3 consistency
        response = requests.get(f"{API_ENDPOINT}/status/{job_id}")
        assert response.status_code == 200
        status_data = response.json()
        assert "status" in status_data
        assert status_data["jobId"] == job_id


@pytest.mark.e2e
class TestE2EErrorHandling:
    """Test error handling in the real API"""
    
    def test_invalid_json(self):
        """Test API with invalid JSON"""
        response = requests.post(
            f"{API_ENDPOINT}/upload-url",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code in [400, 500]
    
    def test_cors_headers(self):
        """Test that CORS headers are present"""
        response = requests.post(
            f"{API_ENDPOINT}/upload-url",
            json={"fileName": "test.step"}
        )
        
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "*"
    
    def test_invalid_endpoint(self):
        """Test accessing non-existent endpoint"""
        response = requests.get(f"{API_ENDPOINT}/nonexistent")
        
        assert response.status_code == 404


@pytest.mark.e2e
@pytest.mark.slow
class TestE2EPerformance:
    """Performance tests for the API"""
    
    def test_upload_url_response_time(self):
        """Test that upload URL generation is fast"""
        start = time.time()
        response = requests.post(
            f"{API_ENDPOINT}/upload-url",
            json={"fileName": "test.step", "targetFormat": "stl"}
        )
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 2.0, f"Upload URL took {duration}s, expected < 2s"
    
    def test_status_check_response_time(self):
        """Test that status checks are fast"""
        start = time.time()
        response = requests.get(f"{API_ENDPOINT}/status/test-job-id")
        duration = time.time() - start
        
        assert duration < 1.0, f"Status check took {duration}s, expected < 1s"
