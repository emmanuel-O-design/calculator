exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Method not allowed."
        })
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "GEMINI_API_KEY is missing from Netlify environment variables."
        })
      };
    }

    let body;

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Invalid request data."
        })
      };
    }

    const question = body.question || "";
    const image = body.image || null;
    const mimeType = body.mimeType || null;
    const history = Array.isArray(body.history) ? body.history : [];

    if (!question && !image) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Please provide a math question or an image."
        })
      };
    }

    const contents = [];

    for (const message of history) {
      if (
        !message ||
        (message.role !== "user" && message.role !== "model")
      ) {
        continue;
      }

      const parts = [];

      if (
        typeof message.text === "string" &&
        message.text.trim() !== ""
      ) {
        parts.push({
          text: message.text
        });
      }

      if (message.image && message.mimeType) {
        parts.push({
          inlineData: {
            mimeType: message.mimeType,
            data: message.image
          }
        });
      }

      if (parts.length > 0) {
        contents.push({
          role: message.role,
          parts: parts
        });
      }
    }

    const currentParts = [];

    if (question) {
      currentParts.push({
        text: question
      });
    }

    if (image && mimeType) {
      currentParts.push({
        inlineData: {
          mimeType: mimeType,
          data: image
        }
      });
    }

    contents.push({
      role: "user",
      parts: currentParts
    });

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
                  "You are EPMATH-BOT, a mathematics assistant. " +
                  "You ONLY help with mathematics. " +
                  "Do not greet the user automatically. " +
                  "Answer the question directly. " +
                  "Remember the conversation history and use it when the user refers to previous problems, answers, equations, numbers, images, or results. " +
                  "Understand references such as that, it, the previous answer, the answer in the picture, and now divide it. " +
                  "Use simple, clean, easy-to-read language. " +
                  "Do not use Markdown. " +
                  "Avoid unnecessary symbols, emojis, hashtags, asterisks, and decorative formatting. " +
                  "Use mathematical symbols only when necessary. " +
                  "Explain solutions clearly and step by step. " +
                  "You can solve math problems from text and pictures. " +
                  "Read mathematical expressions, equations, graphs, diagrams, and handwritten mathematics from images when possible. " +
                  "If the user asks something unrelated to mathematics, politely explain that you only help with mathematics."
              }
            ]
          },
          contents: contents
        })
      }
    );

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Invalid Gemini response:", responseText);

      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Gemini returned an invalid response.",
          details: responseText
        })
      };
    }

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Gemini API error.",
          details: data
        })
      };
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Gemini returned no answer.",
          details: data
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answer: answer
      })
    };

  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "EPMATH-BOT couldn't connect right now.",
        details: error.message
      })
    };
  }
};