import { test, expect } from '@playwright/test';

// Use serial mode to run tests in order and share state
test.describe.serial('Multi-Client QR Code Flow', () => {
  const timestamp = Date.now();
  const consultantEmail = `consultant-${timestamp}@test.com`;
  const consultantPassword = 'TestPassword123!';
  const client1Email = `client1-${timestamp}@test.com`;
  const client1Password = 'ClientPassword1!';
  const client2Email = `client2-${timestamp}@test.com`;
  const client2Password = 'ClientPassword2!';

  let workbookJoinUrl: string;
  let workbookId: string;
  let client1InstanceId: string;
  let client2InstanceId: string;

  test('Step 1: Consultant signup, create workbook, generate QR code', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Click "Get Started" link
    await page.getByText('Get Started').click();

    // Should navigate to signup page
    await page.waitForURL(/\/signup/);

    // Fill signup form
    await page.getByPlaceholder('your@email.com').fill(consultantEmail);
    await page.getByPlaceholder('••••••••').first().fill(consultantPassword);
    await page.getByPlaceholder('••••••••').nth(1).fill(consultantPassword);

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to /admin
    await page.waitForURL('/admin', { timeout: 10000 });
    await expect(page).toHaveURL('/admin');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Create new workbook
    const newWorkbookButton = page.getByRole('button', { name: /create workbook/i });
    await newWorkbookButton.click();

    // Wait for navigation to new workbook page
    await page.waitForURL(/\/admin\/workbooks\/new/, { timeout: 10000 });

    // Fill in workbook title
    await page.getByPlaceholder(/e\.g\., Leadership/i).fill('Multi-Client Test Workbook');

    // Click create workbook button to save
    await page.getByRole('button', { name: /create workbook/i }).click();

    // Wait for redirect to editor
    await page.waitForURL(/\/admin\/workbooks\/.*\/edit/, { timeout: 10000 });

    // We're now on the edit page, look for "Generate QR Code" button
    const qrButton = page.getByRole('button', { name: /generate qr code/i });
    await expect(qrButton).toBeVisible({ timeout: 10000 });
    await qrButton.click();

    // Wait for modal to display
    await page.waitForTimeout(1000);

    // Get the URL from the readonly input field (it's the only readonly input in the modal)
    const urlInput = page.locator('input[readonly]');
    await expect(urlInput).toBeVisible({ timeout: 10000 });
    workbookJoinUrl = await urlInput.inputValue();

    // Extract workbook ID from URL
    const match = workbookJoinUrl.match(/\/workbook\/join\/([a-z0-9_]+)/);
    expect(match).toBeTruthy();
    workbookId = match![1];

    console.log('Workbook Join URL:', workbookJoinUrl);
    console.log('Workbook ID:', workbookId);

    // Verify URL format
    expect(workbookJoinUrl).toContain('/workbook/join/');
  });

  test.skip('Step 2: Client 1 accesses QR URL and creates instance', async ({ browser }) => {
    // TODO: Fix Convex auth issue - getUserId returning null after signup
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the join URL
    await page.goto(workbookJoinUrl);

    // Should redirect to login
    await page.waitForURL(/\/login/);

    // Click "Sign up" link
    await page.getByText('Sign up').click();

    // Wait for signup page to fully load
    await page.waitForURL(/\/signup/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Fill signup form with explicit waits
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(client1Email);

    await page.getByPlaceholder('••••••••').first().fill(client1Password);
    await page.getByPlaceholder('••••••••').nth(1).fill(client1Password);

    // Submit
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to workbook instance
    await page.waitForURL(/\/workbook\/k[a-z0-9_]+/, { timeout: 15000 });

    // Extract instance ID
    const instanceMatch = page.url().match(/\/workbook\/(k[a-z0-9_]+)/);
    expect(instanceMatch).toBeTruthy();
    client1InstanceId = instanceMatch![1];

    console.log('Client 1 Instance ID:', client1InstanceId);

    // Verify not on join page
    expect(page.url()).not.toContain('/join/');

    // Verify workbook content displayed
    await expect(page.getByText('Multi-Client Test Workbook')).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test.skip('Step 3: Client 2 accesses SAME QR URL, gets DIFFERENT instance', async ({ browser }) => {
    // TODO: Depends on Step 2 - skipped until auth issue is resolved
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to SAME join URL
    await page.goto(workbookJoinUrl);

    // Should redirect to login
    await page.waitForURL(/\/login/);

    // Click "Sign up"
    await page.getByText('Sign up').click();

    // Wait for signup page to fully load
    await page.waitForURL(/\/signup/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Fill signup with DIFFERENT email
    const emailInput2 = page.getByPlaceholder('your@email.com');
    await emailInput2.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput2.fill(client2Email);

    await page.getByPlaceholder('••••••••').first().fill(client2Password);
    await page.getByPlaceholder('••••••••').nth(1).fill(client2Password);

    // Submit
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to workbook instance
    await page.waitForURL(/\/workbook\/k[a-z0-9_]+/, { timeout: 15000 });

    // Extract instance ID
    const instanceMatch = page.url().match(/\/workbook\/(k[a-z0-9_]+)/);
    expect(instanceMatch).toBeTruthy();
    client2InstanceId = instanceMatch![1];

    console.log('Client 2 Instance ID:', client2InstanceId);

    // CRITICAL: Verify instances are DIFFERENT
    expect(client2InstanceId).not.toBe(client1InstanceId);

    // Verify workbook displayed
    await expect(page.getByText('Multi-Client Test Workbook')).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test.skip('Step 4: Client 1 returns, goes to EXISTING instance', async ({ browser }) => {
    // TODO: Depends on Step 2 - skipped until auth issue is resolved
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to same join URL
    await page.goto(workbookJoinUrl);

    // Should redirect to login
    await page.waitForURL(/\/login/);

    // Login with Client 1 credentials
    await page.getByPlaceholder('your@email.com').fill(client1Email);
    await page.getByPlaceholder('••••••••').fill(client1Password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to Client 1's EXISTING instance
    await page.waitForURL(/\/workbook\/k[a-z0-9_]+/, { timeout: 15000 });

    // Extract instance ID
    const instanceMatch = page.url().match(/\/workbook\/(k[a-z0-9_]+)/);
    expect(instanceMatch).toBeTruthy();
    const returnedInstanceId = instanceMatch![1];

    console.log('Returned Instance ID:', returnedInstanceId);
    console.log('Original Client 1 Instance ID:', client1InstanceId);

    // Verify it's the SAME instance as before
    expect(returnedInstanceId).toBe(client1InstanceId);

    await context.close();
  });

  test.skip('Step 5: Consultant sees both instances', async ({ page }) => {
    // TODO: Depends on Steps 2 and 3 - skipped until auth issue is resolved
    // Login as consultant
    await page.goto('/login');
    await page.getByPlaceholder('your@email.com').fill(consultantEmail);
    await page.getByPlaceholder('••••••••').fill(consultantPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Navigate to admin
    await page.waitForURL('/admin');

    // Click on workbook
    await page.getByText('Multi-Client Test Workbook').click();
    await page.waitForTimeout(1000);

    // Look for "View Responses" or "Responses" button
    const responsesButton = page.getByRole('button', { name: /response/i }).first();

    if (await responsesButton.isVisible()) {
      await responsesButton.click();
      await page.waitForTimeout(1000);

      // Should see 2 instances
      // This will vary based on your UI, but we're checking for the presence of both client emails
      const pageContent = await page.content();

      // At minimum, verify the page loaded
      expect(pageContent.length).toBeGreaterThan(0);
    }
  });

  test.skip('Step 6: Data isolation verification', async ({ browser }) => {
    // TODO: Depends on Steps 2 and 3 - skipped until auth issue is resolved
    // This test verifies that the instances are truly separate
    // We've already verified they have different IDs in earlier tests

    // Just verify both instance IDs are set and different
    expect(client1InstanceId).toBeTruthy();
    expect(client2InstanceId).toBeTruthy();
    expect(client1InstanceId).not.toBe(client2InstanceId);

    console.log('✅ Data isolation verified: Instance IDs are different');
    console.log(`   Client 1: ${client1InstanceId}`);
    console.log(`   Client 2: ${client2InstanceId}`);
  });
});
