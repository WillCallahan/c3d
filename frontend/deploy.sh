#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh <frontend-bucket-name>"
  echo ""
  echo "Get bucket name from backend stack outputs:"
  echo "  aws cloudformation describe-stacks --stack-name c3d-stack --query 'Stacks[0].Outputs[?OutputKey==\`FrontendBucket\`].OutputValue' --output text"
  exit 1
fi

BUCKET=$1

echo "Building frontend..."
npm run build

echo "Deploying to S3 bucket: $BUCKET"
aws s3 sync dist/ s3://$BUCKET/ --delete

echo "Getting CloudFront distribution ID..."
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName==\`$BUCKET.s3.amazonaws.com\` || Origins.Items[0].DomainName==\`$BUCKET.s3.us-east-1.amazonaws.com\`].Id" --output text)

if [ -n "$DIST_ID" ]; then
  echo "Creating CloudFront invalidation..."
  aws cloudfront create-invalidation --distribution-id $DIST_ID --paths '/*'
  echo "Invalidation created for distribution: $DIST_ID"
else
  echo "Warning: Could not find CloudFront distribution"
fi

echo ""
echo "Frontend deployed successfully!"
