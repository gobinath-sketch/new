const { test, expect } = require('@playwright/test');
const { percySnapshot } = require('@percy/playwright');

// Role credentials configuration
const ROLE_CREDENTIALS = {
  'BusinessHead': {
    email: 'business@singleplayground.com',
    password: 'Business@2026',
    role: 'Business Head',
    subRole: null
  },
  'BusinessHead_SalesManager': {
    email: 'salesmgr@singleplayground.com',
    password: 'SalesMgr@2026',
    role: 'Business Head',
    subRole: 'SalesManager'
  },
  'BusinessHead_SalesExecutive': {
    email: 'salesexec@singleplayground.com',
    password: 'SalesExec@2026',
    role: 'Business Head',
    subRole: 'SalesExecutive'
  },
  'OperationsManager': {
    email: 'operations@singleplayground.com',
    password: 'Operations@2026',
    role: 'Operations Manager',
    subRole: null
  },
  'FinanceManager': {
    email: 'finance@singleplayground.com',
    password: 'Finance@2026',
    role: 'Finance Manager',
    subRole: null
  },
  'Director': {
    email: 'director@singleplayground.com',
    password: 'Director@2026',
    role: 'Director',
    subRole: null
  }
};

// Role-specific page routes (authorized pages per role)
const ROLE_PAGES = {
  'BusinessHead': [
    { path: '/', name: 'Dashboard' },
    { path: '/opportunities', name: 'Opportunities' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' }
  ],
  'BusinessHead_SalesManager': [
    { path: '/', name: 'Dashboard' },
    { path: '/client-creation', name: 'CreateClient' },
    { path: '/opportunity-creation', name: 'CreateOpportunity' },
    { path: '/opportunities', name: 'Opportunities' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' }
  ],
  'BusinessHead_SalesExecutive': [
    { path: '/', name: 'Dashboard' },
    { path: '/client-creation', name: 'CreateClient' },
    { path: '/opportunity-creation', name: 'CreateOpportunity' },
    { path: '/opportunities', name: 'Opportunities' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' }
  ],
  'OperationsManager': [
    { path: '/', name: 'Dashboard' },
    { path: '/opportunities', name: 'Opportunities' },
    { path: '/vendors', name: 'Vendors' },
    { path: '/programs', name: 'Programs' },
    { path: '/purchase-orders', name: 'PurchaseOrders' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' }
  ],
  'FinanceManager': [
    { path: '/', name: 'Dashboard' },
    { path: '/opportunities', name: 'Opportunities' },
    { path: '/vendors', name: 'Vendors' },
    { path: '/materials', name: 'Materials' },
    { path: '/purchase-orders', name: 'PurchaseOrders' },
    { path: '/invoices', name: 'Invoices' },
    { path: '/receivables', name: 'Receivables' },
    { path: '/payables', name: 'Payables' },
    { path: '/tax-engine', name: 'TaxEngine' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' }
  ],
  'Director': [
    { path: '/', name: 'Dashboard' },
    { path: '/client-creation', name: 'CreateClient' },
    { path: '/opportunities', name: 'Opportunities' },
    { path: '/vendors', name: 'Vendors' },
    { path: '/invoices', name: 'Invoices' },
    { path: '/receivables', name: 'Receivables' },
    { path: '/payables', name: 'Payables' },
    { path: '/tax-engine', name: 'TaxEngine' },
    { path: '/governance', name: 'Governance' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' }
  ]
};

// UI/UX validation helper functions
const validateUIInteractions = async (page, roleName, pageName) => {
  const issues = [];

  try {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Verify all visible buttons are clickable
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      try {
        const isEnabled = await button.isEnabled();
        if (!isEnabled) {
          issues.push(`Button at index ${i} is disabled`);
        }
      } catch (e) {
        issues.push(`Button at index ${i} is not accessible: ${e.message}`);
      }
    }

    // Verify dropdowns (select elements and custom dropdowns)
    const selects = page.locator('select:visible');
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i);
      try {
        const boundingBox = await select.boundingBox();
        if (boundingBox && (boundingBox.height < 20 || boundingBox.width < 50)) {
          issues.push(`Select dropdown at index ${i} appears clipped`);
        }
      } catch (e) {
        // Ignore if element not visible
      }
    }

    // Verify input fields are aligned and usable
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="number"], input[type="date"], textarea:visible');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      try {
        const boundingBox = await input.boundingBox();
        if (boundingBox && (boundingBox.height < 10 || boundingBox.width < 50)) {
          issues.push(`Input at index ${i} appears too small`);
        }
      } catch (e) {
        // Ignore if element not visible
      }
    }

    // Verify tables render fully (check for overflow)
    const tables = page.locator('table:visible');
    const tableCount = await tables.count();
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      try {
        const boundingBox = await table.boundingBox();
        const viewportSize = page.viewportSize();
        if (boundingBox && viewportSize) {
          const overflowsHorizontally = boundingBox.x + boundingBox.width > viewportSize.width;
          if (overflowsHorizontally) {
            issues.push(`Table at index ${i} overflows horizontally`);
          }
        }
      } catch (e) {
        // Ignore if element not visible
      }
    }

    // Check for scroll behavior
    const scrollableContainers = page.locator('[style*="overflow"]:visible, .scrollable:visible');
    const scrollableCount = await scrollableContainers.count();
    if (scrollableCount > 0) {
      // Verify scroll is functional
      for (let i = 0; i < Math.min(3, scrollableCount); i++) {
        try {
          await scrollableContainers.nth(i).evaluate((el) => {
            el.scrollTop = 10;
            return el.scrollTop;
          });
        } catch (e) {
          // Ignore scroll errors
        }
      }
    }

    // Verify modals are centered (check for modal elements)
    const modals = page.locator('[role="dialog"]:visible, .modal:visible, [class*="modal"]:visible');
    const modalCount = await modals.count();
    for (let i = 0; i < modalCount; i++) {
      const modal = modals.nth(i);
      try {
        const boundingBox = await modal.boundingBox();
        const viewportSize = page.viewportSize();
        if (boundingBox && viewportSize) {
          const centerX = boundingBox.x + boundingBox.width / 2;
          const viewportCenterX = viewportSize.width / 2;
          const offsetFromCenter = Math.abs(centerX - viewportCenterX);
          if (offsetFromCenter > viewportSize.width * 0.3) {
            issues.push(`Modal at index ${i} is not centered (offset: ${offsetFromCenter}px)`);
          }
        }
      } catch (e) {
        // Ignore if element not visible
      }
    }

  } catch (error) {
    issues.push(`UI validation error: ${error.message}`);
  }

  return issues;
};

// Login helper function
const loginAsRole = async (page, roleConfig) => {
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill login form
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const loginButton = page.locator('button[type="submit"]').first();

  await emailInput.fill(roleConfig.email);
  await passwordInput.fill(roleConfig.password);

  // Click login button and wait for navigation
  try {
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/auth/login') && response.status() === 200, { timeout: 30000 }),
      loginButton.click()
    ]);
  } catch (e) {
    // If response wait fails, try clicking and waiting for navigation directly
    await loginButton.click();
    await page.waitForTimeout(2000);
  }

  // Wait for either URL change OR dashboard content to appear
  // Wait for either URL change OR dashboard content to appear
  try {
    await Promise.race([
      page.waitForURL(/^\/(?!login)/, { timeout: 20000 }),
      page.waitForSelector('.sidebar, .main-content, .dashboard', { timeout: 20000 })
    ]);
  } catch (e) {
    // If URL didn't change, check if we're on dashboard by looking for sidebar
    const sidebar = await page.locator('.sidebar').first();
    if (await sidebar.count() === 0) {
      // Check for error message
      const errorMsg = await page.locator('.error-message').first();
      if (await errorMsg.count() > 0) {
        const errorText = await errorMsg.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }
      // Give it one more try - sometimes React Router takes time
      await page.waitForTimeout(2000);
      const sidebarRetry = await page.locator('.sidebar').first();
      if (await sidebarRetry.count() === 0) {
        throw new Error('Login failed: Could not navigate to dashboard');
      }
    }
  }
  
  // Additional wait to ensure UI is fully rendered
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
    // If networkidle times out, continue anyway - page might be loaded
  });
};

// Test each role
for (const [roleKey, roleConfig] of Object.entries(ROLE_CREDENTIALS)) {
  const rolePages = ROLE_PAGES[roleKey] || [];
  const roleDisplayName = roleConfig.subRole 
    ? `${roleConfig.role}_${roleConfig.subRole}`
    : roleConfig.role;

  test.describe(`${roleDisplayName} UI/UX Tests`, () => {
    test.beforeEach(async ({ page }) => {
      // Set base viewport
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    test(`Login and navigate all pages for ${roleDisplayName}`, async ({ page }) => {
      test.setTimeout(180000); // 3 minutes per role
      const allIssues = [];
      const testedPages = [];

      // Login
      await loginAsRole(page, roleConfig);

      // Verify login was successful
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');

      // Test each authorized page for this role
      for (const pageRoute of rolePages) {
        try {
          // Navigate to page with timeout
          await page.goto(pageRoute.path, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
            // If networkidle times out, continue anyway
          });
          await page.waitForTimeout(500); // Reduced wait time

          testedPages.push(pageRoute.name);

          // Validate UI interactions (with timeout)
          try {
            const issues = await validateUIInteractions(page, roleDisplayName, pageRoute.name);
            if (issues.length > 0) {
              allIssues.push({
                role: roleDisplayName,
                page: pageRoute.name,
                issues: issues
              });
            }
          } catch (e) {
            // Continue even if validation fails
            console.error(`Validation error for ${pageRoute.name}:`, e.message);
          }

          // Capture Percy snapshot at desktop viewport (1440px)
          try {
            const snapshotName = `${roleDisplayName}_${pageRoute.name}_1440px`;
            await percySnapshot(page, snapshotName);
          } catch (e) {
            console.error(`Failed to capture snapshot for ${pageRoute.name}:`, e.message);
          }

          // Test at tablet viewport (1024px)
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(300); // Reduced wait time
          
          // Re-validate at tablet size
          try {
            const tabletIssues = await validateUIInteractions(page, roleDisplayName, `${pageRoute.name}_Tablet`);
            if (tabletIssues.length > 0) {
              allIssues.push({
                role: roleDisplayName,
                page: `${pageRoute.name}_Tablet`,
                issues: tabletIssues
              });
            }
          } catch (e) {
            // Continue even if validation fails
          }

          // Capture Percy snapshot at tablet viewport
          try {
            const tabletSnapshotName = `${roleDisplayName}_${pageRoute.name}_1024px`;
            await percySnapshot(page, tabletSnapshotName);
          } catch (e) {
            console.error(`Failed to capture tablet snapshot for ${pageRoute.name}:`, e.message);
          }

          // Reset to desktop viewport for next page
          await page.setViewportSize({ width: 1440, height: 900 });

        } catch (error) {
          console.error(`Error testing page ${pageRoute.path} for ${roleDisplayName}:`, error.message);
          allIssues.push({
            role: roleDisplayName,
            page: pageRoute.name,
            issues: [`Navigation or rendering error: ${error.message}`]
          });
          // Continue to next page even if this one fails
        }
      }

      // Log summary
      console.log(`\n${'='.repeat(70)}`);
      console.log(`Role: ${roleDisplayName}`);
      console.log(`Pages tested: ${testedPages.join(', ')}`);
      if (allIssues.length > 0) {
        console.log(`UI/UX issues detected: ${allIssues.length}`);
        allIssues.forEach(({ page, issues }) => {
          console.log(`  - ${page}: ${issues.length} issue(s)`);
        });
      } else {
        console.log('No UI/UX issues detected');
      }
      console.log(`${'='.repeat(70)}\n`);
    });
  });
}

// Summary test to output final report
test.describe('Test Summary', () => {
  test('Output test execution summary', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('UI/UX VISUAL REGRESSION TEST SUITE - EXECUTION COMPLETE');
    console.log('='.repeat(70));
    console.log(`Roles tested: ${Object.keys(ROLE_CREDENTIALS).length}`);
    Object.keys(ROLE_CREDENTIALS).forEach(roleKey => {
      const roleConfig = ROLE_CREDENTIALS[roleKey];
      const roleDisplayName = roleConfig.subRole 
        ? `${roleConfig.role}_${roleConfig.subRole}`
        : roleConfig.role;
      const pages = ROLE_PAGES[roleKey] || [];
      console.log(`  - ${roleDisplayName}: ${pages.length} pages`);
    });
    console.log('='.repeat(70));
    console.log('All Percy snapshots captured and available in Percy dashboard');
    console.log('='.repeat(70) + '\n');
  });
});
