#!/bin/bash
set -e

STACK_NAME="${STACK_NAME:-c3d-prod}"
REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Deploying C3D Application"
echo "Stack: $STACK_NAME"
echo "Region: $REGION"
echo ""

# Build SAM application
echo "📦 Building SAM application..."
sam build --use-container

# Deploy backend
echo "☁️  Deploying backend to AWS..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_IAM \
  --region "$REGION" \
  --resolve-s3 \
  --no-confirm-changeset

# Get outputs
echo "📋 Retrieving stack outputs..."
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucket`].OutputValue' \
  --output text)

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
  --output text)

echo "✅ Backend deployed successfully!"
echo "   API Endpoint: $API_ENDPOINT"
echo ""

# Build frontend
echo "🎨 Building frontend..."
cd frontend

# Create .env file
echo "VITE_API_ENDPOINT=$API_ENDPOINT" > .env

npm install
npm run build

# Deploy frontend
echo "📤 Deploying frontend to S3..."
aws s3 sync dist/ "s3://$FRONTEND_BUCKET" --delete --region "$REGION"

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?DomainName=='$FRONTEND_BUCKET.s3.$REGION.amazonaws.com']].Id" \
  --output text)

if [ -n "$DISTRIBUTION_ID" ]; then
  echo "🔄 Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --no-cli-pager
fi

cd ..

echo ""
echo "✨ Deployment complete!"
echo ""
echo "🌐 Application URL: https://$CLOUDFRONT_URL"
echo "🔗 API Endpoint: $API_ENDPOINT"
echo ""
echo "Note: CloudFront distribution may take 10-15 minutes to fully deploy."
