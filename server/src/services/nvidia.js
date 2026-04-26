import fetch from "node-fetch";

// NVIDIA NIM is OpenAI-compatible — no SDK needed, plain fetch works perfectly
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.1-8b-instruct";
const REPORT_CACHE_TTL_MS = 5 * 60 * 1000;
const REPORT_CACHE_LIMIT = 24;
const REPORT_TIMEOUT_MS = 6500;
const reportCache = new Map();

const STATUS_LABELS = {
  REPORTED: "Reported",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected"
};

const CATEGORY_LABELS = {
  POTHOLE: "Pothole",
  GARBAGE: "Garbage",
  STREETLIGHT: "Streetlight",
  WATER_LEAK: "Water Leak",
  BRIBERY: "Bribery",
  POWER_CUT: "Power Cut",
  SEWAGE: "Sewage",
  TREE_FALLEN: "Tree Fallen",
  OTHER: "Other"
};

const clampText = (value, maxLength = 160) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
};

const formatLabel = (value, labels) => labels[value] || String(value || "Unknown").replace(/_/g, " ");

const formatAge = (createdAt) => {
  const created = new Date(createdAt);
  const elapsedMs = Date.now() - created.getTime();
  const hours = Math.max(1, Math.round(elapsedMs / (1000 * 60 * 60)));

  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const getScopeLabel = (city, area = null) => (area ? `${area}, ${city}` : `${city} Citywide`);

const getReportCacheKey = (city, area = null) =>
  `${String(city || "").trim().toLowerCase()}::${String(area || "__citywide__").trim().toLowerCase()}`;

const normalizeMarkdown = (value) =>
  String(value || "")
    .replace(/^```markdown\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const withTimeout = async (promise, timeoutMs) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`AI report timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const summariseIssuesForReport = (city, issues, area = null) => {
  const scopeLabel = getScopeLabel(city, area);
  const statusCounts = {};
  const categoryCounts = {};
  const areaCounts = {};

  for (const issue of issues) {
    statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
    categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;

    const areaLabel = issue.area || "Unspecified";
    areaCounts[areaLabel] = (areaCounts[areaLabel] || 0) + 1;
  }

  const openIssues = issues.filter((issue) => !["RESOLVED", "REJECTED"].includes(issue.status));
  const resolvedCount = statusCounts.RESOLVED || 0;
  const rejectedCount = statusCounts.REJECTED || 0;
  const avgIntensity = issues.reduce((sum, issue) => sum + Number(issue.intensity || 0), 0) / issues.length;
  const highestIntensity = issues.reduce((highest, issue) => Math.max(highest, Number(issue.intensity || 0)), 0);
  const stalledOpenIssues = openIssues.filter((issue) => Date.now() - new Date(issue.createdAt).getTime() > 3 * 24 * 60 * 60 * 1000);

  const recentIssues = issues.slice(0, 8).map((issue) => ({
    title: clampText(issue.title, 72),
    link: `/issues/${issue.id}`,
    area: issue.area || "Unspecified",
    category: formatLabel(issue.category, CATEGORY_LABELS),
    status: formatLabel(issue.status, STATUS_LABELS),
    intensity: Number(issue.intensity || 0),
    age: formatAge(issue.createdAt),
    summary: clampText(issue.description, 140)
  }));

  const urgentIssues = [...issues]
    .sort((left, right) => {
      const intensityDelta = Number(right.intensity || 0) - Number(left.intensity || 0);
      if (intensityDelta !== 0) return intensityDelta;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })
    .slice(0, 5)
    .map((issue) => ({
      title: clampText(issue.title, 72),
      link: `/issues/${issue.id}`,
      area: issue.area || "Unspecified",
      category: formatLabel(issue.category, CATEGORY_LABELS),
      status: formatLabel(issue.status, STATUS_LABELS),
      intensity: Number(issue.intensity || 0),
      age: formatAge(issue.createdAt),
      summary: clampText(issue.description, 140)
    }));

  const categoryBreakdown = Object.entries(categoryCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([category, count]) => ({
      category: formatLabel(category, CATEGORY_LABELS),
      count
    }));

  const hotspotAreas = Object.entries(areaCounts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([areaName, count]) => ({
      area: areaName,
      count
    }));

  const statusBreakdown = Object.entries(statusCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([status, count]) => ({
      status: formatLabel(status, STATUS_LABELS),
      count
    }));

  return {
    scopeLabel,
    totalIssues: issues.length,
    openIssues: openIssues.length,
    resolvedCount,
    rejectedCount,
    stalledOpenCount: stalledOpenIssues.length,
    avgIntensity: Number.isFinite(avgIntensity) ? Number(avgIntensity.toFixed(1)) : 0,
    highestIntensity,
    statusBreakdown,
    categoryBreakdown,
    hotspotAreas,
    urgentIssues,
    recentIssues
  };
};

export const buildEmptyCityReport = (city, area = null) => {
  const scopeLabel = getScopeLabel(city, area);

  return [
    `# Civic Operations Brief: ${scopeLabel}`,
    "",
    "## Executive Summary",
    `- No recent issue reports were found for **${scopeLabel}**.`,
    "- The dashboard is ready, but there is not enough incoming activity yet to generate a trend-based diagnostic brief.",
    "",
    "## Recommended Actions",
    "- Encourage residents and field teams to submit fresh reports in this coverage area.",
    "- Re-run this report after new incidents are logged to unlock trend and hotspot analysis."
  ].join("\n");
};

const buildInstantCityReport = (summary) => {
  const topCategory = summary.categoryBreakdown[0];
  const topHotspot = summary.hotspotAreas[0];

  const categoryLines = summary.categoryBreakdown.length
    ? summary.categoryBreakdown
        .slice(0, 4)
        .map(({ category, count }) => `- **${category}:** ${count} reports in the current analysis window.`)
    : ["- Category pressure is still too low to identify a meaningful trend."];

  const hotspotLines = summary.hotspotAreas.length
    ? summary.hotspotAreas.map(({ area, count }) => `- **${area}:** ${count} active signals in the latest dataset.`)
    : ["- No area hotspot stands out yet from the available reports."];

  const urgentLines = summary.urgentIssues.length
    ? summary.urgentIssues.map(
        (issue) =>
          `- [${issue.title}](${issue.link}) in **${issue.area}** is tagged **${issue.category}**, sits at **${issue.intensity}/10 intensity**, and is currently **${issue.status}**. ${issue.summary}`
      )
    : ["- No urgent issue references are available in the current dataset."];

  const recommendations = [
    topHotspot
      ? `- Deploy a focused sweep in **${topHotspot.area}** first, because it currently produces the highest issue concentration.`
      : "- Keep field monitoring broad until a stronger location-based hotspot emerges.",
    topCategory
      ? `- Create a short operational burst for **${topCategory.category.toLowerCase()}** cases, since that is the heaviest category in the latest window.`
      : "- Group new cases by category as they arrive so repeat patterns become visible faster.",
    summary.stalledOpenCount > 0
      ? `- Review the **${summary.stalledOpenCount} older open cases** for stalled ownership, status drift, or missing citizen updates.`
      : "- Maintain the current closeout pace so the open queue does not age into a backlog.",
    summary.highestIntensity >= 8
      ? "- Escalate the highest-intensity issues to senior staff for same-day review and public communication."
      : "- Keep severe-issue monitoring active, but the current dataset does not show a critical emergency cluster."
  ];

  return [
    `# Civic Operations Brief: ${summary.scopeLabel}`,
    "",
    "## Executive Summary",
    `- **${summary.totalIssues} recent reports** were analyzed for **${summary.scopeLabel}**.`,
    `- **${summary.openIssues} issues remain active**, while **${summary.resolvedCount}** are resolved and **${summary.rejectedCount}** are closed without action.`,
    `- Average intensity is **${summary.avgIntensity}/10**, with the highest reported severity reaching **${summary.highestIntensity}/10**.`,
    "",
    "## Metrics Snapshot",
    "| Metric | Value |",
    "| --- | --- |",
    `| Reports analyzed | ${summary.totalIssues} |`,
    `| Open issues | ${summary.openIssues} |`,
    `| Resolved issues | ${summary.resolvedCount} |`,
    `| Rejected issues | ${summary.rejectedCount} |`,
    `| Older open cases | ${summary.stalledOpenCount} |`,
    `| Average intensity | ${summary.avgIntensity}/10 |`,
    "",
    "## Trend Diagnosis",
    "### Category pressure",
    ...categoryLines,
    "",
    "### Geographic hotspots",
    ...hotspotLines,
    "",
    "## Priority Issues",
    ...urgentLines,
    "",
    "## Recommended Actions",
    ...recommendations
  ].join("\n");
};

export const getCachedCityReport = (city, area = null) => {
  const key = getReportCacheKey(city, area);
  const cached = reportCache.get(key);

  if (!cached) return null;

  if (Date.now() - cached.cachedAt > REPORT_CACHE_TTL_MS) {
    reportCache.delete(key);
    return null;
  }

  return {
    ...cached.payload,
    cached: true
  };
};

export const setCachedCityReport = (city, area = null, payload) => {
  const key = getReportCacheKey(city, area);

  reportCache.set(key, {
    cachedAt: Date.now(),
    payload: {
      ...payload,
      cached: false
    }
  });

  if (reportCache.size <= REPORT_CACHE_LIMIT) return;

  const oldestKey = reportCache.keys().next().value;
  if (oldestKey) reportCache.delete(oldestKey);
};

export const invalidateCityReportCache = (city, area = null) => {
  const normalizedCity = String(city || "").trim().toLowerCase();
  const normalizedArea = area ? String(area).trim().toLowerCase() : null;

  for (const key of reportCache.keys()) {
    const [cachedCity, cachedArea] = key.split("::");
    if (cachedCity !== normalizedCity) continue;

    if (cachedArea === "__citywide__" || normalizedArea === null || cachedArea === normalizedArea) {
      reportCache.delete(key);
    }
  }
};

async function nvidiaChatRaw(systemPrompt, userPrompt, options = {}) {
  const {
    temperature = 0.2,
    maxTokens = 2048
  } = options;

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
      temperature,
      max_tokens: maxTokens,
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
  const summary = summariseIssuesForReport(city, issues, area);
  const fallbackReport = buildInstantCityReport(summary);

  try {
    const result = await withTimeout(
      nvidiaChatRaw(
        "You are a civic operations analyst creating a sharp, decision-ready markdown brief.\n" +
          "Rules:\n" +
          "1. Keep the report concise, structured, and readable on small screens.\n" +
          "2. Use exactly these sections: ## Executive Summary, ## Metrics Snapshot, ## Trend Diagnosis, ## Priority Issues, ## Recommended Actions.\n" +
          "3. Include one markdown table inside Metrics Snapshot.\n" +
          "4. When referencing specific incidents, use the provided deep links exactly as written, for example [Issue Title](/issues/abc123).\n" +
          "5. Use professional language, short paragraphs, and bullet points. Avoid code fences.\n" +
          "6. Keep the report under 900 words while still being concrete and useful.",
        `Prepare a report for ${summary.scopeLabel} using this structured dataset: ${JSON.stringify(summary)}.`,
        { maxTokens: 1400, temperature: 0.15 }
      ),
      REPORT_TIMEOUT_MS
    );

    const normalizedReport = normalizeMarkdown(result);
    if (!normalizedReport) throw new Error("AI report returned empty content");

    return {
      report: normalizedReport,
      source: "ai"
    };
  } catch (error) {
    console.warn("AI report fallback activated:", error.message);
    return {
      report: fallbackReport,
      source: "instant"
    };
  }
}
