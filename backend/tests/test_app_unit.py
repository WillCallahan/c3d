import json
import pytest
from unittest.mock import Mock, patch
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../c3d'))

from app import handler, get_upload_url, get_status, get_download_url


@pytest.fixture
def mock_env(monkeypatch):
    monkeypatch.setenv("UPLOADS_BUCKET", "test-uploads")
    monkeypatch.setenv("CONVERSIONS_BUCKET", "test-conversions")


@patch('app.s3')
def test_get_upload_url_success(mock_s3, mock_env):
    mock_s3.generate_presigned_url.return_value = "https://presigned-url"
    
    event = {"body": json.dumps({"fileName": "test.step", "targetFormat": "stl"})}
    response = get_upload_url(event)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "uploadUrl" in body
    assert "jobId" in body


@patch('app.s3')
def test_get_upload_url_missing_filename(mock_s3, mock_env):
    event = {"body": json.dumps({})}
    response = get_upload_url(event)
    
    assert response["statusCode"] == 400
    assert "fileName required" in response["body"]


@patch('app.s3')
def test_get_status_found(mock_s3, mock_env):
    mock_s3.list_objects_v2.return_value = {"Contents": [{"Key": "job123/test.step"}]}
    mock_s3.head_object.return_value = {"Metadata": {"status": "processing"}}
    
    event = {"pathParameters": {"job_id": "job123"}}
    response = get_status(event)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["status"] == "processing"


@patch('app.s3')
def test_get_status_not_found(mock_s3, mock_env):
    mock_s3.list_objects_v2.return_value = {"Contents": []}
    mock_s3.head_object.side_effect = Exception("Not found")
    
    event = {"pathParameters": {"job_id": "nonexistent"}}
    response = get_status(event)
    
    assert response["statusCode"] == 404


@patch('app.s3')
def test_get_download_url_success(mock_s3, mock_env):
    mock_s3.head_object.return_value = {}
    mock_s3.generate_presigned_url.return_value = "https://download-url"
    
    event = {"pathParameters": {"job_id": "job123"}}
    response = get_download_url(event)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "downloadUrl" in body


@patch('app.s3')
def test_get_download_url_not_ready(mock_s3, mock_env):
    mock_s3.head_object.side_effect = Exception("Not found")
    
    event = {"pathParameters": {"job_id": "job123"}}
    response = get_download_url(event)
    
    assert response["statusCode"] == 404
