# AWS Deployment Configuration

## Overview
The C3D application is configured to automatically deploy to AWS account `299585817196` (c3d-prod) using GitHub Actions with OIDC authentication.

## Infrastructure Setup

### IAM Configuration
- **OIDC Provider**: `token.actions.githubusercontent.com` configured for GitHub Actions
- **IAM Role**: `GitHubActionsC3DDeployRole`
- **Role ARN**: `arn:aws:iam::299585817196:role/GitHubActionsC3DDeployRole`
- **Region**: `us-east-1`

### Stack Configuration
- **Stack Name**: `c3d-prod`
- **Region**: `us-east-1`

## GitHub Actions Workflow

The deployment workflow (`.github/workflows/deploy-aws.yaml`) runs on:
- Push to `main` branch
- Manual trigger via `workflow_dispatch`

### Deployment Process
1. **Backend Deployment**:
   - Builds SAM application
   - Deploys CloudFormation stack with Lambda functions, API Gateway, S3 buckets, DynamoDB table, and CloudFront distribution
   - Extracts stack outputs (API endpoint, S3 bucket names, CloudFront distribution ID)

2. **Frontend Deployment**:
   - Builds React frontend with API endpoint from backend deployment
   - Syncs built files to S3 bucket
   - Invalidates CloudFront cache

## Security Best Practices

### OIDC Authentication
The workflow uses OpenID Connect (OIDC) to authenticate with AWS, eliminating the need for long-lived AWS credentials:
- No AWS access keys stored in GitHub secrets
- Short-lived tokens issued by GitHub
- Role assumption scoped to the specific repository (`WillCallahan/c3d`)

### IAM Permissions
The `GitHubActionsC3DDeployRole` has permissions for:
- CloudFormation stack operations
- S3 bucket management
- Lambda function deployment
- API Gateway configuration
- DynamoDB table operations
- CloudFront distribution management
- IAM role management (for Lambda execution roles)

## No GitHub Secrets Required

The deployment is fully configured and requires **no GitHub secrets**. All authentication is handled via OIDC with the IAM role.

## Manual Deployment

To deploy manually from your local machine:

```bash
sam build
sam deploy
```

Ensure you have AWS credentials configured for account `299585817196` with appropriate permissions.

## Resources Created

The CloudFormation stack creates:
- **API Gateway**: REST API for file conversion endpoints
- **Lambda Functions**: 
  - `ApiFunction`: Handles API requests
  - `ConversionFunction`: Processes file conversions
- **S3 Buckets**:
  - `UploadsBucket`: Temporary storage for uploaded files (1-day lifecycle)
  - `ConversionsBucket`: Storage for converted files (7-day lifecycle)
  - `FrontendBucket`: Static website hosting
- **DynamoDB Table**: Job tracking with TTL
- **CloudFront Distribution**: CDN for frontend with custom error pages

## Monitoring

View deployment status:
- GitHub Actions: https://github.com/WillCallahan/c3d/actions
- CloudFormation Console: https://console.aws.amazon.com/cloudformation
- Stack Name: `c3d-prod`
