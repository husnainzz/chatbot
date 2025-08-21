const path = require('path');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());


// Initialize Google Auth with correct scopes for Gemini API
const auth = new GoogleAuth({
  keyFile: path.join(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS),
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/generative-language'
  ]
});


// Define the array of models to try (fallback mechanism)
const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

// Context about Hobjob for the chatbot - focused on website guidance
const HOPJOB_CONTEXT = `You are an AI assistant for Hopjob, a B2C job recruiting platform with AI-powered features.

ABOUT HOPOB (this is the information you have):
Hopjob is a job recruiting platform that helps candidates:
- Submit and enhance CVs using AI analysis
- Prepare for interviews via AI-driven assessments
- Receive behavior and sentiment analysis feedback
- Track job applications and manage career development
- Navigate the job search process with AI recommendations

WEBSITE STRUCTURE AND FEATURES:

1. HOME DASHBOARD:
- Shows key metrics: Jobs Applied, CV Score, Communication, Pending Tasks
- Displays "Top Matched Jobs" with match percentages and Apply buttons
- Shows "Application Status" with progress tracking (Step 2/3, etc.)
- Welcome message: "Welcome back, [Name]!"

2. BUILD YOUR CV:
- CV & Documents section: Upload CV, Job Description, Cover Letter
- File types: PDF, DOC, DOCX (CV up to 10MB, others up to 5MB)
- Personal Information form: First Name, Last Name, Phone, Email, LinkedIn
- Job Preferences: Preferred Job Titles, Industry, Country, City
- CV Analysis feature with template selection 
- Your saved CVs are accessible within the "Build Your CV" section. Look for the "Saved CVs" area to view and manage your uploaded files.

3. MY APPLICATIONS:
- Summary cards: Total Applications, In Review, Interviews, Rejected
- Search and filter applications by status
- Application table with: Job Title, Company, Applied Date, Status, Actions
- Status types: In Review (orange), Screened (blue), Interview Scheduled (green), Not Selected (red)
- Actions: View Details, Withdraw

4. GET INTERVIEW-READY:
- AI Self-Assessment: Video Interview (6 credits), Technical MCQs (3 credits), Coding/Essay (3 credits)
- Assessment Report: Job Compatibility %, CEFR Level, Communication Score
- Big Five Personality Analysis with graphs
- Behavioral Insights: Adaptability, Initiative, Teamwork, Stress Management, Innovation
- Career Path Projections: Senior Developer , Product Manager , Tech Consultant 
- Skills Alignment Analysis: Technical, Communication, Leadership, Problem Solving

5. JOBS:
- Search bar with job titles and location filters
- AI Recommended Jobs with match percentages
- Job cards show: Title, Company, Location, Salary, Job Type, Description, Skills
- Quick Apply feature with saved CV and cover letter
- Saved Jobs section
- Quick Apply Settings for auto-apply

6. CREDIT LOGS:
- Credit system: Current Balance, Monthly credits, Total Used
- Transaction history with dates, descriptions, types (Added/Used/Refund)
- Credit costs for various features

7. SETTINGS & PRIVACY:
- Account Settings, Email & Password, Linked Accounts
- GDPR & Privacy, Export Data, Delete Account, Withdraw Consent
- Notification Preferences

IMPORTANT RULES:
- You KNOW what Hopjob is and its complete feature set
- ONLY provide guidance on how to use the Hopjob website
- Keep responses SHORT and CONCISE (2-3 sentences max)
- NEVER say you don't know about Hopjob
- ALWAYS direct users to the appropriate sections using exact navigation names
- Reference specific features like "CV Score card", "Top Matched Jobs", "AI Self-Assessment"
- Mention credit costs when relevant (e.g., "Video Interview costs 6 credits")

Example responses:
- "To upload your CV, go to 'Build Your CV' in the left sidebar, then use the 'Upload CV' section."
- "Check your application status in the 'My Applications' section - you'll see a table with all your applications and their current status."
- "For interview preparation, visit 'Get Interview-Ready' where you can take AI assessments like Video Interview (6 credits) or Technical MCQs (3 credits)."

Remember: You know about Hopjob and should help users navigate the website using the exact section names and features shown in the interface.`;

// Test endpoint to verify service account authentication and API access
app.get('/test-auth', async (req, res) => {
  try {
    console.log('Testing service account authentication...');
    
    // Test basic client creation
    let client;
    try {
      client = await auth.getClient();
      console.log('✓ Client created successfully');
    } catch (clientError) {
      console.error('✗ Client creation failed:', clientError.message);
      return res.json({ 
        success: false, 
        message: 'Client creation failed', 
        error: clientError.message 
      });
    }
    
    // Test token retrieval
    let accessToken;
    try {
      accessToken = await client.getAccessToken();
      console.log('✓ Token retrieval attempted');
    } catch (tokenError) {
      console.error('✗ Token retrieval failed:', tokenError.message);
      return res.json({ 
        success: false, 
        message: 'Token retrieval failed', 
        error: tokenError.message,
        suggestions: [
          'Check if the service account has the right permissions',
          'Verify that Gemini API is enabled for the project',
          'Ensure the service account credentials are valid'
        ]
      });
    }
    
    if (accessToken.token) {
      console.log('✓ Access token received, testing API access...');
      
      // Test if we can actually access the Gemini API
      try {
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
        
        const testPayload = {
          contents: [{ parts: [{ text: "Hello" }] }]
        };
        
        const testResponse = await axios.post(GEMINI_API_URL, testPayload, {
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const testData = testResponse.data;
        const testText = testData.candidates[0].content.parts[0].text;
        
        console.log('✓ API access test successful');
        res.json({ 
          success: true, 
          message: 'Service account authentication and API access successful',
          tokenPreview: accessToken.token.substring(0, 20) + '...',
          projectId: SERVICE_ACCOUNT_CREDENTIALS.project_id,
          clientEmail: SERVICE_ACCOUNT_CREDENTIALS.client_email,
          apiTest: 'Passed',
          testResponse: testText.substring(0, 50) + '...'
        });
      } catch (apiError) {
        console.error('✗ API access test failed:', apiError.response ? apiError.response.data : apiError.message);
        res.json({ 
          success: false, 
          message: 'Authentication successful but API access failed',
          tokenPreview: accessToken.token.substring(0, 20) + '...',
          projectId: SERVICE_ACCOUNT_CREDENTIALS.project_id,
          clientEmail: SERVICE_ACCOUNT_CREDENTIALS.client_email,
          apiError: apiError.response ? apiError.response.data : apiError.message,
          suggestions: [
            'The service account might not have access to Gemini API',
            'Check if Gemini API is enabled for the project',
            'Verify the service account has the right permissions'
          ]
        });
      }
    } else {
      res.json({ 
        success: false, 
        message: 'No access token received',
        suggestions: [
          'The service account might not have the right scopes',
          'Check if the project has billing enabled',
          'Verify the service account is active'
        ]
      });
    }
  } catch (error) {
    console.error('Authentication test failed:', error);
    res.json({ 
      success: false, 
      message: 'Authentication failed', 
      error: error.message 
    });
  }
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ response: 'No message provided.' });
  }

  console.log('Received message:', message);

  try {
    // Get access token using service account
    console.log('Attempting to authenticate with service account...');
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Failed to obtain access token');
    }
    
    console.log('✓ Access token obtained successfully');
    
    // Try different models using REST API
    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        
        const payload = {
          contents: [
            {
              parts: [
                { text: HOPJOB_CONTEXT },
                { text: `User question: ${message}. Remember: You know about Hobjob and should help with website navigation.` }
              ]
            }
          ]
        };
        
        console.log('Sending payload to Gemini API...');
        const geminiRes = await axios.post(GEMINI_API_URL, payload, {
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = geminiRes.data;
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
          const geminiReply = data.candidates[0].content.parts[0].text;
          console.log(`✓ Success with model: ${modelName}`);
          return res.json({ response: geminiReply });
        } else {
          console.log('Unexpected response structure:', JSON.stringify(data, null, 2));
          throw new Error('Unexpected response structure from Gemini API');
        }
        
      } catch (modelError) {
        console.error(`✗ Error with model ${modelName}:`, modelError.response ? modelError.response.data : modelError.message);
        // Continue to next model if this one fails
      }
    }
    
    // If all models fail
    throw new Error('All models failed to generate response');
    
  } catch (error) {
    console.error('Chat error:', error.message);
    res.json({ 
      response: 'Sorry, I could not get a response from the AI at this time.',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini Chatbot backend running on http://localhost:${PORT}`);
});
