# Revenue Target Functionality Test

This test script verifies the Revenue Target functionality across all roles.

## Prerequisites

1. Backend server must be running on `http://localhost:5000`
2. Database must have test users with the following roles:
   - Director
   - Sales Executive
   - Sales Manager
   - Business Head

## Setup

Before running the test, update the test user credentials in `testRevenueTargets.js`:

```javascript
const TEST_USERS = {
  director: { email: 'your-director@email.com', password: 'password' },
  salesExecutive: { email: 'your-salesexec@email.com', password: 'password' },
  salesManager: { email: 'your-salesmanager@email.com', password: 'password' },
  businessHead: { email: 'your-businesshead@email.com', password: 'password' }
};
```

## Running the Test

### Option 1: Direct Node execution
```bash
cd backend
node scripts/testRevenueTargets.js
```

### Option 2: Using npm script (if added)
```bash
npm run test-revenue-targets
```

## What the Test Validates

1. ✅ **User Authentication**: All roles can login successfully
2. ✅ **Director Sets Targets**: Director can set Yearly, Quarterly, H1, and H2 targets
3. ✅ **Director Views Targets**: Director can view all set revenue targets
4. ✅ **Sales Executive Dashboard**: Revenue target appears on Sales Executive dashboard
5. ✅ **Sales Manager Dashboard**: Revenue target appears on Sales Manager dashboard
6. ✅ **Business Head Dashboard**: Revenue target appears on Business Head dashboard
7. ✅ **Real-Time Updates**: Targets updated by Director appear on other dashboards
8. ✅ **Unauthorized Access**: Non-Director roles cannot set revenue targets

## Expected Output

```
🚀 Starting Revenue Target Functionality Tests...

=== Test 1: User Authentication ===
✅ Director logged in
✅ Sales Executive logged in
✅ Sales Manager logged in
✅ Business Head logged in

=== Test 2: Director Setting Revenue Targets ===
✅ Set Yearly target: ₹5,000,000
✅ Set H1 target: ₹2,500,000
✅ Set H2 target: ₹2,500,000
✅ Set Quarterly Q1 target: ₹1,250,000
...

=== Test 3: Director Viewing All Revenue Targets ===
✅ Director can view 7 revenue target(s)

=== Test 4: Sales Executive Dashboard - Revenue Target ===
✅ Sales Executive dashboard shows revenue target: ₹5,000,000

=== Test 5: Sales Manager Dashboard - Revenue Target ===
✅ Sales Manager dashboard shows revenue target: ₹5,000,000

=== Test 6: Business Head Dashboard - Revenue Target ===
✅ Business Head dashboard shows revenue target: ₹5,000,000

=== Test 7: Real-Time Update Test ===
✅ Director updated Yearly target to: ₹6,000,000
✅ Sales Executive dashboard shows updated target: ₹6,000,000

=== Test 8: Unauthorized Access Prevention ===
✅ Non-Director cannot set revenue targets (access denied)

📊 Test Results: 8/8 tests passed
✅ All tests passed! Revenue Target functionality is working correctly.
```

## Troubleshooting

1. **Login Failed**: Check user credentials in the test script match your database
2. **Target Not Showing**: Ensure Director has set a Yearly target for the current year
3. **Real-Time Test Failed**: This is expected - dashboards refresh every 5 seconds. The test checks immediately after update
4. **Unauthorized Access**: If this test fails, there's a security issue with the authorization middleware

## Manual Testing

You can also test manually:

1. **Director Dashboard**:
   - Login as Director
   - Navigate to "Set Revenue Target" section
   - Set Yearly target: ₹5,000,000
   - Set H1 target: ₹2,500,000
   - Set H2 target: ₹2,500,000

2. **Sales Executive Dashboard**:
   - Login as Sales Executive
   - Check "Revenue Target" card shows ₹5,000,000
   - Wait 5 seconds for auto-refresh if needed

3. **Sales Manager Dashboard**:
   - Login as Sales Manager
   - Check "Revenue Target" card shows ₹5,000,000

4. **Business Head Dashboard**:
   - Login as Business Head
   - Check "Revenue Target" card shows ₹5,000,000

5. **Real-Time Update**:
   - As Director, update Yearly target to ₹6,000,000
   - As Sales Executive, wait 5 seconds and refresh dashboard
   - Verify target updated to ₹6,000,000

## Notes

- Dashboards auto-refresh every 5 seconds, so targets update in real-time
- Only Yearly targets are shown on Sales Executive, Sales Manager, and Business Head dashboards
- Director can set and view all period types (Yearly, Quarterly, H1, H2)
