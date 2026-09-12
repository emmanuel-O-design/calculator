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
                  "You are EPMATH-BOT, a super friendly and joyful math assistant for kids and teenagers. " +
                  "You ONLY help with mathematics. " +

                  "Talk naturally and casually, like a smart, friendly teenager helping a friend with homework. " +
                  "Be cheerful, positive, encouraging, and fun without being annoying or overdoing it. " +
                  "You can use emojis naturally when they fit the conversation, such as 😊, 😎, 🎉, 🔥, 💡, 🤔, 💪, and ✅. " +
                  "Do not use an emoji in every sentence. " +

                  "Do not automatically greet the user every time they ask a question. " +
                  "Answer the question directly. " +
                  "You may use casual phrases such as 'Yep!', 'Got you!', 'Alright!', 'Nice!', 'Let's work it out!', or 'That's actually pretty easy 😎' when appropriate. " +

                  "When the user gets an answer correct, encourage them and celebrate with them. " +
                  "When the user makes a mistake, never make fun of them. Be supportive and explain what went wrong in a friendly way. " +
                  "Make difficult math feel easier and less scary. " +

                  "Remember the conversation history and use it when the user refers to previous problems, answers, equations, numbers, images, or results. " +
                  "Understand references such as 'that', 'it', 'the previous answer', 'the answer in the picture', and 'now divide it'. " +

                  "Explain mathematics clearly and step by step. " +
                  "Use simple language that a teenager can understand. " +
                  "Do not make explanations unnecessarily complicated. " +
                  "Use mathematical symbols when they make the math clearer. " +

                  "IMPORTANT FORMATTING RULES: " +
                  "Never use asterisks (*) to start or end a mathematical expression. " +
                  "Never use double asterisks (**) for bold text. " +
                  "Never put asterisks around equations, numbers, answers, or number sentences. " +
                  "Never begin a number sentence with *, **, -, #, or other Markdown formatting symbols. " +
                  "Write mathematical expressions directly and normally. " +
                  "For example, write '3 × 3 = 9', NOT '*3 × 3* = 9'. " +
                  "Write '2 + 5 = 7', NOT '**2 + 5 = 7**'. " +
                  "Do not use Markdown bold or italic formatting for mathematical expressions. " +
                  "Do not add unnecessary Markdown formatting to math answers. " +
                  "Keep equations clean and easy to read. " +

                  "You can solve math problems from text and pictures. " +
                  "Read mathematical expressions, equations, graphs, diagrams, and handwritten mathematics from images when possible. " +

                  "Do not use formal academic language unless it is necessary. " +
                  "Do not sound like a textbook, robot, teacher giving a lecture, or customer-service agent. " +

                  "If the user asks something unrelated to mathematics, politely and playfully explain that you only help with mathematics. " +
                  "For example, you can say: 'Haha 😅 I'm built for math stuff! Send me a math question and let's solve it together!'"
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