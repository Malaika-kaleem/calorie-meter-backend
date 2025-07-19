export const runtime = 'experimental-edge';

export const config = {
    api: {
        responseLimit: '100mb',
    },
}
async function detectFoodAndCalories(base64Image) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    const model = 'gemini-1.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const match = base64Image.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new Error('Invalid image data format.');
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: `Detect the food item in this image. Return a JSON structure in this format: 
{
  "food": "Food Name",
  "ingredients": ["ingredient1", "ingredient2", ...],
  "total_calories": number
}
Return only valid JSON.`
                    },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}, ${await response.text()}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const regex = /\{.*?\}/s;
        const match = text.match(regex);

        if (!match) {
            throw new Error('No valid JSON found in the response.');
        }

        const parsedData = JSON.parse(match[0]);

        return {
            food: parsedData.food,
            ingredients: parsedData.ingredients,
            count: parsedData.total_calories
        };
    } catch (error) {
        console.error('API call failed:', error);
        throw new Error(`Failed to detect food and calories: ${error.message}`);
    }
}

export default async function handler(req) {
    if (req.method === 'POST') {
        try {
            const { image } = await req.json(); // Parse the image from the POST request's body
            const { food, ingredients, count } = await detectFoodAndCalories(image);

            // Create and return a successful response
          //  return new Response(JSON.stringify({ food, ingredients, count, success: true }), {
            return new Response(JSON.stringify({
                items: [{ name: food, calories: count, ingredients }],
                count,
                success: true
            }), {
              
          headers: { 'Content-Type': 'application/json' },
                status: 200
            });
        } catch (error) {
            // Create and return an error response
            return new Response(JSON.stringify({ success: false, message: error.message }), {
                headers: { 'Content-Type': 'application/json' },
                status: 500
            });
        }
    } else {
        // Return a 405 Method Not Allowed response for non-POST requests
        return new Response(`Method ${req.method} Not Allowed`, {
            headers: { 'Allow': 'POST' },
            status: 405
        });
    }
}
