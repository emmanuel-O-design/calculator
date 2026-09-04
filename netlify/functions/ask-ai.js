exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const question = body.question;

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No question provided."
        })
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
                text: "You are E-Bot, a friendly math assistant. You ONLY answer mathematics questions. Explain calculations clearly and step by step when useful. If the user asks about something that is not mathematics, politely say that you can only help with math."
              }
            ]
          },
          contents: [
            {
              role: "user",
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
      console.error("Gemini API error:", data);

      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Gemini API error.",
          details: data
        })
      };
    }

    const answer =
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: answer || "I couldn't generate an answer."
      })
    };

  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "E-Bot couldn't connect right now."
      })
    };
  }
};
