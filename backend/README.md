# C3D Backend - AWS SAM Application

This is the backend for the C3D 3D file conversion service, built with AWS SAM (Serverless Application Model).

## Architecture

- **API Gateway**: REST API for frontend communication
- **Lambda Functions**:
  - `ApiFunction`: Handles API requests (upload URLs, status checks, download URLs)
  - `ConversionFunction`: Processes file conversions triggered by S3 uploads
- **S3 Buckets**:
  - `UploadsBucket`: Stores uploaded files (1-day lifecycle)
  - `ConversionsBucket`: Stores converted files (7-day lifecycle)
  - `FrontendBucket`: Hosts static frontend files
- **DynamoDB**: Tracks job status and metadata
- **CloudFront**: CDN for frontend distribution

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS SAM CLI installed (`brew install aws-sam-cli` on macOS)
- Docker installed and running
- Python 3.12

## Deployment

### Quick Deploy

```bash
./deploy.sh
```

### Manual Deploy

```bash
# Build the application
sam build

# Deploy (first time - guided)
sam deploy --guided

# Deploy (subsequent times)
sam deploy
```

### Configuration

Edit `samconfig.toml` to customize:
- Stack name
- AWS region
- Deployment parameters

## Local Development

### Start API locally

```bash
sam local start-api
```

### Invoke function locally

```bash
sam local invoke ApiFunction -e events/upload-url.json
```

### Test with Docker

```bash
sam build
sam local start-api --warm-containers EAGER
```

## API Endpoints

- `POST /upload-url` - Get presigned URL for file upload
- `POST /convert` - Initiate conversion job
- `GET /status/{job_id}` - Check conversion status
- `GET /download-url/{job_id}` - Get presigned URL for download

## Environment Variables

Set in `template.yaml`:
- `JOBS_TABLE`: DynamoDB table name
- `UPLOADS_BUCKET`: S3 bucket for uploads
- `CONVERSIONS_BUCKET`: S3 bucket for conversions

## Notes

- **SnapStart**: Not available for Python runtimes (Java only). Using ARM64 architecture and increased memory for better cold start performance.
- **Timeout**: API function has 5-minute timeout, conversion function has 15-minute timeout
- **Memory**: Conversion function uses 10GB memory for large file processing
- **Storage**: Ephemeral storage increased to 10GB for conversion function

## Monitoring

View logs:
```bash
sam logs -n ApiFunction --tail
sam logs -n ConversionFunction --tail
```

## Cleanup

```bash
sam delete
```
