import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false};// src/api/geminiCategorizer.js
import { GoogleGenerativeAI } from "/node_modules/.vite/deps/@google_generative-ai.js?v=0ee8b752";


const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateSeverity(title, description) {
  const prompt = `
This is an app that allows users to report dangerous neighborhood incidents.
Classify the following incident report into one of these three severity levels:
- Severe
- Moderate
- Low


Examples of reports and the categories they belong to:
1. Report title: "Flooded street". Description: "Heavy rains have caused severe flooding, making the street impassable for vehicles and pedestrians."
   Category: Severe


2. Report title: "Fallen tree". Description: "A large tree has fallen across the sidewalk, blocking pedestrian access but not causing any injuries."
   Category: Moderate


3. Report title: "Streetlight out". Description: "The streetlight is not working, causing reduced visibility at night but no immediate danger."
   Category: Low


Give ONLY the category name as the output.


Report title: "${title}"
Description: "${description}"
`;


  try {
    // Use a supported Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log("AI severity:", text);
    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Uncategorized";
  }
}
