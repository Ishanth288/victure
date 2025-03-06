
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
    const { message } = await req.json()
    
    // Log the input for debugging
    console.log('Received message:', message)
    
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format. Expected a string.')
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set in the environment variables')
    }
    
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
    })

    // Log the API response for debugging
    const data = await response.json()
    console.log('OpenAI API response:', JSON.stringify(data))
    
    // Check if the API response is valid
    if (!data || !data.choices) {
      throw new Error('Invalid response from OpenAI API: ' + JSON.stringify(data))
    }
    
    // Safely access the choice and message content
    const generatedContent = data.choices && 
                            data.choices.length > 0 && 
                            data.choices[0].message ? 
                            data.choices[0].message.content : 
                            "I'm sorry, I couldn't generate a response at this time."
    
    return new Response(
      JSON.stringify({ response: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        response: "I'm sorry, I encountered an error. Please try again later." 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
