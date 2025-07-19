export const runtime = 'experimental-edge';

export const config = {
  api: {
    responseLimit: '100mb',
  },
};

function getCurrentDateInfo() {
  const now = new Date();
  const date = now.toLocaleDateString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const time = now.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const month = now.getMonth() + 1;
  let season = 'unknown';
  if ([12, 1, 2].includes(month)) {
    season = 'winter';
  } else if ([3, 4].includes(month)) {
    season = 'spring';
  } else if ([5, 6, 7, 8, 9].includes(month)) {
    season = 'summer';
  } else if ([10, 11].includes(month)) {
    season = 'autumn';
  }

  return { date, time, season };
}


async function generateDietPlan(profileData) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const model = 'gemini-1.5-flash';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const { date, time, season } = getCurrentDateInfo();
  const prompt = `
You are a certified nutritionist for a fitness app. Generate a realistic and professional one-day diet plan based on the user's profile and aligned with the user's goal (weight loss, maintenance, or gain). Use Pakistani foods and fitness-friendly meals.
Today’s Date: ${date}
Current Time: ${time}
Season: ${season}
Make sure the daily water intake recommendation is season-aware. For example, in summer, higher water intake is advised(10-16), in winter (6-8).
STRICTLY exclude any foods the user is allergic to (see 'Allergies' field). Do not suggest these items in any meal option.

User Dietary Preference: ${profileData.dietPreference}
User Allergies: ${profileData.allergies}
Ensure the total day calorie intake. Meals should be portion-controlled and simple.
✔ Include 2 options per meal:
- Option 1 should be simple, desi, and practical. Not more than 1 line.
- Option 2 should be more fitness-optimized and professional.

✔ Use short, clean, easy-to-read format. Keep meals balanced with protein, carbs, and fiber.

✔ At the end, suggest an ideal daily water intake based on the season and user profile. 

Respond in this JSON format only:
{
  "breakfast": ["Option 1: ...", "Option 2: ..."],
  "lunch": ["Option 1: ...", "Option 2: ..."],
  "dinner": ["Option 1: ...", "Option 2: ..."],
  "water_goal": "X glasses"
}

User Profile:
- Age: ${profileData.age || "25"}
- Gender: ${profileData.gender}
- Weight: ${profileData.weight} kg
- Height: ${profileData.height} cm
- Activity Level: ${profileData.activityLevel}
- Goal: ${profileData.goal}
- Dietary Preference: ${profileData.dietPreference}
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
    const diet = await generateDietPlan(profileData);
    return new Response(JSON.stringify({ success: true, diet }), {
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
