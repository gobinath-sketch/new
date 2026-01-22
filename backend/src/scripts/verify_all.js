
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scripts = [
    { name: 'End-to-End Workflow', file: 'verify_workflow.js' },
    { name: 'GP Popup Alerts', file: 'testGPPopupAlerts.js' },
    { name: 'Notification System', file: 'verifyNotificationsAndAlerts.js' },
    { name: 'Real-time Revenue', file: 'verify_revenue.js' }
];

console.log('🚀 STOP! Starting Comprehensive System Verification...');
console.log('===================================================\n');

const runTests = async () => {
    let allPassed = true;
    const results = [];

    for (const script of scripts) {
        console.log(`Running: ${script.name}...`);
        const scriptPath = path.join(__dirname, script.file);

        try {
            await execPromise(`node "${scriptPath}"`);
            console.log(`✅ ${script.name}: PASSED\n`);
            results.push({ name: script.name, status: 'PASSED' });
        } catch (error) {
            console.error(`❌ ${script.name}: FAILED`);
            // Capture specific error output if available, otherwise message
            const errMsg = error.stderr || error.stdout || error.message;
            // console.error(errMsg); // Optional: print full error
            console.log('\n');
            results.push({ name: script.name, status: 'FAILED', error: errMsg });
            allPassed = false;
        }
    }

    console.log('===================================================');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('===================================================');

    results.forEach(res => {
        const icon = res.status === 'PASSED' ? '✅' : '❌';
        console.log(`${icon} ${res.name}`);
    });

    console.log('\n');
    if (allPassed) {
        console.log('🎉 ALL SYSTEMS GO! The application is fully verified and stable.');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please review the logs above.');
        process.exit(1);
    }
};

runTests();
