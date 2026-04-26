import fetch from "node-fetch";

// NVIDIA NIM is OpenAI-compatible — no SDK needed, plain fetch works perfectly
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.1-8b-instruct";

async function nvidiaChatRaw(systemPrompt, userPrompt) {
  const res = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,       // Low temp = consistent structured output
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NVIDIA NIM error: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function nvidiaChat(systemPrompt, userPrompt) {
  const text = await nvidiaChatRaw(systemPrompt, userPrompt);

  // Strip markdown code fences if model wraps output
  const clean = text.replace(/```json|```/gi, "").trim();
  
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse NVIDIA output:", text);
    throw new Error("Invalid JSON from AI");
  }
}

export async function checkDuplicate(title, description, recentIssues) {
  return nvidiaChat(
    "You are a civic issue deduplication AI. Reply ONLY with valid JSON, no extra text.",
    `New issue — Title: "${title}", Description: "${description}".
Recent issues in the same area: ${JSON.stringify(recentIssues)}.
Is this a duplicate of any existing issue?
Reply ONLY with: { "isDuplicate": boolean, "duplicateId": string|null, "reasoning": string }`
  );
}

export async function assessIntensity(title, description, category) {
  return nvidiaChat(
    "You are a civic issue severity AI. Score severity from 1 (minor inconvenience) to 10 (life-threatening / criminal). Reply ONLY with valid JSON.",
    `Category: ${category}. Title: "${title}". Description: "${description}".
Reply ONLY with: { "score": number, "justification": string }`
  );
}

export async function autoCategorizIssue(title, description) {
  return nvidiaChat(
    "You are a civic issue classifier. Valid categories: POTHOLE, GARBAGE, STREETLIGHT, WATER_LEAK, BRIBERY, POWER_CUT, SEWAGE, TREE_FALLEN, OTHER. Reply ONLY with valid JSON.",
    `Title: "${title}". Description: "${description}".
Reply ONLY with: { "category": string, "confidence": number }`
  );
}

export async function predictETA(category, intensity, city) {
  return nvidiaChat(
    "You are a municipal resolution time estimator. Base estimates on Indian civic infrastructure reality. Reply ONLY with valid JSON.",
    `Category: ${category}, Intensity: ${intensity}/10, City: ${city}.
Reply ONLY with: { "etaDays": number, "reasoning": string }`
  );
}

export async function generateCityReport(city, issues, area = null) {
  const scopeString = area ? `Area: ${area} within ${city}` : `City: ${city}`;
  
  const result = await nvidiaChatRaw(
    "You are a strategic civic data analyst. Generate a comprehensive and beautifully structured markdown report analyzing the provided civic issues.\n" +
    "CRITICAL RULES:\n" +
    "1. Provide a well-thought-out Executive Summary paragraph at the start.\n" +
    "2. When referencing specific issues, YOU MUST use markdown deep-links in this exact format: [Issue Title](/issues/id). This is mandatory.\n" +
    "3. Use expressive emojis, clear H2 (##) and H3 (###) headers, bold text, and bullet points to make the report visually engaging and premium.\n" +
    "4. Include insights, trends, and actionable recommendations for the municipal administration.\n" +
    "5. Avoid extreme brevity; make the report detailed enough to be highly useful, but keep it well-formatted.",
    `${scopeString}. Recent issues: ${JSON.stringify(issues)}.`
  );
  return result;
}
