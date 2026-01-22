
import assert from 'assert';

// Simulate the logic in Deal.js
const testGPLogic = () => {
    const deal = {
        totalOrderValue: 100000,
        trainerCost: 40000,
        labCost: 10000,
        logisticsCost: 5000,
        contentCost: 5000,
        contingencyBuffer: 0,
        travelCost: 2000,
        marketingCost: 1000,
        otherCost: 2000
    };

    console.log('--- TESTING GP CALCULATION FORMULA ---');
    console.log('Deal Value:', deal.totalOrderValue);

    // 1. Total Cost
    const totalCost = deal.trainerCost + deal.labCost + deal.logisticsCost + deal.contentCost + deal.contingencyBuffer + deal.travelCost + deal.marketingCost + deal.otherCost;
    console.log('Total Cost:', totalCost, '(Expected: 65000)');

    // 2. GP (Contribution)
    const gp = deal.totalOrderValue - totalCost;
    console.log('GP Amount:', gp, '(Expected: 35000)');

    // 3. GP %
    const gpPercent = (gp / deal.totalOrderValue) * 100;
    console.log('GP Percent:', gpPercent + '%', '(Expected: 35%)');

    if (totalCost === 65000 && gp === 35000 && gpPercent === 35) {
        console.log('✅ FORMULA VERIFIED: Math is correct.');
    } else {
        console.error('❌ FORMULA FAILED');
    }
};

testGPLogic();
