#!/usr/bin/env bash
# Quick API smoke test
BASE="http://localhost:8081"

echo "=== Healthcheck ==="
curl -s "$BASE/api/healthcheck" | python3 -m json.tool

echo ""
echo "=== Login ==="
TOKEN=$(curl -s -X POST "$BASE/api/login" \
    -F "username=admin" \
    -F "password=embryo2024" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token: $TOKEN"

echo ""
echo "=== Predict (mock with a test image) ==="
# Create a tiny test image
python3 -c "
from PIL import Image
img = Image.new('RGB', (300, 300), color=(100, 150, 180))
img.save('/tmp/test_embryo.jpg')
print('Created /tmp/test_embryo.jpg')
"

curl -s -X POST "$BASE/api/stork/predict" \
    -H "Authorization: Bearer $TOKEN" \
    -F 'data={"maternalAge": 32.5}' \
    -F "images=@/tmp/test_embryo.jpg" | python3 -m json.tool
