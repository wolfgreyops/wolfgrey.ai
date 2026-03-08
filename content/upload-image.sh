#!/bin/bash
# Upload an image to Typefully and return media_id
# Usage: upload-image.sh <file.png>

set -euo pipefail

API_KEY="6zGA33IP5ztRbEQjFZaA5e2ijeryADPF"
SOCIAL_SET_ID="285018"
FILE="$1"
FILENAME=$(basename "$FILE")

# Step 1: Get presigned URL
response=$(curl -s -X POST \
  "https://api.typefully.com/v2/social-sets/${SOCIAL_SET_ID}/media/upload" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"file_name\": \"$FILENAME\"}")

upload_url=$(echo "$response" | jq -r '.upload_url')
media_id=$(echo "$response" | jq -r '.media_id')

if [ -z "$upload_url" ] || [ "$upload_url" = "null" ]; then
  echo "ERROR: Failed to get upload URL" >&2
  echo "$response" >&2
  exit 1
fi

# Step 2: Upload raw bytes (no extra headers!)
http_code=$(curl -s -o /dev/null -w "%{http_code}" -T "$FILE" "$upload_url")

if [ "$http_code" != "200" ] && [ "$http_code" != "204" ]; then
  echo "ERROR: Upload failed with $http_code" >&2
  exit 1
fi

# Step 3: Poll for processing completion (max 30s)
for i in $(seq 1 10); do
  status_response=$(curl -s \
    "https://api.typefully.com/v2/social-sets/${SOCIAL_SET_ID}/media/${media_id}" \
    -H "Authorization: Bearer $API_KEY")
  status=$(echo "$status_response" | jq -r '.status')

  if [ "$status" = "completed" ] || [ "$status" = "ready" ]; then
    echo "$media_id"
    exit 0
  fi
  sleep 3
done

echo "ERROR: Media processing timed out" >&2
exit 1
