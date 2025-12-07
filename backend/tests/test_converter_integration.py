import pytest
import os
import tempfile
from unittest.mock import Mock, patch
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../c3d'))

from converter import handler


@pytest.fixture
def mock_env(monkeypatch):
    monkeypatch.setenv("UPLOADS_BUCKET", "test-uploads")
    monkeypatch.setenv("CONVERSIONS_BUCKET", "test-conversions")


@pytest.fixture
def s3_event():
    return {
        "Records": [{
            "s3": {
                "bucket": {"name": "test-uploads"},
                "object": {"key": "job123/test.step"}
            }
        }]
    }


@patch('converter.s3')
@patch('converter.convert')
def test_handler_success(mock_convert, mock_s3, s3_event, mock_env):
    mock_s3.head_object.return_value = {"Metadata": {"targetformat": "stl"}}
    mock_s3.download_file.return_value = None
    mock_s3.upload_file.return_value = None
    mock_s3.copy_object.return_value = None
    
    with tempfile.NamedTemporaryFile(suffix=".step") as input_file:
        with tempfile.NamedTemporaryFile(suffix=".stl") as output_file:
            mock_convert.return_value = None
            
            response = handler(s3_event, None)
            
            assert response["statusCode"] == 200
            assert mock_s3.download_file.called
            assert mock_s3.upload_file.called


@patch('converter.s3')
@patch('converter.convert')
def test_handler_conversion_failure(mock_convert, mock_s3, s3_event, mock_env):
    mock_s3.head_object.return_value = {"Metadata": {"targetformat": "stl"}}
    mock_s3.download_file.return_value = None
    mock_convert.side_effect = Exception("Conversion failed")
    
    response = handler(s3_event, None)
    
    assert response["statusCode"] == 200
    assert mock_s3.copy_object.called


@patch('converter.s3')
def test_handler_missing_metadata(mock_s3, s3_event, mock_env):
    mock_s3.head_object.return_value = {"Metadata": {}}
    mock_s3.download_file.return_value = None
    
    response = handler(s3_event, None)
    
    assert response["statusCode"] == 200
