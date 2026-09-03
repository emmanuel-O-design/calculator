exports.handler = async (event) => {
  try {
    const { question } = JSON.parse(event.body);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: `You are E-Bot, a calculator assistant. Only help with mathematics.

Question: ${question}`
      })
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify({
        answer: data.output_text || "Sorry, I couldn't solve that."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong."
      })
    };
  }
};