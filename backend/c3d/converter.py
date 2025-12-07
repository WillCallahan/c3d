import boto3
import os
from main import convert

s3 = boto3.client("s3")

def handler(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]
        job_id = key.split("/")[0]
        
        try:
            meta = s3.head_object(Bucket=bucket, Key=key)
            target_format = meta.get("Metadata", {}).get("targetformat", "stl")
            file_name = key.split("/")[-1]
            source_format = file_name.split(".")[-1].lower()
            
            s3.copy_object(
                Bucket=bucket, Key=key,
                CopySource={"Bucket": bucket, "Key": key},
                Metadata={"status": "processing", "targetformat": target_format},
                MetadataDirective="REPLACE"
            )
            
            input_file = f"/tmp/{file_name}"
            output_file = f"/tmp/{job_id}.{target_format}"
            
            s3.download_file(bucket, key, input_file)
            convert(input_file, output_file, input_format=source_format, output_format=target_format)
            
            output_key = f"{job_id}.{target_format}"
            s3.upload_file(output_file, os.environ["CONVERSIONS_BUCKET"], output_key)
            
            s3.copy_object(
                Bucket=bucket, Key=key,
                CopySource={"Bucket": bucket, "Key": key},
                Metadata={"status": "completed", "targetformat": target_format},
                MetadataDirective="REPLACE"
            )
            
            os.remove(input_file)
            os.remove(output_file)
        except Exception as e:
            print(f"Error: {str(e)}")
            try:
                s3.copy_object(
                    Bucket=bucket, Key=key,
                    CopySource={"Bucket": bucket, "Key": key},
                    Metadata={"status": "failed", "error": str(e)[:256]},
                    MetadataDirective="REPLACE"
                )
            except:
                pass
    
    return {"statusCode": 200}
