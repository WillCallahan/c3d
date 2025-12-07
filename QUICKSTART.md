# Quick Start Guide

## Important Note

**SnapStart is NOT available for Python** - it only works with Java 11 and Java 17 runtimes. This project uses Python 3.13 with ARM64 architecture for optimal performance and cost.

## Prerequisites

```bash
# Install AWS SAM CLI
brew install aws-sam-cli  # macOS

# Configure AWS credentials
aws configure
```

## Deploy (5 minutes)

```bash
sam build
sam deploy --guided
```

Answer the prompts:
- Stack Name: `c3d-stack`
- AWS Region: `us-east-1`
- Confirm changes: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Save arguments to config: `Y`

## Get Outputs

```bash
aws cloudformation describe-stacks --stack-name c3d-stack --query 'Stacks[0].Outputs' --output table
```

## Deploy Frontend

```bash
cd frontend
npm install
npm run build

BUCKET=$(aws cloudformation describe-stacks --stack-name c3d-stack --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucket`].OutputValue' --output text)
aws s3 sync dist/ s3://$BUCKET/
```

## Access

Get CloudFront URL from outputs and open in browser.

## Cleanup

```bash
sam delete
```
