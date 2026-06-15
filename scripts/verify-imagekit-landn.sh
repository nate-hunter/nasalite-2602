#!/usr/bin/env bash
# Feature #13 — verify ImageKit /LandN can fetch app-media-items from hosted Supabase (S3 origins).
set -euo pipefail

PROJECT_REF="${SUPABASE_REMOTE_PROJECT_REF:-sxexcquvfdyfatfinxfw}"
FILE_PATH="${IMAGEKIT_TEST_FILE_PATH:-2026/04/test--origami-crane.png}"
IMAGEKIT_ENDPOINT="${NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT:-https://ik.imagekit.io/tig3rm4c/LandN}"

PUBLIC_URL="https://${PROJECT_REF}.supabase.co/storage/v1/object/public/app-media-items/${FILE_PATH}"
IMAGEKIT_URL="${IMAGEKIT_ENDPOINT}/${FILE_PATH}?tr=w-400,f-auto&ik-t=$(date +%s)"

echo "== Step 1: Hosted Supabase public REST (sanity) =="
PUBLIC_STATUS=$(curl -sI -o /dev/null -w "%{http_code}" "${PUBLIC_URL}")
echo "HEAD ${PUBLIC_URL}"
echo "→ HTTP ${PUBLIC_STATUS}"
if [[ "${PUBLIC_STATUS}" != "200" ]]; then
	echo "FAIL: Test file must exist on hosted app-media-items before ImageKit can serve it."
	echo "Upload via Supabase Dashboard → Storage → app-media-items, or set IMAGEKIT_TEST_FILE_PATH."
	exit 1
fi

echo ""
echo "== Step 2: ImageKit /LandN CDN =="
IK_HEADERS=$(curl -sI "${IMAGEKIT_URL}")
IK_STATUS=$(echo "${IK_HEADERS}" | awk '/^HTTP/{print $2}')
IK_ERROR=$(echo "${IK_HEADERS}" | awk -F': ' '/^ik-error:/{print $2}' | tr -d '\r')
SERVER_TIMING=$(echo "${IK_HEADERS}" | awk -F': ' '/^server-timing:/{print $2}' | tr -d '\r')
echo "HEAD ${IMAGEKIT_URL}"
echo "→ HTTP ${IK_STATUS}"
[[ -n "${IK_ERROR}" ]] && echo "→ ik-error: ${IK_ERROR}"
[[ -n "${SERVER_TIMING}" ]] && echo "→ server-timing: ${SERVER_TIMING}"

echo ""
if [[ "${IK_STATUS}" == "200" ]]; then
	echo "PASS: ImageKit /LandN returns 200."
	exit 0
fi

echo "FAIL: ImageKit /LandN returned ${IK_STATUS}."
echo "See __local/__docs/features/media-files-upload/260604--AGENT1--IMAGEKIT_CDN_PHASE0_PLATFORM_SETUP.md"
exit 1
