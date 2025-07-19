export const runtime = 'experimental-edge';

export const config = {
  api: {
    responseLimit: '100mb',
  },
};

async function generateExercisePlan(profileData) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const model = 'gemini-1.5-flash';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `
You are a certified fitness trainer. Suggest a realistic and effective daily exercise routine based on the user's profile. Focus on beginner-friendly routines, but consider the user's activity level and goal (weight loss, maintenance, gain). Use a motivational tone.

✔ Return short, easy-to-read daily exercise recommendations with estimated calories burned.
✔ Prefer home-friendly exercises (bodyweight, walking, jogging, etc.).
✔ Show calorie burn in round numbers.
✔ Return 2 exercise options:
- Option 1: Simple and minimal (good for beginners)
- Option 2: Slightly advanced (good for moderate fitness)

Respond strictly in this JSON format:
{
  "exercise": ["Option 1: ... (burns ~XXX cal)", "Option 2: ... (burns ~XXX cal)"]
}

User Profile:
- Age: ${profileData.age || "25"}
- Gender: ${profileData.gender}
- Weight: ${profileData.weight} kg
- Height: ${profileData.height} cm
- Activity Level: ${profileData.activityLevel}
- Goal: ${profileData.goal}
`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) throw new Error("Failed to extract JSON");

  const raw = JSON.parse(jsonMatch[0]);
return JSON.parse(jsonMatch[0]);

}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' }
    });
  }

  try {
    const profileData = await req.json();
    const exercise = await generateExercisePlan(profileData);
    return new Response(JSON.stringify({ success: true, exercise }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
