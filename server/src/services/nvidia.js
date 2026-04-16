import fetch from "node-fetch";

// NVIDIA NIM is OpenAI-compatible — no SDK needed, plain fetch works perfectly
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.3-70b-instruct";

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
    "You are a strategic civic data analyst. Generate a structured markdown report. " +
    "CRITICAL: When referencing specific issues, YOU MUST use markdown links in the format [Title](/issues/id). " +
    "Focus on top recurring problems, affected zones, and urgent action items.",
    `${scopeString}. Recent issues (last 50): ${JSON.stringify(issues)}.
Return a well-formatted markdown report with deep-links to issues.`
  );
  return result;
}
