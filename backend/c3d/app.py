import boto3
import os
import json
import uuid
import time

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["JOBS_TABLE"])

def handler(event, context):
    path = event.get("path", "")
    method = event.get("httpMethod", "")
    
    if path == "/upload-url" and method == "POST":
        return get_upload_url(event)
    elif path == "/convert" and method == "POST":
        return initiate_conversion(event)
    elif path.startswith("/status/") and method == "GET":
        return get_status(event)
    elif path.startswith("/download-url/") and method == "GET":
        return get_download_url(event)
    
    return {
        "statusCode": 404,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"message": "Not Found"})
    }

def get_upload_url(event):
    body = json.loads(event["body"])
    file_name = body.get("fileName")
    
    if not file_name:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": "fileName is required"})
        }
    
    job_id = str(uuid.uuid4())
    key = f"{job_id}/{file_name}"
    
    presigned_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": os.environ["UPLOADS_BUCKET"], "Key": key},
        ExpiresIn=3600,
    )
    
    table.put_item(Item={
        "jobId": job_id,
        "status": "pending",
        "fileName": file_name,
        "s3Key": key,
        "createdAt": int(time.time()),
        "ttl": int(time.time()) + 86400
    })
    
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"uploadUrl": presigned_url, "jobId": job_id})
    }

def initiate_conversion(event):
    body = json.loads(event["body"])
    job_id = body.get("jobId")
    target_format = body.get("targetFormat", "stl")
    
    if not job_id:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": "jobId is required"})
        }
    
    table.update_item(
        Key={"jobId": job_id},
        UpdateExpression="SET #status = :status, targetFormat = :format",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":status": "queued", ":format": target_format}
    )
    
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"jobId": job_id, "status": "queued"})
    }

def get_status(event):
    job_id = event["pathParameters"]["job_id"]
    
    response = table.get_item(Key={"jobId": job_id})
    item = response.get("Item")
    
    if not item:
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": "Job not found"})
        }
    
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "jobId": job_id,
            "status": item["status"],
            "fileName": item.get("fileName"),
            "error": item.get("error")
        })
    }

def get_download_url(event):
    job_id = event["pathParameters"]["job_id"]
    
    response = table.get_item(Key={"jobId": job_id})
    item = response.get("Item")
    
    if not item:
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": "Job not found"})
        }
    
    if item["status"] != "completed":
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": "Conversion not completed"})
        }
    
    output_key = item.get("outputKey")
    presigned_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": os.environ["CONVERSIONS_BUCKET"], "Key": output_key},
        ExpiresIn=3600,
    )
    
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"downloadUrl": presigned_url})
    }