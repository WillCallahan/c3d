import boto3
import os
import json
import time
from main import convert

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["JOBS_TABLE"])

def handler(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]
        
        job_id = key.split("/")[0]
        
        try:
            response = table.get_item(Key={"jobId": job_id})
            item = response.get("Item")
            
            if not item:
                print(f"Job {job_id} not found in DynamoDB")
                continue
            
            table.update_item(
                Key={"jobId": job_id},
                UpdateExpression="SET #status = :status",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={":status": "processing"}
            )
            
            file_name = item["fileName"]
            target_format = item.get("targetFormat", "stl")
            source_format = file_name.split(".")[-1].lower()
            
            input_file = f"/tmp/{file_name}"
            output_file = f"/tmp/{job_id}.{target_format}"
            
            s3.download_file(bucket, key, input_file)
            
            convert(input_file, output_file, input_format=source_format, output_format=target_format)
            
            output_key = f"{job_id}.{target_format}"
            s3.upload_file(output_file, os.environ["CONVERSIONS_BUCKET"], output_key)
            
            table.update_item(
                Key={"jobId": job_id},
                UpdateExpression="SET #status = :status, outputKey = :key, completedAt = :time",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": "completed",
                    ":key": output_key,
                    ":time": int(time.time())
                }
            )
            
            if os.path.exists(input_file):
                os.remove(input_file)
            if os.path.exists(output_file):
                os.remove(output_file)
                
        except Exception as e:
            print(f"Conversion failed for job {job_id}: {str(e)}")
            table.update_item(
                Key={"jobId": job_id},
                UpdateExpression="SET #status = :status, #error = :error",
                ExpressionAttributeNames={"#status": "status", "#error": "error"},
                ExpressionAttributeValues={
                    ":status": "failed",
                    ":error": str(e)
                }
            )
    
    return {"statusCode": 200}
