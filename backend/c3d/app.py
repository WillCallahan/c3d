import json
import boto3
import os
from c3d.main import convert

s3 = boto3.client("s3")


def lambda_handler(event, context):
    """
    Lambda function to handle file conversions from S3 events.
    """
    # Get the bucket and object key from the event
    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    key = event["Records"][0]["s3"]["object"]["key"]

    # Define download and upload paths
    download_path = f"/tmp/{os.path.basename(key)}"
    upload_path = f"/tmp/converted_{os.path.basename(key)}"  # This will be changed based on target format

    try:
        # Download the file from S3
        s3.download_file(bucket, key, download_path)
        print(f"Downloaded file: {key}")

        # Determine the output format (e.g., from event metadata or a default)
        # For now, let's assume we are converting to STL
        output_ext = ".stl"
        upload_path = (
            f"/tmp/converted_{os.path.splitext(os.path.basename(key))[0]}{output_ext}"
        )

        # Perform the conversion
        convert(download_path, upload_path)
        print(f"Converted file: {os.path.basename(upload_path)}")

        # Upload the converted file to the conversions bucket
        conversions_bucket = os.environ["CONVERSIONS_BUCKET"]
        s3.upload_file(upload_path, conversions_bucket, os.path.basename(upload_path))
        print(f"Uploaded file to: {conversions_bucket}")

        return {"statusCode": 200, "body": json.dumps("Conversion successful!")}

    except Exception as e:
        print(f"Error during conversion: {e}")
        return {"statusCode": 500, "body": json.dumps(f"Error during conversion: {e}")}
    finally:
        # Clean up the temporary files
        if os.path.exists(download_path):
            os.remove(download_path)
        if os.path.exists(upload_path):
            os.remove(upload_path)
