import boto3
import os
import json
import uuid

s3 = boto3.client("s3")

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
}

def handler(event, context):
    print(f"Event: {json.dumps(event)}")
    path = event.get("path", "")
    method = event.get("httpMethod", "")
    print(f"Path: {path}, Method: {method}")
    
    try:
        if method == "OPTIONS":
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}
        
        if path == "/upload-url" and method == "POST":
            result = get_upload_url(event)
            print(f"Result: {json.dumps(result)}")
            return result
        elif path.startswith("/status/") and method == "GET":
            return get_status(event)
        elif path.startswith("/download-url/") and method == "GET":
            return get_download_url(event)
        
        return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"message": "Not Found"})}
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"statusCode": 500, "headers": CORS_HEADERS, "body": json.dumps({"message": str(e)})}

def get_upload_url(event):
    body = json.loads(event["body"])
    file_name = body.get("fileName")
    target_format = body.get("targetFormat", "stl")
    
    if not file_name:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"message": "fileName required"})}
    
    job_id = str(uuid.uuid4())
    key = f"{job_id}/{file_name}"
    
    presigned_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": os.environ["UPLOADS_BUCKET"],
            "Key": key,
            "Metadata": {"targetformat": target_format}
        },
        ExpiresIn=3600
    )
    
    return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"uploadUrl": presigned_url, "jobId": job_id})}

def get_status(event):
    job_id = event["pathParameters"]["job_id"]
    
    try:
        uploads_key = None
        for obj in s3.list_objects_v2(Bucket=os.environ["UPLOADS_BUCKET"], Prefix=f"{job_id}/").get("Contents", []):
            uploads_key = obj["Key"]
            break
        
        if uploads_key:
            meta = s3.head_object(Bucket=os.environ["UPLOADS_BUCKET"], Key=uploads_key)
            status = meta.get("Metadata", {}).get("status", "processing")
            error = meta.get("Metadata", {}).get("error")
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"jobId": job_id, "status": status, "error": error})}
        
        conversions_key = f"{job_id}.stl"
        try:
            s3.head_object(Bucket=os.environ["CONVERSIONS_BUCKET"], Key=conversions_key)
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"jobId": job_id, "status": "completed"})}
        except:
            pass
        
        return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"message": "Job not found"})}
    except Exception as e:
        return {"statusCode": 500, "headers": CORS_HEADERS, "body": json.dumps({"message": str(e)})}

def get_download_url(event):
    job_id = event["pathParameters"]["job_id"]
    
    try:
        conversions_key = f"{job_id}.stl"
        s3.head_object(Bucket=os.environ["CONVERSIONS_BUCKET"], Key=conversions_key)
        
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": os.environ["CONVERSIONS_BUCKET"], "Key": conversions_key},
            ExpiresIn=3600
        )
        
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"downloadUrl": presigned_url})}
    except:
        return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"message": "File not ready"})}
