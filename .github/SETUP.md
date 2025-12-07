# GitHub Actions Setup for AWS Deployment

## Prerequisites

1. AWS Account with appropriate permissions
2. GitHub repository with Actions enabled

## Setup Steps

### 1. Create IAM Role for GitHub Actions (OIDC)

```bash
# Create trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/step-to-stl:*"
        }
      }
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name GitHubActionsC3DRole \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name GitHubActionsC3DRole \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

aws iam attach-role-policy \
  --role-name GitHubActionsC3DRole \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
```

### 2. Configure GitHub OIDC Provider (if not exists)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 3. Add GitHub Secrets

Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add:
- `AWS_ROLE_ARN`: `arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActionsC3DRole`
- `AWS_REGION`: `us-east-1` (or your preferred region)

### 4. Update samconfig.toml

Ensure `samconfig.toml` has:
```toml
[default.deploy.parameters]
confirm_changeset = false
```

## Workflow Triggers

- **CI** (`ci.yaml`): Runs on every push/PR
  - Tests Python code
  - Validates SAM template
  - Builds SAM application

- **Deploy** (`deploy-aws.yaml`): Runs on:
  - Push to `main` branch
  - Manual trigger via GitHub UI

## Manual Deployment

Go to: `Actions` → `Deploy to AWS` → `Run workflow`

## Monitoring

View deployment logs in GitHub Actions tab.
