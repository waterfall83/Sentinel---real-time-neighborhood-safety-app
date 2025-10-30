// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp(); // Initializes the Admin SDK

// This is your Cloud Function, triggered when a new document is created
// in the 'incidents' collection (replace 'incidents' with your actual collection name)
exports.categorizeIncident = functions.firestore
    .document('reports/{incidentId}')
    .onCreate(async (snap, context) => {
        const newIncident = snap.data(); // Get the data of the new incident

        const title = newIncident.title;
        const description = newIncident.description;

        // --- STEP 1: Craft your Gemini prompt ---
        const prompt = `Analyze the following incident report and categorize its danger level as 'severe', 'moderate', or 'low amount of danger'. Respond only with one of these three categories.
        Title: ${title}
        Description: ${description}`;

        // --- STEP 2: Call the Gemini API (placeholder for now) ---
        // In a real scenario, you'd make an HTTP request to the Gemini API
        // using a library like 'axios' or Node's built-in 'https' module.
        // For now, let's simulate a response:
        let detectedDangerCategory = 'moderate'; // Placeholder for Gemini's output

        // Example of how you might integrate Gemini (conceptual, requires Gemini SDK or HTTP call)
        const { GoogleGenerativeAI } = require('@google/generative-ai'); // You'd install this
        const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key); // API Key from functions config
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        const result = await model.generateContent(prompt);
        const response = await result.response;
        detectedDangerCategory = response.text().trim(); // Or parse JSON if Gemini returns structured data


        // --- STEP 3: Update the Firestore document ---
        const incidentRef = snap.ref; // Reference to the document that triggered the function

        await incidentRef.update({
            automatedDangerCategory: detectedDangerCategory,
            // You could also add a timestamp for when it was categorized
            categorizedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Incident ${context.params.incidentId} categorized as: ${detectedDangerCategory}`);
        return null; // Important: Cloud Functions must return a Promise or null/undefined
    });