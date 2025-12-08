# Google Calendar OAuth 2.0 Setup Guide

## Overview

The Planner API needs to create calendar events on your Google Calendar. This requires completing the OAuth 2.0 authentication flow to get a valid refresh token.

**Current Status:**
- ✅ Google Cloud project created
- ✅ Google Calendar API enabled
- ✅ Client ID and Secret configured
- ⏳ **TODO**: Complete OAuth flow to get refresh token

## What We Have

```
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

These values are stored in your local .env file (NOT committed to git).

## What We Need

An OAuth **refresh token** that allows the Planner API to access your calendar without manual login each time.

## Step-by-Step OAuth Flow

### Option A: Complete OAuth Flow (Recommended)

#### Step 1: Trigger OAuth Authorization

Visit this URL in your browser (substitute your actual client ID):
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=<YOUR_GOOGLE_CLIENT_ID>.apps.googleusercontent.com&redirect_uri=https://planner.bestviable.com/oauth/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar&access_type=offline&prompt=consent
```

**Note:** Get your actual Google Client ID from `/Users/davidkellam/workspace/portfolio/.env` file (GOOGLE_CLIENT_ID variable).

**What this does:**
- Redirects you to Google login
- Asks to authorize "Planner API" to access your calendar
- Returns an authorization code to Traefik (redirects to /oauth/callback)

#### Step 2: Click "Allow"

1. Sign in with your Google account (if not already signed in)
2. Read the permission request: "Planner API wants to access your Google Calendar"
3. **Click "Allow"**
4. You'll be redirected to: `https://planner.bestviable.com/oauth/callback?code=...&state=...`

#### Step 3: Credentials Saved Automatically

The Planner API `/oauth/callback` endpoint will:
1. Receive the authorization code
2. Exchange it for a **refresh token** + **access token**
3. Save both to `/home/david/services/planner-api/credentials/gcal_token.json` (on droplet)
4. Return success message: `{"status": "success", "message": "Google Calendar connected"}`

#### Step 4: Verify Credentials Were Saved

SSH to droplet and verify:
```bash
ssh droplet "cat /home/david/services/planner-api/credentials/gcal_token.json | jq ."
```

**Expected output:**
```json
{
  "token": "ya29.a0AfH6SMBxxxxxxxxxxxxxxxx...",
  "refresh_token": "1//0gxxxxxxxxxxxxxxxx...",
  "token_uri": "https://oauth2.googleapis.com/token",
  "client_id": "<YOUR_GOOGLE_CLIENT_ID>.apps.googleusercontent.com",
  "client_secret": "<YOUR_GOOGLE_CLIENT_SECRET>",
  "scopes": ["https://www.googleapis.com/auth/calendar"]
}
```

#### Step 5: Restart Planner API

```bash
ssh droplet "cd /home/david/services/planner-api && docker-compose restart planner-api"
sleep 5
```

#### Step 6: Verify Google Calendar is Working

Check health endpoint:
```bash
curl -s http://planner.bestviable.com/health | jq '.dependencies[] | select(.name == "google-calendar")'
```

**Expected output:**
```json
{
  "name": "google-calendar",
  "status": "up",
  "details": "ok"
}
```

### Option B: Manual Token Generation (If Option A Fails)

If the redirect doesn't work, manually generate the token:

#### Step 1: Get Authorization Code

```bash
# Get these from /Users/davidkellam/workspace/portfolio/.env
GOOGLE_CLIENT_ID="<YOUR_CLIENT_ID>"  # From .env GOOGLE_CLIENT_ID
REDIRECT_URI="https://planner.bestviable.com/oauth/callback"
SCOPE="https://www.googleapis.com/auth/calendar"

# Construct authorization URL
echo "Visit this URL in your browser:"
echo "https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&access_type=offline&prompt=consent"
```

1. Copy the URL and open in browser
2. Allow access
3. You'll be redirected to a URL like: `https://planner.bestviable.com/oauth/callback?code=4/0AX4XfWXXX...`
4. **Copy the `code` parameter value** (between `code=` and `&state=`)

#### Step 2: Exchange Code for Tokens

```bash
# Get these from /Users/davidkellam/workspace/portfolio/.env
GOOGLE_CLIENT_ID="<YOUR_CLIENT_ID>"
GOOGLE_CLIENT_SECRET="<YOUR_CLIENT_SECRET>"
AUTHORIZATION_CODE="4/0AX4XfWXXX..."  # From Step 1
REDIRECT_URI="https://planner.bestviable.com/oauth/callback"

curl -X POST https://oauth2.googleapis.com/token \
  -d "code=${AUTHORIZATION_CODE}" \
  -d "client_id=${GOOGLE_CLIENT_ID}" \
  -d "client_secret=${GOOGLE_CLIENT_SECRET}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "grant_type=authorization_code"
```

**Expected response:**
```json
{
  "access_token": "ya29.a0AfH6SMBxxxxxxxxxxxxxxxx...",
  "expires_in": 3599,
  "refresh_token": "1//0gxxxxxxxxxxxxxxxx...",
  "scope": "https://www.googleapis.com/auth/calendar",
  "token_type": "Bearer"
}
```

#### Step 3: Save Token Manually

SSH to droplet:
```bash
# Update the values from your Step 2 response (access_token, refresh_token)
ssh droplet "cat > /home/david/services/planner-api/credentials/gcal_token.json << 'EOF'
{
  "token": "<YOUR_ACCESS_TOKEN_FROM_STEP_2>",
  "refresh_token": "<YOUR_REFRESH_TOKEN_FROM_STEP_2>",
  "token_uri": "https://oauth2.googleapis.com/token",
  "client_id": "<YOUR_GOOGLE_CLIENT_ID>",
  "client_secret": "<YOUR_GOOGLE_CLIENT_SECRET>",
  "scopes": ["https://www.googleapis.com/auth/calendar"]
}
EOF
"
```

#### Step 4: Restart and Verify

```bash
ssh droplet "cd /home/david/services/planner-api && docker-compose restart planner-api"
sleep 5
curl -s http://planner.bestviable.com/health | jq '.dependencies[] | select(.name == "google-calendar")'
```

## Testing Calendar Integration

### Test 1: Create a Plan

```bash
curl -X POST http://planner.bestviable.com/api/v1/planner/plan \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Create a customer onboarding plan",
    "context": {"client_id": 1}
  }' | jq '.plan_id'
```

Save the `plan_id` from the response (e.g., `4`)

### Test 2: Schedule Plan to Calendar

```bash
curl -X POST http://planner.bestviable.com/api/v1/scheduler/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 4,
    "start_date": "2025-12-15",
    "client_id": 1
  }' | jq .
```

**Expected response:**
```json
{
  "scheduler_run_id": 1,
  "plan_id": 4,
  "events_created": 8,
  "calendar_events": [
    {
      "id": "event123abc",
      "summary": "Initial Welcome and Kickoff",
      "start": {"dateTime": "2025-12-15T09:00:00-08:00"},
      "end": {"dateTime": "2025-12-15T11:00:00-08:00"}
    },
    ...
  ]
}
```

### Test 3: Verify Events in Google Calendar

1. Go to **Google Calendar**: https://calendar.google.com
2. Look for events from December 15 onwards
3. You should see 8 new calendar events from your plan

## Troubleshooting

### Issue 1: "Google Calendar credentials not found"

**Problem:** Health check shows "service-not-initialized"

**Solution:**
```bash
ssh droplet "ls -la /home/david/services/planner-api/credentials/gcal*.json"
```

If no files exist, complete the OAuth flow again (Option A, Step 1)

### Issue 2: 401 "Unauthorized" When Scheduling

**Problem:** `Error code: 401 - Invalid Credentials`

**Possible causes:**
1. **Token expired**: OAuth tokens expire after ~1 hour, then refresh using refresh_token
   - Solution: Delete `gcal_token.json` and redo OAuth flow
2. **Refresh token invalid**: Refresh token only works once per authorization
   - Solution: Redo OAuth flow with `prompt=consent`
3. **Scopes insufficient**: Calendar scope not included
   - Solution: Redo OAuth flow with full scope

### Issue 3: Calendar Events Not Appearing

**Problem:** Scheduler returns success but no events in Google Calendar

**Debug steps:**
1. Check health: `curl -s http://planner.bestviable.com/health | jq`
2. Check logs: `ssh droplet "docker-compose -f /home/david/services/planner-api logs planner-api | grep -i calendar"`
3. Verify credentials: `ssh droplet "cat /home/david/services/planner-api/credentials/gcal_token.json"`

### Issue 4: "Redirect URI Mismatch"

**Problem:** Error: `Redirect URI mismatch: https://planner.bestviable.com/oauth/callback is not registered`

**Solution:**
1. Go to **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. Click the OAuth 2.0 Client ID (under "OAuth 2.0 Client IDs")
3. **Authorized redirect URIs** section:
   - Add: `https://planner.bestviable.com/oauth/callback`
   - Add: `http://localhost:8091/oauth/callback` (for local testing)
4. **Save** and redo OAuth flow

## Security Considerations

1. **Refresh Token**: Saved in Docker container at `/app/credentials/gcal_token.json`
   - Only Planner API can read this file
   - Don't commit to git (already in .gitignore)

2. **Access Token**: Short-lived (1 hour), auto-refreshed using refresh_token
   - Automatically refreshed by Google Calendar SDK
   - No manual intervention needed

3. **Client Secret**: Stored in environment variable `GOOGLE_CLIENT_SECRET`
   - Don't expose in logs or share publicly

4. **Scope**: Limited to `https://www.googleapis.com/auth/calendar`
   - Only calendar access, no read access to other data

## Revocation & Re-authentication

If you want to revoke access or re-authenticate:

### Revoke Access
```bash
# This removes the app from your Google account
curl -X POST https://oauth2.googleapis.com/revoke?token=<REFRESH_TOKEN>
```

### Re-authenticate
1. Delete the token file: `ssh droplet "rm /home/david/services/planner-api/credentials/gcal_token.json"`
2. Complete OAuth flow again (Option A, Step 1)

## Next Steps

1. **Complete OAuth Flow**:
   - Visit the authorization URL (Option A, Step 1)
   - Click "Allow"
   - Credentials saved automatically

2. **Verify Setup**:
   - Check health endpoint
   - Test schedule endpoint
   - Verify events in Google Calendar

3. **Use in Production**:
   - Open WebUI functions now support `schedule_tasks` function
   - n8n can call scheduler endpoint for automated scheduling
   - Planner API will create calendar events automatically

## Resources

- **Google Calendar API Docs**: https://developers.google.com/calendar/api/guides/overview
- **OAuth 2.0 Guide**: https://developers.google.com/identity/protocols/oauth2
- **Planner API Docs**: http://planner.bestviable.com/docs

