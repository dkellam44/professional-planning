# n8n Workflow Updates Guide

## Overview
This guide documents the process for updating n8n workflows to work with the new Planner API architecture. The main tasks involve disabling Coda sync workflows and updating Observer trigger workflows to call the new Planner API endpoint.

**n8n Instance:** https://n8n.bestviable.com

---

## Table of Contents
1. [Workflows to Deactivate](#workflows-to-deactivate)
2. [Workflows to Keep Active](#workflows-to-keep-active)
3. [Deactivation Process](#deactivation-process)
4. [Update Process for Observer Triggers](#update-process-for-observer-triggers)
5. [Verification Steps](#verification-steps)
6. [Rollback Instructions](#rollback-instructions)

---

## Workflows to Deactivate

The following workflows sync data with Coda and should be disabled as they are no longer needed:

### 1. coda-to-calendar-sync
- **Purpose:** Syncs calendar events from Coda to your calendar
- **Status:** DISABLE
- **Action Required:** Deactivate and verify no data is being synced

### 2. calendar-to-coda-sync
- **Purpose:** Syncs calendar events back to Coda
- **Status:** DISABLE
- **Action Required:** Deactivate and verify no data is being written to Coda

### 3. Other Coda Sync Workflows
- Search for any additional workflows with "coda" in the name
- **Action Required:** Verify purpose and deactivate if related to Coda synchronization

---

## Workflows to Keep Active

The following workflows should remain active and function properly:

### 1. event-logger
- **Purpose:** Logs events for observability and debugging
- **Action Required:** No changes needed
- **Status:** KEEP ACTIVE

### 2. daily-observer-trigger
- **Purpose:** Triggers daily observer/reflection checks at 6 PM (daily)
- **Schedule:** `0 18 * * *` (6 PM every day, America/Los_Angeles timezone)
- **Action Required:** UPDATE HTTP Request node URL (see below)
- **Status:** KEEP ACTIVE

### 3. weekly-observer-trigger
- **Purpose:** Triggers weekly observer/reflection checks at 6 PM Friday
- **Schedule:** `0 18 * * 5` (6 PM every Friday, America/Los_Angeles timezone)
- **Action Required:** UPDATE HTTP Request node URL (see below)
- **Status:** KEEP ACTIVE

---

## Deactivation Process

### Step-by-Step: Deactivate Coda Sync Workflows

#### Step 1: Access n8n Dashboard
1. Navigate to https://n8n.bestviable.com
2. Log in with your credentials
3. You should see the Workflows page with a list of all active workflows

#### Step 2: Locate the Workflow
1. In the Workflows list, search for "coda-to-calendar-sync" using the search box at the top
2. Click on the workflow name to open it

**Screenshot Reference:**
```
Expected layout:
┌─────────────────────────────────────────┐
│ Workflows                               │
├─────────────────────────────────────────┤
│ [Search box] ↓                          │
├─────────────────────────────────────────┤
│ □ coda-to-calendar-sync      ✓ Active   │
│ □ calendar-to-coda-sync      ✓ Active   │
│ □ daily-observer-trigger     ✓ Active   │
│ □ weekly-observer-trigger    ✓ Active   │
│ □ event-logger               ✓ Active   │
└─────────────────────────────────────────┘
```

#### Step 3: Open Workflow Details
1. Click on the workflow row to open the workflow editor
2. You'll see the workflow canvas with nodes and connections

#### Step 4: Deactivate the Workflow
**Option A: Using the Toggle Switch (Recommended)**
1. Look at the top right corner of the workflow editor
2. You should see a toggle switch labeled "Active" or with a power icon (⚡)
3. Click the toggle to turn it OFF (the switch should turn grey/inactive)
4. Confirm the deactivation when prompted

**Option B: Using the Menu**
1. Click the "..." (more options) menu in the top right
2. Select "Deactivate" or "Disable"
3. Confirm when prompted

#### Step 5: Verify Deactivation
1. Return to the Workflows list (click "Workflows" in the left sidebar)
2. Locate the workflow in the list
3. Verify that the status indicator now shows "Inactive" (should be grey/crossed out)

#### Repeat for All Coda Workflows
1. Repeat Steps 2-5 for:
   - `calendar-to-coda-sync`
   - Any other workflows containing "coda" in the name

---

## Update Process for Observer Triggers

### Workflow 1: daily-observer-trigger

#### Step 1: Open the Workflow
1. Navigate to https://n8n.bestviable.com
2. Search for "daily-observer-trigger" in the Workflows list
3. Click to open the workflow editor

#### Step 2: Locate the HTTP Request Node
1. In the workflow canvas, look for a node labeled "HTTP Request"
2. This node contains the API call configuration
3. Click on the "HTTP Request" node to select it

**Visual Reference:**
```
Workflow Canvas:
┌──────────────┐       ┌──────────────┐
│   Cron       │──────▶│ HTTP Request │
│  (Schedule)  │       │  (API Call)  │
└──────────────┘       └──────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │   Response   │
                        │  (Logging)   │
                        └──────────────┘
```

#### Step 3: Update the URL
1. With the "HTTP Request" node selected, a panel will appear on the right side
2. Look for the "URL" field (usually at the top of the configuration panel)
3. Delete the current URL
4. **Enter the new URL exactly as shown:**
   ```
   http://planner-api:8091/api/v1/observer/reflect?mode=daily
   ```
5. Verify the method is set to `GET` or `POST` (depending on API requirements - typically POST)

#### Step 4: Verify Cron Schedule
1. Click on the "Cron" node in the workflow
2. Verify the schedule is set to: `0 18 * * *`
3. Verify the timezone is set to: `America/Los_Angeles`
4. This ensures the workflow runs at 6 PM Pacific Time daily
5. If changes are needed, update and save

#### Step 5: Save the Workflow
1. Click the "Save" button (usually in the top right or use Ctrl+S)
2. You should see a confirmation message

#### Step 6: Activate the Workflow
1. Ensure the workflow toggle is set to "Active" (green/on)
2. If not, click the toggle to activate it

---

### Workflow 2: weekly-observer-trigger

#### Step 1: Open the Workflow
1. Navigate to https://n8n.bestviable.com
2. Search for "weekly-observer-trigger" in the Workflows list
3. Click to open the workflow editor

#### Step 2: Locate the HTTP Request Node
1. In the workflow canvas, look for a node labeled "HTTP Request"
2. Click on the "HTTP Request" node to select it

#### Step 3: Update the URL
1. With the "HTTP Request" node selected, a panel will appear on the right side
2. Look for the "URL" field
3. Delete the current URL
4. **Enter the new URL exactly as shown:**
   ```
   http://planner-api:8091/api/v1/observer/reflect?mode=weekly
   ```
5. Verify the method is set to `GET` or `POST` (depending on API requirements - typically POST)

#### Step 4: Verify Cron Schedule
1. Click on the "Cron" node in the workflow
2. Verify the schedule is set to: `0 18 * * 5`
3. Verify the timezone is set to: `America/Los_Angeles`
4. This ensures the workflow runs at 6 PM Pacific Time every Friday
5. **Cron Reference:** `0 18 * * 5` means:
   - `0` = minute 0
   - `18` = hour 18 (6 PM)
   - `*` = every day of month
   - `*` = every month
   - `5` = Friday (0=Sunday, 5=Friday)

#### Step 5: Save the Workflow
1. Click the "Save" button (usually in the top right or use Ctrl+S)
2. You should see a confirmation message

#### Step 6: Activate the Workflow
1. Ensure the workflow toggle is set to "Active" (green/on)
2. If not, click the toggle to activate it

---

## Verification Steps

After completing all updates, perform the following verification steps:

### Verification Checklist

#### 1. Verify Coda Workflows are Deactivated
- [ ] Navigate to Workflows list
- [ ] Search for "coda"
- [ ] Confirm all Coda-related workflows show "Inactive" status
- [ ] No workflows with "coda" in the name should be active

#### 2. Verify Observer Workflows are Active
- [ ] Search for "daily-observer-trigger"
- [ ] Confirm status shows "Active" (green indicator)
- [ ] Search for "weekly-observer-trigger"
- [ ] Confirm status shows "Active" (green indicator)
- [ ] Search for "event-logger"
- [ ] Confirm status shows "Active" (green indicator)

#### 3. Manual Trigger Test for daily-observer-trigger
1. Open the "daily-observer-trigger" workflow
2. Click the "Execute Workflow" or "Test" button (usually in the top right)
3. Watch the workflow execution in the bottom panel
4. You should see:
   - Cron node triggers
   - HTTP Request node sends request to: `http://planner-api:8091/api/v1/observer/reflect?mode=daily`
   - Response node logs the response
5. **Expected Result:** Workflow completes without errors
6. Check the Planner API logs to confirm the request was received

#### 4. Manual Trigger Test for weekly-observer-trigger
1. Open the "weekly-observer-trigger" workflow
2. Click the "Execute Workflow" or "Test" button
3. Watch the workflow execution
4. You should see:
   - Cron node triggers
   - HTTP Request node sends request to: `http://planner-api:8091/api/v1/observer/reflect?mode=weekly`
   - Response node logs the response
5. **Expected Result:** Workflow completes without errors
6. Check the Planner API logs to confirm the request was received

#### 5. Check Planner API Logs
1. Access your Planner API logs/monitoring system
2. Search for requests to:
   - `/api/v1/observer/reflect?mode=daily`
   - `/api/v1/observer/reflect?mode=weekly`
3. Verify that test requests appear in the logs
4. Verify response codes are successful (2xx status codes)

#### 6. Monitor Next Scheduled Run
1. For `daily-observer-trigger`: Monitor the logs at 6 PM today (Pacific Time)
2. For `weekly-observer-trigger`: Monitor the logs at 6 PM on Friday (Pacific Time)
3. Verify that scheduled executions occur at the correct times
4. Check for any error messages in n8n or Planner API logs

---

## Rollback Instructions

If you need to undo these changes:

### Restore Coda Workflows
1. Navigate to Workflows list
2. Find the deactivated Coda workflow (you can filter by "Inactive" if available)
3. Click on the workflow
4. Click the toggle to re-activate it
5. Verify it shows "Active" status

### Restore Observer Trigger URLs (if needed)
1. Open the workflow (daily-observer-trigger or weekly-observer-trigger)
2. Click on the HTTP Request node
3. In the URL field, revert to the previous API endpoint
4. Save the workflow
5. Verify the workflow is still active

---

## Summary of Changes

### Workflows Affected: 5

#### Deactivate (2 confirmed + search for more):
- [x] coda-to-calendar-sync → **DEACTIVATE**
- [x] calendar-to-coda-sync → **DEACTIVATE**
- [ ] Other Coda sync workflows → **SEARCH AND DEACTIVATE**

#### Update (2):
- [x] daily-observer-trigger → **UPDATE URL** to `http://planner-api:8091/api/v1/observer/reflect?mode=daily`
- [x] weekly-observer-trigger → **UPDATE URL** to `http://planner-api:8091/api/v1/observer/reflect?mode=weekly`

#### Keep Active (1):
- [x] event-logger → **NO CHANGES**

---

## Key API Endpoints

The new Planner API endpoints for observer triggers:

| Workflow | Endpoint | Method | Schedule |
|----------|----------|--------|----------|
| daily-observer-trigger | `http://planner-api:8091/api/v1/observer/reflect?mode=daily` | POST | `0 18 * * *` (Daily at 6 PM PT) |
| weekly-observer-trigger | `http://planner-api:8091/api/v1/observer/reflect?mode=weekly` | POST | `0 18 * * 5` (Friday at 6 PM PT) |

---

## Support & Troubleshooting

### Common Issues

**Issue:** Workflow won't save
- **Solution:** Check for unsaved changes in other nodes, refresh the page and try again

**Issue:** HTTP Request returns error
- **Solution:**
  1. Verify the Planner API is running at `http://planner-api:8091`
  2. Check network connectivity
  3. Review API logs for detailed error messages
  4. Verify URL is entered exactly as specified

**Issue:** Cron schedule not triggering at expected time
- **Solution:**
  1. Verify timezone is set to `America/Los_Angeles`
  2. Check n8n system time synchronization
  3. Verify cron expression matches expected schedule
  4. Check n8n logs for scheduling errors

**Issue:** Can't locate a workflow
- **Solution:**
  1. Use the search box in the Workflows list
  2. Check if workflow might be named differently
  3. Filter by "Inactive" to find deactivated workflows
  4. Clear search and scroll through the full list

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-07 | Initial creation | Documentation |

---

## Next Steps

1. Review this documentation thoroughly
2. Ensure you have access to https://n8n.bestviable.com
3. Follow the step-by-step deactivation process
4. Follow the step-by-step update process for observer triggers
5. Complete all verification steps
6. Monitor scheduled runs over the next few days
7. Archive this documentation for future reference

