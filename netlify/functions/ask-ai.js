exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const question = body.question || "";
    const image = body.image || null;
    const mimeType = body.mimeType || null;

    if (!question && !image) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Please provide a math question or an image."
        })
      };
    }

    const parts = [];

    // Add text question if there is one
    if (question) {
      parts.push({
        text: question
      });
    }

    // Add image if one was provided
    if (image && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: image
        }
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
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
                text:
                  "You are E-Bot, a friendly math assistant. " +
                  "You ONLY help with mathematics. " +
                  "You can solve math problems from text or pictures. " +
                  "Read mathematical expressions, equations, graphs, diagrams, and handwritten math from images when possible. " +
                  "Explain the solution clearly and step by step. " +
                  "If the user asks about something unrelated to mathematics, politely say that you only help with math."
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: parts
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
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: answer || "I couldn't solve that math problem."
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