exports.handler = async (event) => {
  try {
    const { question } = JSON.parse(event.body);

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Please enter a math question."
        })
      };
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions: "You are EPMATH-BOT, also called E-Bot. You are a mathematics-only AI assistant. Only answer questions about mathematics. You can solve arithmetic, algebra, equations, geometry, trigonometry, calculus, statistics, probability, fractions, percentages, decimals, and mathematical word problems. Explain your working when useful. Always carefully calculate the answer. If the user asks about something that is not mathematics, say: Sorry, I'm E-Bot and I can only help with mathematics. Be friendly and easy to understand.",
        input: question
      })
    });

    const data = await response.json();

    console.log("OpenAI response:", JSON.stringify(data));

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data.error?.message || "OpenAI request failed."
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: data.output_text || "I couldn't generate an answer."
      })
    };

  } catch (error) {
    console.error("E-Bot error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "E-Bot encountered an error."
      })
    };
  }
};