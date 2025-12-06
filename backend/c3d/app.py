import boto3
import os
import json

def handler(event, context):
    """
    This function handles the API Gateway requests.
    """
    route_key = event.get("routeKey")
    if route_key == "POST /upload-url":
        return get_upload_url(event)
    elif route_key == "POST /convert":
        return convert_file(event)
    elif route_key == "GET /status/{job_id}":
        return get_status(event)
    elif route_key == "GET /download-url/{job_id}":
        return get_download_url(event)
    else:
        return {
            "statusCode": 404,
            "body": json.dumps({"message": "Not Found"})
        }

def get_upload_url(event):
    """
    Generates a pre-signed S3 URL for securely uploading a source file.
    """
    s3 = boto3.client("s3")
    bucket_name = os.environ.get("UPLOADS_BUCKET")
    file_name = json.loads(event["body"]).get("fileName")
    
    presigned_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket_name, "Key": file_name},
        ExpiresIn=3600,
    )
    
    return {
        "statusCode": 200,
        "body": json.dumps({"uploadUrl": presigned_url})
    }

def convert_file(event):
    """
    Initiates a conversion job.
    """
    # This is where the conversion logic will go.
    # For now, we'll just return a dummy job ID.
    return {
        "statusCode": 200,
        "body": json.dumps({"jobId": "12345"})
    }

def get_status(event):
    """
    Checks the status of a conversion job.
    """
    job_id = event["pathParameters"].get("job_id")
    # This is where the logic to check the status of the job will go.
    # For now, we'll just return a dummy status.
    return {
        "statusCode": 200,
        "body": json.dumps({"jobId": job_id, "status": "completed"})
    }

def get_download_url(event):
    """
    Generates a pre-signed S3 URL for downloading the converted file.
    """
    s3 = boto3.client("s3")
    bucket_name = os.environ.get("CONVERSIONS_BUCKET")
    job_id = event["pathParameters"].get("job_id")
    file_name = f"{job_id}.stl" # Assuming the output format is always STL for now
    
    presigned_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket_name, "Key": file_name},
        ExpiresIn=3600,
    )
    
    return {
        "statusCode": 200,
        "body": json.dumps({"downloadUrl": presigned_url})
    }