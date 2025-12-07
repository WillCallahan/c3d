# C3D Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate credentials
- SAM CLI installed (`brew install aws-sam-cli` on macOS)
- Python 3.12
- Node.js 18+ and npm
- Docker (for building Lambda container images)

## Quick Deployment

```bash
# 1. Build the SAM application
sam build

# 2. Deploy (guided first time)
sam deploy --guided

# 3. Note the outputs (API endpoint, CloudFront URL, bucket names)

# 4. Build and deploy frontend
cd frontend
npm install
npm run build

# 5. Upload frontend to S3 (replace BUCKET_NAME with output from step 2)
aws s3 sync dist/ s3://BUCKET_NAME --delete

# 6. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

## Detailed Steps

### 1. Backend Deployment

```bash
# Build Lambda functions
sam build --use-container

# Deploy with parameters
sam deploy \
  --stack-name c3d-prod \
  --capabilities CAPABILITY_IAM \
  --region us-east-1 \
  --resolve-s3
```

**Important Notes:**
- Use `--use-container` to ensure dependencies are built for Lambda's Linux environment
- The first deployment will create all resources (S3 buckets, DynamoDB table, Lambda functions, API Gateway, CloudFront)
- Save the outputs - you'll need them for frontend configuration

### 2. Frontend Configuration

Update the API endpoint in your frontend:

```bash
cd frontend

# Create .env file with API endpoint from SAM outputs
echo "VITE_API_ENDPOINT=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/Prod" > .env

# Build frontend
npm run build
```

### 3. Frontend Deployment

```bash
# Get the frontend bucket name from SAM outputs
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name c3d-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucket`].OutputValue' \
  --output text)

# Upload to S3
aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name c3d-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistribution`].OutputValue' \
  --output text | cut -d'/' -f4)

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## Architecture Overview

```
User → CloudFront → S3 (Frontend)
     ↓
     API Gateway → Lambda (ApiFunction)
     ↓
     S3 (Uploads) → Lambda (ConversionFunction) → S3 (Conversions)
     ↓
     DynamoDB (Jobs Table)
```

## Resource Configuration

### Lambda Functions

**ApiFunction:**
- Runtime: Python 3.12
- Memory: 3008 MB
- Timeout: 300 seconds (5 minutes)
- Handles: Upload URLs, conversion requests, status checks, download URLs

**ConversionFunction:**
- Runtime: Python 3.12
- Memory: 10240 MB (10 GB)
- Timeout: 900 seconds (15 minutes)
- Ephemeral Storage: 10 GB
- Triggered by: S3 ObjectCreated events on UploadsBucket

### S3 Buckets

**UploadsBucket:**
- Lifecycle: Files deleted after 1 day
- CORS: Enabled for PUT/POST
- Encryption: AES256

**ConversionsBucket:**
- Lifecycle: Files deleted after 7 days
- CORS: Enabled for GET
- Encryption: AES256

**FrontendBucket:**
- Access: Via CloudFront only (OAC)
- Encryption: AES256

### DynamoDB Table

**JobsTable:**
- Billing: Pay-per-request
- TTL: Enabled (items auto-deleted after 24 hours)
- Key: jobId (String)

## Best Practices Implemented

✅ **Security:**
- S3 bucket encryption enabled
- CloudFront Origin Access Control (OAC) for frontend
- Presigned URLs for secure file uploads/downloads
- IAM least-privilege policies

✅ **Cost Optimization:**
- S3 lifecycle policies to auto-delete old files
- DynamoDB TTL to auto-delete old records
- Pay-per-request billing for DynamoDB
- CloudFront caching for frontend

✅ **Reliability:**
- Error handling in Lambda functions
- DynamoDB for job state tracking
- Automatic retries for S3 events
- CloudFront for high availability

✅ **Performance:**
- Large memory allocation for conversion function
- Ephemeral storage for large file processing
- CloudFront CDN for frontend delivery
- Managed caching policy for CloudFront

## Monitoring

### CloudWatch Logs

```bash
# View API function logs
sam logs -n ApiFunction --stack-name c3d-prod --tail

# View conversion function logs
sam logs -n ConversionFunction --stack-name c3d-prod --tail
```

### Metrics to Monitor

- Lambda invocations and errors
- Lambda duration and memory usage
- API Gateway 4xx/5xx errors
- S3 bucket size
- DynamoDB read/write capacity

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure API Gateway CORS is configured
- Check Lambda responses include CORS headers
- Verify frontend is using correct API endpoint

**2. Conversion Failures**
- Check ConversionFunction logs in CloudWatch
- Verify Lambda has sufficient memory (10GB)
- Ensure ephemeral storage is adequate
- Check file format compatibility

**3. Upload Failures**
- Verify presigned URL hasn't expired (1 hour TTL)
- Check S3 bucket CORS configuration
- Ensure file size is within limits

**4. CloudFront 403 Errors**
- Verify OAC is properly configured
- Check S3 bucket policy allows CloudFront
- Wait for CloudFront distribution to fully deploy

## Cleanup

To delete all resources:

```bash
# Delete frontend files first
aws s3 rm s3://FRONTEND_BUCKET --recursive

# Delete stack
sam delete --stack-name c3d-prod
```

## CI/CD Integration

See `.github/workflows/deploy-aws.yaml` for automated deployment pipeline.

## Cost Estimation

Approximate monthly costs (assuming moderate usage):

- Lambda: $5-20 (based on invocations)
- S3: $1-5 (with lifecycle policies)
- DynamoDB: $1-5 (pay-per-request)
- API Gateway: $3-10 (per million requests)
- CloudFront: $1-10 (based on traffic)

**Total: ~$11-50/month** for moderate usage

Use AWS Cost Explorer and set up billing alerts for monitoring.
