import { test, expect } from '@playwright/test';

test('Debug: Join URL flow', async ({ page }) => {
  // Listen to console messages to capture errors
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Use a test workbook ID (we'll need to create one first)
  const workbookId = 'jh785vc2jvxmj0hxwsasny4cqd7wr6sn'; // From previous test output
  const joinUrl = `http://localhost:3000/workbook/join/${workbookId}`;
  const testEmail = `debug-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';

  console.log('Step 1: Navigate to join URL');
  await page.goto(joinUrl);
  console.log('Current URL after goto:', page.url());

  console.log('Step 2: Wait for redirect to login');
  await page.waitForURL(/\/login/, { timeout: 10000 });
  console.log('Current URL after login redirect:', page.url());

  // Check if redirect parameter is present
  const currentUrl = page.url();
  console.log('Full login URL:', currentUrl);
  expect(currentUrl).toContain('redirect=');

  console.log('Step 3: Click Sign up link');
  await page.getByText('Sign up').click();
  await page.waitForURL(/\/signup/, { timeout: 10000 });
  console.log('Current URL after signup click:', page.url());

  // Check if redirect parameter is preserved
  const signupUrl = page.url();
  console.log('Full signup URL:', signupUrl);
  expect(signupUrl).toContain('redirect=');

  console.log('Step 4: Fill signup form');
  await page.getByPlaceholder('your@email.com').fill(testEmail);
  await page.getByPlaceholder('••••••••').first().fill(testPassword);
  await page.getByPlaceholder('••••••••').nth(1).fill(testPassword);

  console.log('Step 5: Submit form');
  await page.getByRole('button', { name: /create account/i }).click();

  console.log('Step 6: Wait for redirect after signup');
  await page.waitForTimeout(2000);
  console.log('Current URL after signup submit:', page.url());

  // Wait longer to see where we end up
  await page.waitForTimeout(5000);
  console.log('Final URL after 5 seconds:', page.url());

  // Check if we're on the join page
  if (page.url().includes('/join/')) {
    console.log('✓ On join page, waiting for instance creation...');
    await page.waitForTimeout(3000);
    console.log('URL after waiting on join page:', page.url());
  }

  // Check for any errors on the page
  const pageText = await page.textContent('body');
  if (pageText?.toLowerCase().includes('error')) {
    console.log('⚠️ Found error text on page');
  }

  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/debug-join-flow.png', fullPage: true });

  // Print all console messages
  console.log('\n=== Browser Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));
  console.log('=== End Console Messages ===\n');
});
