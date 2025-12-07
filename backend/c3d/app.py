import boto3
import os
import json
import uuid
from main import convert

JOB_STATUS = {}

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
    s3 = boto3.client("s3")
    uploads_bucket = os.environ.get("UPLOADS_BUCKET")
    conversions_bucket = os.environ.get("CONVERSIONS_BUCKET")
    
    body = json.loads(event["body"])
    file_name = body.get("fileName")
    source_format = body.get("sourceFormat")
    target_format = body.get("targetFormat")
    
    job_id = str(uuid.uuid4())
    JOB_STATUS[job_id] = {"status": "processing", "target_format": target_format}
    
    input_file = f"/tmp/{file_name}"
    output_file = f"/tmp/{job_id}.{target_format}"
    
    s3.download_file(uploads_bucket, file_name, input_file)
    
    try:
        convert(input_file, output_file, input_format=source_format, output_format=target_format)
        s3.upload_file(output_file, conversions_bucket, f"{job_id}.{target_format}")
        JOB_STATUS[job_id]["status"] = "completed"
    except Exception as e:
        print(f"Conversion failed: {e}")
        JOB_STATUS[job_id]["status"] = "failed"
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Conversion failed"})
        }
    finally:
        if os.path.exists(input_file):
            os.remove(input_file)
        if os.path.exists(output_file):
            os.remove(output_file)
            
    return {
        "statusCode": 200,
        "body": json.dumps({"jobId": job_id})
    }

def get_status(event):
    """
    Checks the status of a conversion job.
    """
    job_id = event["pathParameters"].get("job_id")
    status = JOB_STATUS.get(job_id, {}).get("status", "not_found")
    return {
        "statusCode": 200,
        "body": json.dumps({"jobId": job_id, "status": status})
    }

def get_download_url(event):
    """
    Generates a pre-signed S3 URL for downloading the converted file.
    """
    s3 = boto3.client("s3")
    bucket_name = os.environ.get("CONVERSIONS_BUCKET")
    job_id = event["pathParameters"].get("job_id")
    target_format = JOB_STATUS.get(job_id, {}).get("target_format", "stl")
    file_name = f"{job_id}.{target_format}"
    
    presigned_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket_name, "Key": file_name},
        ExpiresIn=3600,
    )
    
    return {
        "statusCode": 200,
        "body": json.dumps({"downloadUrl": presigned_url})
    }