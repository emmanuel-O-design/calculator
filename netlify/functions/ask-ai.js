exports.handler = async (event) => {
  try {
    const { question } = JSON.parse(event.body);

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No question provided" })
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You are E-Bot, a friendly math AI. You only answer questions about mathematics. If the user asks about something unrelated to math, politely tell them that you can only help with math. Show clear steps when solving problems."
              }
            ]
          },
          contents: [
            {
              parts: [
                {
                  text: question
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);

      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Gemini API error",
          details: data
        })
      };
    }

    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't find an answer.";

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "E-Bot couldn't connect right now."
      })
    };
  }
};

