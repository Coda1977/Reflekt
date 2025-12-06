# Reflekt Testing Guide

## Manual Testing Checklist

This document outlines the critical user flows to test before deploying.

### 1. Consultant Signup & Workbook Creation

**Steps:**
1. Visit homepage at `/`
2. Click "Get Started"
3. Create account with `consultant@example.com` / password
4. Should redirect to `/admin`
5. Click "New Workbook"
6. Create a workbook with:
   - Title: "Test Workbook"
   - Add Section → Page → Blocks (text, input, checkbox)
7. Click "Save Changes"
8. Verify workbook appears in list

**Expected Result:** ✅ Consultant can create and save workbooks

---

### 2. QR Code Generation (One Code for All Clients)

**Steps:**
1. From workbook editor, click "Generate QR Code"
2. Verify URL format: `/workbook/join/{workbookId}`
3. Copy the link
4. Download QR code image

**Expected Result:** ✅ Single QR code/link generated (not per-instance)

---

### 3. Client Access via QR Code (Multiple Clients, Same Code)

**Test Case A: New Client**

**Steps:**
1. Open QR code link in incognito window
2. Should redirect to `/login?redirect=/workbook/join/{workbookId}`
3. Click "Sign up"
4. Create account with `client1@example.com` / password
5. System should auto-create instance and redirect to `/workbook/{instanceId}`
6. Fill in some answers
7. Verify auto-save works (see "Saving..." indicator)
8. Navigate through pages with Next/Previous buttons

**Expected Result:** ✅ Client 1 gets their own private workbook instance

**Test Case B: Second Client (Same QR Code)**

**Steps:**
1. Open SAME QR code link in NEW incognito window
2. Sign up with `client2@example.com` / password
3. Should get redirected to `/workbook/{differentInstanceId}`
4. Fill in DIFFERENT answers than Client 1
5. Verify data is isolated

**Expected Result:** ✅ Client 2 gets a SEPARATE instance with isolated data

**Test Case C: Returning Client**

**Steps:**
1. Client 1 logs out and scans QR code again
2. Logs in with existing account
3. Should redirect to their EXISTING instance (not create new one)
4. Previous answers should still be there

**Expected Result:** ✅ Returning clients go to existing instance

---

### 4. Consultant Views Client Responses

**Steps:**
1. Login as consultant
2. Go to `/admin/workbooks`
3. Click "View Responses" on test workbook
4. Should see list of instances (Client 1, Client 2, etc.)
5. Click on each instance to view their responses
6. Verify correct data for each client

**Expected Result:** ✅ Consultant sees all client responses separately

---

### 5. Drag & Drop Editor

**Steps:**
1. Edit existing workbook
2. Add multiple blocks to a page
3. Hover over blocks to see drag handles (⋮⋮)
4. Drag blocks to reorder them
5. Drag pages to reorder within section
6. Drag sections to reorder
7. Save and verify order persists

**Expected Result:** ✅ Drag-and-drop works for blocks, pages, and sections

---

### 6. Word Import

**Steps:**
1. Create new workbook
2. Click "Import from Word"
3. Upload a .docx file with:
   - Heading 1 → Sections
   - Heading 2 → Pages
   - Regular text → Text blocks
   - Colored/highlighted text → Input fields
4. Verify structure is correctly imported
5. Edit imported content
6. Save

**Expected Result:** ✅ Word documents import correctly with proper structure

---

### 7. Auto-Save & Error Handling

**Test Case A: Normal Auto-Save**

**Steps:**
1. As client, fill in an input field
2. Wait 1 second
3. Should see "Saving..." indicator
4. Refresh page
5. Answer should still be there

**Expected Result:** ✅ Auto-save works within 1 second

**Test Case B: Network Error Resilience**

**Steps:**
1. Open DevTools → Network tab
2. Throttle to "Offline"
3. Try typing in input
4. Should see error message after retries
5. Re-enable network
6. Type again
7. Should save successfully

**Expected Result:** ✅ Retry logic works, user sees error when offline

---

### 8. Authentication & Authorization

**Test Case A: Protected Routes**

**Steps:**
1. Logout
2. Try accessing `/admin` directly
3. Should redirect to `/login?redirect=/admin`
4. Try accessing `/admin/workbooks`
5. Should redirect to login

**Expected Result:** ✅ Protected routes require authentication

**Test Case B: Role-Based Access**

**Steps:**
1. Login as client
2. Try accessing `/admin` directly
3. Should be blocked or redirected
4. Clients should only access `/home` and `/workbook/{instanceId}`

**Expected Result:** ✅ Clients cannot access consultant routes

---

### 9. Concurrent Users (30+ Users Test)

**Steps:**
1. Generate one QR code for a workbook
2. Share link with 30 different people (or open 30 incognito windows)
3. Each person signs up and works on workbook simultaneously
4. All should be able to work without conflicts
5. Check database - should have 30 separate instances

**Expected Result:** ✅ System handles 30+ concurrent users

---

### 10. Homepage Smart Redirect

**Test Case A: Unauthenticated User**

**Steps:**
1. Logout
2. Visit `/`
3. Should see landing page with "Get Started" and "Sign In"

**Expected Result:** ✅ Landing page shows for logged-out users

**Test Case B: Consultant Auto-Redirect**

**Steps:**
1. Login as consultant
2. Visit `/`
3. Should auto-redirect to `/admin`

**Expected Result:** ✅ Consultants auto-redirect to admin

**Test Case C: Client Auto-Redirect**

**Steps:**
1. Login as client
2. Visit `/`
3. Should auto-redirect to `/home`

**Expected Result:** ✅ Clients auto-redirect to home

---

## Regression Testing After Deploy

After deploying to production, verify:

1. ✅ Homepage loads at `https://reflekt.tinymanager.ai`
2. ✅ SSL certificate is valid
3. ✅ QR codes generate correct production URLs
4. ✅ Convex backend is connected
5. ✅ Sign up/login works
6. ✅ Auto-save works
7. ✅ Email/password authentication works

---

## Known Issues / Limitations

- Browser cache errors in dev mode (safe to ignore)
- Build warnings for routes-manifest.json (Next.js cache issue, doesn't affect production)

---

## Performance Benchmarks

Expected metrics:
- Page load: < 2 seconds
- Auto-save latency: < 200ms
- QR code generation: < 1 second
- Concurrent users: 30+ without degradation
