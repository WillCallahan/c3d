#!/bin/bash
set -e

echo "Building SAM application..."
sam build

echo "Deploying SAM application..."
sam deploy --guided

echo "Getting stack outputs..."
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name c3d-stack --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text)
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name c3d-stack --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' --output text)
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name c3d-stack --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucket`].OutputValue' --output text)

echo ""
echo "Deployment complete!"
echo "API Endpoint: $API_ENDPOINT"
echo "CloudFront URL: https://$CLOUDFRONT_URL"
echo "Frontend Bucket: $FRONTEND_BUCKET"
echo ""
echo "To deploy frontend:"
echo "  cd ../frontend"
echo "  npm run build"
echo "  aws s3 sync dist/ s3://$FRONTEND_BUCKET/"
echo "  aws cloudfront create-invalidation --distribution-id \$(aws cloudfront list-distributions --query \"DistributionList.Items[?Origins.Items[0].DomainName=='$FRONTEND_BUCKET.s3.amazonaws.com'].Id\" --output text) --paths '/*'"
