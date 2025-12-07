#!/bin/bash
set -e

echo "Building SAM application..."
sam build

echo "Deploying SAM application..."
sam deploy

echo ""
echo "Getting stack outputs..."
aws cloudformation describe-stacks --stack-name c3d-stack --query 'Stacks[0].Outputs' --output table
