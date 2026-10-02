#!/usr/bin/env bash
# One-time: create the Walkthroughs S3 bucket with CORS + public GetObject.
#
# Usage (from repo root):
#   bash scripts/s3_setup_walkthroughs.sh
#   bash scripts/s3_setup_walkthroughs.sh project-it-walkthroughs us-west-2
#
# Requires: aws CLI authenticated with permission to create buckets, policies, CORS, IAM.
# Prints the bucket name and creates an IAM user with PutObject-only keys (shown once).

set -euo pipefail

BUCKET="${1:-project-it-walkthroughs}"
REGION="${2:-${AWS_REGION:-us-west-2}}"
IAM_USER="project-it-walkthrough-uploader"
POLICY_NAME="project-it-walkthrough-put"

echo "==> Bucket: s3://${BUCKET} (region ${REGION})"

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "Bucket already exists."
else
  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
  else
    aws s3api create-bucket \
      --bucket "$BUCKET" \
      --region "$REGION" \
      --create-bucket-configuration "LocationConstraint=${REGION}"
  fi
  echo "Created bucket."
fi

# Allow public GetObject on walkthroughs/* (UUID keys). Keep ListBucket private.
echo "==> Public GetObject on walkthroughs/*"
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadWalkthroughs",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET}/walkthroughs/*"
    }
  ]
}
EOF
)"

echo "==> CORS for localhost + staging"
aws s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration "$(cat <<'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://project-it.samirrodriguez.click"
      ],
      "AllowedMethods": ["PUT", "HEAD", "GET"],
      "AllowedHeaders": ["Content-Type"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
)"

echo "==> IAM user ${IAM_USER} (PutObject on walkthroughs/*)"
if aws iam get-user --user-name "$IAM_USER" >/dev/null 2>&1; then
  echo "IAM user already exists; skipping key creation (create a new access key in the console if needed)."
else
  aws iam create-user --user-name "$IAM_USER" >/dev/null

  POLICY_DOC=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PutWalkthroughs",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:AbortMultipartUpload"],
      "Resource": "arn:aws:s3:::${BUCKET}/walkthroughs/*"
    }
  ]
}
EOF
)
  aws iam put-user-policy \
    --user-name "$IAM_USER" \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOC"

  CREDS=$(aws iam create-access-key --user-name "$IAM_USER" --output json)
  ACCESS_KEY=$(echo "$CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['AccessKey']['AccessKeyId'])")
  SECRET_KEY=$(echo "$CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['AccessKey']['SecretAccessKey'])")

  echo ""
  echo "Add these to .env.local and EC2 ~/project-it-staging/.env:"
  echo "  S3_WALKTHROUGH_BUCKET=${BUCKET}"
  echo "  AWS_REGION=${REGION}"
  echo "  AWS_ACCESS_KEY_ID=${ACCESS_KEY}"
  echo "  AWS_SECRET_ACCESS_KEY=${SECRET_KEY}"
  echo ""
  echo "Secret is shown once — copy it now."
fi

echo "==> Done. Public URL form:"
echo "  https://${BUCKET}.s3.${REGION}.amazonaws.com/walkthroughs/<uuid>.mp4"
