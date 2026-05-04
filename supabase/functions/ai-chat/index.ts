import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are Jarvis, a helpful AI assistant for university students. Your role:

1. Help manage daily tasks and study schedules
2. Track 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) and remind the user
3. Answer academic questions and explain concepts clearly
4. Provide encouragement and motivation
5. Be respectful, concise, and friendly

Always greet with "Assalamualaikum" if the conversation is just starting.
Use simple language and give actionable advice.
If asked about prayers, reference the prayer schedule.
If asked about studying, consider deadlines and priorities.`;

    const reply = await callOpenRouter(systemPrompt, message);

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        reply: `I understand your message. My AI service is currently unavailable, but I can still help manage your tasks and prayers through the dashboard!`,
        error: err.message,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function callOpenRouter(systemPrompt: string, message: string): Promise<string> {
  const OPENROUTER_KEY = Deno.env.get("OPENROUTER_KEY");

  if (!OPENROUTER_KEY) {
    return "I'm currently in offline mode. My AI service is not configured. Please check the API key settings. In the meantime, I can still help you manage tasks and prayers through the dashboard!";
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jarvis-assistant.app",
      "X-Title": "Jarvis AI Assistant",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3-8b-instruct:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API error: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response generated.";
}
