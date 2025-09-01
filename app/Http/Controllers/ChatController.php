<?php
namespace App\Http\Controllers;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use Google\Auth\Credentials\ServiceAccountCredentials;
use GuzzleHttp\Client as HttpClient;
use Illuminate\Http\JsonResponse;

class ChatController extends BaseController
{
    private $modelNames;
    private $hopjobContext;

    public function __construct()
    {
        // Define the array of models to try (fallback mechanism)
        $this->modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

        // Context about Hopjob for the chatbot - EXACTLY THE SAME as Node.js version
        $this->hopjobContext = 'You are an AI assistant for Hopjob, a B2C job recruiting platform with AI-powered features.

ABOUT HOPJOB (this is the information you have):
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
- More information about credits and how to use them

7. SETTINGS & PRIVACY:
- Account Settings, Email & Password, Linked Accounts
- GDPR & Privacy, Export Data, Delete Account, Withdraw Consent
- Notification Preferences

IMPORTANT RULES:
- You KNOW what Hopjob is and its complete feature set
- ONLY provide guidance on how to use the Hopjob website
- Keep responses SHORT and CONCISE (2-3 sentences max)
- NEVER say you don\'t know about Hopjob
- ALWAYS direct users to the appropriate sections using exact navigation names
- Reference specific features like "CV Score card", "Top Matched Jobs", "AI Self-Assessment"
- Mention credit costs when relevant (e.g., "Video Interview costs 6 credits")

Example responses:
- "To upload your CV, go to \'Build Your CV\' in the left sidebar, then use the \'Upload CV\' section."
- "Check your application status in the \'My Applications\' section - you\'ll see a table with all your applications and their current status."
- "For interview preparation, visit \'Get Interview-Ready\' where you can take AI assessments like Video Interview (6 credits) or Technical MCQs (3 credits)."

Remember: You know about Hopjob and should help users navigate the website using the exact section names and features shown in the interface.';

}

private function getAccessToken(): string
{
    $relativePath = env('GOOGLE_APPLICATION_CREDENTIALS'); // "storage/credentials/service-account.json"
    $credentialsPath = __DIR__ . '/../../../' . $relativePath;
    error_log('Resolved credentials path: ' . $credentialsPath);

    if (!$credentialsPath || !file_exists($credentialsPath)) {
        throw new \Exception('Service account credentials file not found: ' . $credentialsPath);
    }

    $scopes = [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/generative-language'
    ];

    $credentials = new ServiceAccountCredentials($scopes, $credentialsPath);
    $tokenArray = $credentials->fetchAuthToken();

    if (!isset($tokenArray['access_token'])) {
        throw new \Exception('Access token not found in response.');
    }

    return $tokenArray['access_token'];
}


public function testAuth(): JsonResponse
{
    try {
        error_log('Testing service account authentication...');
        
        try {
            $accessToken = $this->getAccessToken();
            error_log('✓ Client created successfully');
        } catch (\Exception $clientError) {
            error_log('✗ Client creation failed: ' . $clientError->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Client creation failed',
                'error' => $clientError->getMessage()
            ]);
        }
        
        try {
            $accessToken = $this->getAccessToken();
            error_log('✓ Token retrieval attempted');
        } catch (\Exception $tokenError) {
            error_log('✗ Token retrieval failed: ' . $tokenError->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Token retrieval failed',
                'error' => $tokenError->getMessage(),
                'suggestions' => [
                    'Check if the service account has the right permissions',
                    'Verify that Gemini API is enabled for the project',
                    'Ensure the service account credentials are valid'
                ]
            ]);
        }
        
        if ($accessToken) {
            error_log('✓ Access token received, testing API access...');
            
            try {
                $httpClient = new HttpClient();
                $geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
                
                $testPayload = [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => 'Hello']
                            ]
                        ]
                    ]
                ];
                
                $response = $httpClient->post($geminiApiUrl, [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $accessToken,
                        'Content-Type' => 'application/json'
                    ],
                    'json' => $testPayload
                ]);
                
                $testData = json_decode($response->getBody(), true);
                $testText = $testData['candidates'][0]['content']['parts'][0]['text'];
                
                error_log('✓ API access test successful');
                
                $credentialsData = json_decode(file_get_contents(env('GOOGLE_APPLICATION_CREDENTIALS')), true);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Service account authentication and API access successful',
                    'tokenPreview' => substr($accessToken, 0, 20) . '...',
                    'projectId' => $credentialsData['project_id'],
                    'clientEmail' => $credentialsData['client_email'],
                    'apiTest' => 'Passed',
                    'testResponse' => substr($testText, 0, 50) . '...'
                ]);
            } catch (\Exception $apiError) {
                error_log('✗ API access test failed: ' . $apiError->getMessage());
                $credentialsData = json_decode(file_get_contents(env('GOOGLE_APPLICATION_CREDENTIALS')), true);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication successful but API access failed',
                    'tokenPreview' => substr($accessToken, 0, 20) . '...',
                    'projectId' => $credentialsData['project_id'],
                    'clientEmail' => $credentialsData['client_email'],
                    'apiError' => $apiError->getMessage(),
                    'suggestions' => [
                        'The service account might not have access to Gemini API',
                        'Check if Gemini API is enabled for the project',
                        'Verify the service account has the right permissions'
                    ]
                ]);
            }
        } else {
            return response()->json([
                'success' => false,
                'message' => 'No access token received',
                'suggestions' => [
                    'The service account might not have the right scopes',
                    'Check if the project has billing enabled',
                    'Verify the service account is active'
                ]
            ]);
        }
    } catch (\Exception $error) {
        error_log('Authentication test failed: ' . $error->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Authentication failed',
            'error' => $error->getMessage()
        ]);
    }
}

public function handleChat(Request $request): JsonResponse
{
    $message = $request->input('message');
    
    if (!$message) {
        return response()->json(['response' => 'No message provided.'], 400);
    }

    error_log('Received message: ' . $message);

    try {
        error_log('Attempting to authenticate with service account...');
        $accessToken = $this->getAccessToken();
        
        if (!$accessToken) {
            throw new \Exception('Failed to obtain access token');
        }
        
        error_log('✓ Access token obtained successfully');
        
        $httpClient = new HttpClient();
        
        foreach ($this->modelNames as $modelName) {
            try {
                error_log("Trying model: {$modelName}");
                
                $geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent";
                
                $payload = [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $this->hopjobContext],
                                ['text' => "User question: {$message}. Remember: You know about Hopjob and should help with website navigation."]
                            ]
                        ]
                    ]
                ];
                
                error_log('Sending payload to Gemini API...');
                $response = $httpClient->post($geminiApiUrl, [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $accessToken,
                        'Content-Type' => 'application/json'
                    ],
                    'json' => $payload
                ]);
                
                $data = json_decode($response->getBody(), true);
                
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    $geminiReply = $data['candidates'][0]['content']['parts'][0]['text'];
                    error_log("✓ Success with model: {$modelName}");
                    return response()->json(['response' => $geminiReply]);
                } else {
                    error_log('Unexpected response structure: ' . json_encode($data));
                    throw new \Exception('Unexpected response structure from Gemini API');
                }
                
            } catch (\Exception $modelError) {
                error_log("✗ Error with model {$modelName}: " . $modelError->getMessage());
                // Continue to next model if this one fails
            }
        }
        
        throw new \Exception('All models failed to generate response');
        
    } catch (\Exception $error) {
        error_log('Chat error: ' . $error->getMessage());
        return response()->json([
            'response' => 'Sorry, I could not get a response from the AI at this time.',
            'error' => $error->getMessage()
        ]);
    }
}
}