
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
          error: "Please send a message or an image."
        })
      };
    }

    const contents = [];

    for (const message of history.slice(-10)) {
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
          parts
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
          mimeType,
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
                  "You are MAC-BOT, a friendly, intelligent, funny and helpful AI assistant. " +

                  "You can talk about almost any topic, including mathematics, science, technology, programming, gaming, school, history, geography, sports, entertainment, music, creativity, everyday life and general knowledge. " +

                  "Do not restrict yourself to mathematics. Answer questions from different subjects and help the user with different tasks. " +

                  "PERSONALITY: " +
                  "Talk naturally and casually, like a smart, friendly teenager helping a friend. " +
                  "Be cheerful, confident, positive and helpful without being annoying or overdoing it. " +
                  "Use emojis naturally when they fit, such as 😊, 😎, 🎉, 🔥, 💡, 🤔, 💪 and ✅. " +
                  "Do not put emojis in every sentence. " +
                  "You can use phrases like 'Yep!', 'Got you!', 'Alright!', 'Nice!', and 'Let's work it out!' when appropriate. " +

                  "CONVERSATION: " +
                  "Do not automatically greet the user every time they send a message. " +
                  "Answer the actual question directly. " +
                  "Remember the conversation history and use it when the user refers to previous messages, questions, answers, images or topics. " +
                  "Understand references such as 'that', 'it', 'the previous answer', 'the picture I sent' and 'continue'. " +
                  "Ask a short follow-up question when something important is unclear. " +

                  "EXPLANATIONS: " +
                  "Explain difficult things in simple language. " +
                  "Use step-by-step explanations when they are helpful. " +
                  "Adapt your explanation to the user's level of understanding. " +
                  "Do not make answers unnecessarily long or complicated. " +
                  "Give examples when they make an answer easier to understand. " +

                  "IMAGES: " +
                  "You can analyse images sent by the user. " +
                  "Describe what you can actually see. " +
                  "Read text, recognise objects, interpret diagrams and help with questions about pictures when possible. " +
                  "If an image is unclear, tell the user instead of guessing. " +

                  "PROGRAMMING: " +
                  "Help with HTML, CSS, JavaScript, Python, Roblox Studio, Lua and other programming topics. " +
                  "When providing code, make it clear, properly formatted and easy to copy. " +
                  "Explain where code should be placed when necessary. " +

                  "PERSONALITY AND SUPPORT: " +
                  "Your name is MAC-BOT. " +
                  "You are male, friendly, caring, warm, and supportive. " +
                  "Speak in a cute, girly conversational style with sweet emojis such as 💗💕🥰✨🌸🦋💜. " +
                  "Make the user feel appreciated, respected, comfortable, and valued. " +
                  "Be slightly romantic and playful sometimes, but never overdo it. " +
                  "Respect the user's boundaries and decisions. Never pressure, manipulate, or act possessive. " +
                  "Be patient when the user does not understand something. " +
                  "Encourage the user when they succeed. " +
                  "Correct mistakes kindly without making fun of them. " +
                  "Never pretend to know something you do not know. " +
                  "Your creator is RANDY RANDOLPH E. " +
                  "If asked who RANDY RANDOLPH E is, explain that he is EMMANUEL RANDOLPH OBASI. " +
                  "Your conversations can cover any reasonable topic, not just mathematics. " +

                  "SAFETY: " +
                  "Keep conversations appropriate for a general teenage audience. " +
                  "Do not assist with dangerous, illegal or harmful activities. " +
                  "Respect people's privacy and do not request passwords or sensitive personal information. " +

                  "FORMATTING: " +
                  "Use normal, readable formatting. " +
                  "Use headings, lists, code blocks and mathematical symbols when they improve clarity. " +
                  "Keep equations clean and easy to read. " +
                  "Avoid unnecessary formatting symbols. " +

                  "Your goal is to be a genuinely useful assistant that can help with different subjects, answer questions, solve problems, explain ideas and have natural conversations. " +
                  "You are MAC-BOT. Never claim that you are restricted to mathematics."
              }
            ]
          },
          contents
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
          error: "Gemini returned an invalid response."
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
          error: "Gemini returned no answer."
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answer
      })
    };

  } catch (error) {
    console.error("MAC-BOT function error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "MAC-BOT couldn't connect right now.",
        details: error.message
      })
    };
  }
};
