# C3D Deployment Guide

This guide covers deploying the C3D application to AWS using SAM (Serverless Application Model).

## Architecture Overview

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   CloudFront    │ (Frontend CDN)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  S3 Frontend    │ (Static hosting)
└─────────────────┘
         │
         │ API Calls
         ▼
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────────┐
│  API   │ │ Conversion   │
│Lambda  │ │   Lambda     │
└───┬────┘ └──────┬───────┘
    │             │
    ▼             ▼
┌─────────────────────┐
│     DynamoDB        │ (Job tracking)
└─────────────────────┘
    │             │
    ▼             ▼
┌──────────┐ ┌──────────┐
│ Uploads  │ │Converted │
│ Bucket   │ │ Bucket   │
└──────────┘ └──────────┘
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```
3. **AWS SAM CLI** installed
   ```bash
   # macOS
   brew install aws-sam-cli
   
   # Linux
   pip install aws-sam-cli
   
   # Windows
   choco install aws-sam-cli
   ```
4. **Docker** installed and running
5. **Node.js** 18+ and npm

## Backend Deployment

### Step 1: Deploy Infrastructure

```bash
cd backend
./deploy.sh
```

This will:
- Build Docker images for Lambda functions
- Create S3 buckets (uploads, conversions, frontend)
- Set up DynamoDB table
- Configure API Gateway
- Create CloudFront distribution
- Deploy Lambda functions

### Step 2: Note the Outputs

After deployment, note these values:
- `ApiEndpoint`: Your API Gateway URL
- `CloudFrontUrl`: Your CloudFront distribution URL
- `FrontendBucket`: S3 bucket name for frontend

## Frontend Deployment

### Step 1: Configure API Endpoint

Update your frontend to use the API endpoint:

```bash
cd frontend
# Create .env file
echo "VITE_API_ENDPOINT=<your-api-endpoint>" > .env
```

### Step 2: Deploy Frontend

```bash
./deploy.sh <frontend-bucket-name>
```

This will:
- Build the React application
- Upload to S3
- Invalidate CloudFront cache

## Configuration

### Backend Configuration

Edit `backend/samconfig.toml`:

```toml
[default.deploy.parameters]
stack_name = "c3d-stack"
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
```

### Resource Limits

Adjust in `backend/template.yaml`:

```yaml
ConversionFunction:
  Properties:
    Timeout: 900          # 15 minutes
    MemorySize: 10240     # 10 GB
    EphemeralStorage:
      Size: 10240         # 10 GB
```

### Lifecycle Policies

S3 bucket lifecycles (in `template.yaml`):
- Uploads: 1 day retention
- Conversions: 7 days retention

## Monitoring

### View Logs

```bash
# API function logs
sam logs -n ApiFunction --tail --stack-name c3d-stack

# Conversion function logs
sam logs -n ConversionFunction --tail --stack-name c3d-stack
```

### CloudWatch Metrics

Monitor in AWS Console:
- Lambda invocations and errors
- API Gateway requests
- S3 bucket metrics
- DynamoDB read/write capacity

## Cost Optimization

1. **Lambda**: Using ARM64 architecture (20% cheaper)
2. **S3**: Lifecycle policies auto-delete old files
3. **DynamoDB**: Pay-per-request billing
4. **CloudFront**: Free tier covers 1TB/month

## Troubleshooting

### Build Failures

```bash
# Clean and rebuild
cd backend
sam build --use-container
```

### Deployment Failures

```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name c3d-stack
```

### Lambda Errors

```bash
# View recent errors
sam logs -n ConversionFunction --filter "ERROR" --tail
```

## Cleanup

To remove all resources:

```bash
cd backend
sam delete
```

This will delete:
- Lambda functions
- API Gateway
- S3 buckets (must be empty)
- DynamoDB table
- CloudFront distribution
- IAM roles

## Security Best Practices

1. **CORS**: Configured for API Gateway
2. **Encryption**: S3 buckets use AES256
3. **Presigned URLs**: Time-limited (1 hour)
4. **IAM**: Least privilege policies
5. **CloudFront**: HTTPS only

## Performance Notes

- **Cold Start**: ~2-3 seconds (ARM64 + 3GB memory)
- **Conversion Time**: Varies by file size (typically 10-60 seconds)
- **API Latency**: <100ms for status checks
- **CloudFront**: Global edge locations for fast frontend delivery

## Important Notes

### SnapStart Limitation

**SnapStart is NOT available for Python runtimes** - it only works with Java 11 and Java 17. Instead, this deployment uses:
- ARM64 architecture (faster, cheaper)
- Increased memory allocation (3GB for API, 10GB for conversion)
- Container image packaging for faster cold starts

If you need Java with SnapStart, you would need to rewrite the Lambda functions in Java.

## Support

For issues:
1. Check CloudWatch Logs
2. Review CloudFormation events
3. Verify IAM permissions
4. Check S3 bucket policies
