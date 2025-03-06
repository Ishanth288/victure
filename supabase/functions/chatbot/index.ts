
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body, with error handling
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      throw new Error("Invalid request format. Could not parse JSON.");
    }
    
    const { message } = requestBody || {};
    
    // Log the input for debugging
    console.log('Received message:', message);
    
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format. Expected a string but received: ' + JSON.stringify(message));
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set in the environment variables');
    }
    
    // Make the request to OpenAI
    console.log("Sending request to OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful pharmacy management system assistant named VictureBot. You help users with questions about the Victure Healthcare Solutions platform, including inventory management, billing, prescriptions, and general pharmacy operations. Keep responses concise and professional. Only answer questions related to the pharmacy system."
          },
          {
            role: "user",
            content: message
          }
        ],
      }),
    });

    // Check if the API request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    // Log the API response for debugging
    const data = await response.json();
    console.log('OpenAI API response status:', response.status);
    console.log('OpenAI API response data:', JSON.stringify(data));
    
    // Safely access the choice and message content with detailed validation
    if (!data) {
      throw new Error('Received empty response from OpenAI API');
    }
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('No choices returned from OpenAI API: ' + JSON.stringify(data));
    }
    
    const firstChoice = data.choices[0];
    if (!firstChoice) {
      throw new Error('First choice is undefined in OpenAI response');
    }
    
    const messageContent = firstChoice.message?.content;
    if (messageContent === undefined || messageContent === null) {
      throw new Error('Message content missing in OpenAI response choice');
    }
    
    console.log('Successfully extracted content from OpenAI response:', messageContent);
    
    return new Response(
      JSON.stringify({ response: messageContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error);
    
    // Send a more detailed error message for debugging
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred", 
        response: "I'm sorry, I encountered an error processing your request. Please try again later.",
        errorDetails: error.stack || "No stack trace available",
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
