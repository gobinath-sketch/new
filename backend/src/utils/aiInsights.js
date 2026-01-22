import axios from 'axios';

export const generateAIInsight = async (data, context) => {
  // Temporary disable to prevent API errors
  return 'AI insights temporarily disabled.';

  /*
  try {
    const prompt = `Analyze the following ${context} data and provide a brief, professional insight (one sentence only, no explanations):
    
${JSON.stringify(data, null, 2)}

Return only the insight statement, nothing else.`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0]?.message?.content?.trim() || 'No insight available';
  } catch (error) {
    if (error.response) {
      console.error(`AI Insight API Error: ${error.response.status} ${error.response.statusText}`);
    } else {
      console.error('AI Insight Error:', error.message);
    }
    return 'AI insights temporarily unavailable.';
  }
  */
};
