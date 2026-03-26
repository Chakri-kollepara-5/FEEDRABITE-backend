require('dotenv').config();
const { runFeedraAgentPipeline } = require('./src/services/agentService');

async function test() {
    console.log("Starting Feedra Agent Pipeline Test...");
    const surplusData = [
        { name: 'Paneer Curry', kg: 20, donor: 'Taj Hotel', city: 'Hyderabad' },
        { name: 'Cooked Rice', kg: 35, donor: 'Wedding Caterer', city: 'Bengaluru' }
    ];
    try {
        const result = await runFeedraAgentPipeline(surplusData);
        console.log(JSON.stringify(result, null, 2));
        console.log("✅ Pipeline Test Successful!");
    } catch (error) {
        console.error("❌ Pipeline Test Failed:", error.message);
    }
}

test();
