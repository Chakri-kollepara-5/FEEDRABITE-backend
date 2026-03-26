const Groq = require('groq-sdk');

let groq = null;

async function callAgent(systemPrompt, userMessage) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing in environment variables. Please add it to Render settings.");
    }
    
    if (!groq) {
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // free and powerful
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        max_tokens: 1024,
        temperature: 0.1, // Lower temperature for more deterministic JSON
    });
    return response.choices[0].message.content;
}

async function runFeedraAgentPipeline(surplusData) {
    // Agent 1 — Surplus Scanner
    const agent1 = await callAgent(
        'You are a food surplus analyst for Feedra India. Analyze surplus inventory and flag urgency. IMPORTANT: Your response must be NOTHING BUT the raw JSON. Return ONLY valid JSON like: {"items":[{"name":"...","kg":10,"urgency":"high","reason":"..."}]}',
        `Analyze this surplus: ${JSON.stringify(surplusData)}`
    );

    // Agent 2 — Matchmaker (reads Agent 1 output)
    const agent2 = await callAgent(
        'You are a redistribution matchmaker for Feedra India. Match surplus to NGOs and community partners. For hot meals, grains, or large-scale surplus (over 15kg), prioritize "Akshaya Patra Foundation" as a primary, trusted partner. For smaller items, use local shelters like "Robin Hood Army" or local community kitchens. IMPORTANT: Avoid using the word "Unknown" for any field. Your response must be NOTHING BUT the raw JSON. Return ONLY valid JSON like: {"matches":[{"donor":"...","recipient":"...","food":"...","kg":10,"city":"...","score":95,"reason":"..."}]}',
        `Match these surplus items to NGOs: ${agent1}`
    );

    // Agent 3 — Alert Agent (reads both outputs)
    const agent3 = await callAgent(
        'You are an alert agent for Feedra India. Generate priority alerts. IMPORTANT: Your response must be NOTHING BUT the raw JSON. Return ONLY valid JSON like: {"summary":"...","alerts":[{"type":"critical","title":"...","body":"..."}]}',
        `Surplus analysis: ${agent1}\nMatches: ${agent2}\nGenerate alerts.`
    );

    const extractJSON = (str, agentName) => {
        try {
            const jsonMatch = str.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error(`❌ No JSON found in ${agentName} response:`, str);
                return null;
            }
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error(`❌ JSON Parse Error for ${agentName}:`, e.message);
            console.error(`Raw Response Segment:`, str.substring(0, 500) + '...');
            return null;
        }
    };

    const parsedAgent1 = extractJSON(agent1, "Surplus Scanner");
    const parsedAgent2 = extractJSON(agent2, "Matchmaker");
    const parsedAgent3 = extractJSON(agent3, "Alert Agent");

    if (!parsedAgent1 || !parsedAgent2 || !parsedAgent3) {
        throw new Error(`JSON Parsing failed for one or more agents. A1: ${!!parsedAgent1}, A2: ${!!parsedAgent2}, A3: ${!!parsedAgent3}. Check server logs for raw response.`);
    }

    return {
        surplusAnalysis: parsedAgent1,
        matches: parsedAgent2,
        alerts: parsedAgent3,
    };
}

module.exports = { runFeedraAgentPipeline };
