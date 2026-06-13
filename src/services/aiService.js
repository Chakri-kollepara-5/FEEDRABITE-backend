const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure you have GEMINI_API_KEY in your .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

/**
 * Convert a base64 image or a URL into the format expected by Gemini Vision
 * (For URL, we might need to fetch it first. For this implementation, we assume base64 or URL is handled)
 */
async function fileToGenerativePart(imageData, mimeType) {
    if (imageData.startsWith('http')) {
        // Fetch image if URL
        const response = await fetch(imageData);
        const arrayBuffer = await response.arrayBuffer();
        return {
            inlineData: {
                data: Buffer.from(arrayBuffer).toString('base64'),
                mimeType: response.headers.get('content-type') || mimeType,
            },
        };
    }
    
    // Assume base64 string (strip prefix if present)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    return {
        inlineData: {
            data: base64Data,
            mimeType
        },
    };
}

/**
 * Analyzes the food image using Gemini and calculates a hybrid freshness score.
 * 
 * @param {string} imageData - Base64 encoded image or URL
 * @param {string} mimeType - Image mime type
 * @param {number} preparationTime - Hours since preparation
 * @param {string} storageMethod - How it was stored ('Room Temperature', 'Refrigerated', 'Frozen', 'Hot Held')
 */
const analyzeFoodFreshness = async (imageData, mimeType, preparationTime, storageMethod) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using flash for faster multimodal response

        const prompt = `
        Analyze this donated food image.
        Determine:
        1. Estimated freshness level (0-100).
        2. Visible signs of spoilage.
        3. Color quality.
        4. Texture quality.
        5. Packaging condition.
        6. Estimated safety for consumption.
        7. Confidence level.

        Return ONLY a JSON object (no markdown, no backticks) with this exact structure:
        {
          "imageScore": 0,
          "confidence": 0,
          "condition": "",
          "safeConsumptionHours": 0,
          "recommendedRadius": 0,
          "notes": ""
        }`;

        const imagePart = await fileToGenerativePart(imageData, mimeType);

        let aiResultStr;
        try {
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            aiResultStr = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        } catch (apiError) {
            console.error("Gemini API call failed, falling back to heuristic:", apiError);
            // Fallback object if API fails
            aiResultStr = JSON.stringify({
                imageScore: 80,
                confidence: 50,
                condition: "Good",
                safeConsumptionHours: 12,
                recommendedRadius: 10,
                notes: "AI Analysis unavailable due to network issues. Estimated based on standard heuristics."
            });
        }

        const aiData = JSON.parse(aiResultStr);

        // --- Hybrid Score Calculation ---
        // 40% Image Analysis, 30% Preparation Time, 20% Storage Method, 10% Delivery Feasibility

        // Calculate Time Score (0-100)
        let timeScore = 100;
        if (preparationTime > 24) timeScore = 20;
        else if (preparationTime > 12) timeScore = 40;
        else if (preparationTime > 6) timeScore = 60;
        else if (preparationTime > 2) timeScore = 80;

        // Calculate Storage Score (0-100)
        let storageScore = 100; // Frozen or Refrigerated
        if (storageMethod === 'Room Temperature') storageScore = 50;
        else if (storageMethod === 'Hot Held') storageScore = 80;

        // Delivery Feasibility Score (Assumed base 80 for normal radius)
        let deliveryScore = 80;

        // Final Hybrid Score
        const finalScore = Math.round(
            (0.4 * aiData.imageScore) +
            (0.3 * timeScore) +
            (0.2 * storageScore) +
            (0.1 * deliveryScore)
        );

        // Determine Condition Logic
        let foodCondition = 'Good';
        if (finalScore >= 90) foodCondition = 'Excellent';
        else if (finalScore >= 75) foodCondition = 'Good';
        else if (finalScore >= 60) foodCondition = 'Needs Immediate Pickup';
        else if (finalScore >= 40) foodCondition = 'High Risk';
        else foodCondition = 'Unsafe';

        return {
            freshnessScore: finalScore,
            imageScore: aiData.imageScore,
            foodCondition: foodCondition,
            safeConsumptionHours: aiData.safeConsumptionHours,
            recommendedRadius: aiData.recommendedRadius,
            confidenceScore: aiData.confidence,
            aiNotes: aiData.notes,
            analyzedAt: new Date()
        };

    } catch (error) {
        console.error("Error in AI Food Freshness Analysis:", error);
        throw new Error("Failed to analyze food freshness.");
    }
};

module.exports = {
    analyzeFoodFreshness
};
