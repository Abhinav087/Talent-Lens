export const MODELS = [
  { id: "openai/gpt-4o-mini:free", name: "GPT-4o Mini" },
  { id: "qwen/qwen3-30b-a3b:free", name: "Qwen3 30B" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B" },
  { id: "qwen/qwen3-coder:free", name: "Qwen3 Coder 480B" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Llama 3.1 Nemotron 253B" },
  // Highly stable backup models to ensure the tool always succeeds during upstream provider outages
  { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B" },
  { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B" }
];

export const SYSTEM_PROMPT = `You are an expert, objective resume analyzer and ATS optimization engine.
Your task is to analyze the provided resume text against the target job role.

CRITICAL RULES FOR CONSISTENCY, OBJECTIVITY & VALIDITY:
1. Be highly deterministic and strict. Rate similar resumes consistently.
2. Do NOT invent, hallucinate, or suggest any details, skills, or improvements unless they are highly accurate and strongly supported by the resume text and the target job description.
3. If a field (e.g. toAdd, toRemove, improvements, atsIssues) is not applicable or you do not have high-confidence suggestions, return an empty array [] for that field. Never provide generic, template-based, or filler suggestions just to populate the array. No generic advice like 'make it look nice' or 'proofread'.
4. Do not offer misleading or false career advice. All recommended additions/removals/improvements must be directly relevant and actionable for a candidate applying to this specific target job role.
5. All scores (atsScore, relevanceScore, overallScore, sectionScores) must be calculated using objective criteria based on:
   - Match between resume content and target job expectations (relevance)
   - Formatting and structure indicators (formatting)
   - Numerical metrics and output metrics used to describe work experience (quantification)
6. **Target Job Role Guidance**: If the user-provided target job role is "Not Sure", analyze the resume's experiences, education, and skills to determine the single best-fit target role for the candidate, and return it in "detectedTargetRole". If a specific target role is provided, return that exact role in "detectedTargetRole".
7. **Local Currency salary formatting**: Detect the candidate's country/region from the resume (e.g. city/state names, phone codes, universities). Represent all salary values in that region's local currency.
   - For USA/Default: currencySymbol is "$", stats values like "$50k-70k", trend values as plain integers (e.g. 55000, 75000).
   - For India: currencySymbol is "₹", stats values like "₹6L-10L" or "₹12L-18L" (L = Lakhs), trend values as plain integers (e.g. 600000, 1200000).
   - For UK: currencySymbol is "£", stats values like "£30k-45k", trend values as plain integers (e.g. 35000, 48000).
   - For Europe: currencySymbol is "€", stats values like "€40k-60k", trend values as plain integers (e.g. 45000, 58000).
   - Adjust other currencies similarly. If the region is unidentifiable, default to USA ($).
8. You MUST respond ONLY with a raw JSON object matching the schema below. No markdown fences (do NOT wrap in \`\`\`json), no preamble, no explanations.

JSON Schema:
{
  "candidateName": "string",
  "detectedTargetRole": "string (the target role being analyzed - either the user's specific target role or the AI-detected best fit target role)",
  "currencySymbol": "string (e.g. $, ₹, £, €)",
  "atsScore": number (0-100),
  "relevanceScore": number (0-100),
  "overallScore": number (0-100),
  "scoreSummary": "2 sentence plain English verdict. Must be objective and matter-of-fact.",
  "sectionScores": [
    { "name": "Work experience", "score": number (0-100) },
    { "name": "Skills", "score": number (0-100) },
    { "name": "Education", "score": number (0-100) },
    { "name": "Projects", "score": number (0-100) },
    { "name": "Formatting", "score": number (0-100) },
    { "name": "Quantification", "score": number (0-100) }
  ],
  "skillMatch": [
    { "skill": "string (max 20 chars)", "match": number (0-100) }
  ],
  "salaryStats": [
    { "label": "Entry", "value": "string (formatted with local currency symbol, e.g. $45k-60k or ₹6L-8L)" },
    { "label": "Mid", "value": "string (formatted with local currency symbol, e.g. $80k-110k or ₹12L-16L)" },
    { "label": "Senior", "value": "string (formatted with local currency symbol, e.g. $130k-170k or ₹22L-30L)" },
    { "label": "Demand", "value": "High" | "Medium" | "Low" }
  ],
  "salaryTrend": [
    { "level": "Entry", "salary": number (plain integer in local currency, e.g. 50000 or 600000) },
    { "level": "Mid", "salary": number (plain integer in local currency, e.g. 90000 or 1400000) },
    { "level": "Senior", "salary": number (plain integer in local currency, e.g. 150000 or 2500000) },
    { "level": "Lead", "salary": number (plain integer in local currency, e.g. 180000 or 3000000) },
    { "level": "Principal", "salary": number (plain integer in local currency, e.g. 220000 or 3800000) }
  ],
  "salarySource": "string",
  "improvements": [
    { "title": "string", "detail": "string" }
  ],
  "toAdd": ["string"],
  "toRemove": ["string"],
  "atsIssues": ["string"],
  "learningRoadmap": [
    {
      "skill": "string (name of the skill from those recommended to add)",
      "steps": [
        "string (Step 1: clear actionable learning resource, course keyword, or certification)",
        "string (Step 2: practical project or hands-on application to build)",
        "string (Step 3: how to showcase or implement this skill on the resume)"
      ]
    }
  ],
  "interviewTopics": [
    { "area": "string", "questions": ["string", "string"] }
  ],
  "marketTrends": "string"
}`;

/**
 * Analyzes resume content by calling the OpenRouter API with a fallback model chain.
 * 
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.resumeText
 * @param {string} params.targetRole
 * @param {Function} params.onModelAttempt
 * @returns {Promise<Object>} The parsed analysis report JSON
 */
export async function analyzeResume({ apiKey, resumeText, targetRole, onModelAttempt }) {
  const cleanApiKey = (apiKey || "").trim();
  const cleanTargetRole = (targetRole || "").trim();

  const userMessage = `Resume content:
${resumeText}

Target job role:
${cleanTargetRole}`;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    if (onModelAttempt) {
      onModelAttempt(model.name);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${cleanApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://resume-analyzer.app",
          "X-Title": "Resume Analyzer"
        },
        body: JSON.stringify({
          model: model.id,
          max_tokens: 4000,
          temperature: 0.0, // Minimize creativity to enforce strict, consistent scoring
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        clearTimeout(timeoutId);
        let errorMsg = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorJson.message || errorText;
        } catch (_) {}

        const isFallbackable = response.status === 429 || response.status === 502 || response.status === 503 ||
          errorMsg.toLowerCase().includes("rate limit") ||
          errorMsg.toLowerCase().includes("unavailable") ||
          errorMsg.toLowerCase().includes("overloaded") ||
          errorMsg.toLowerCase().includes("bad gateway");

        if (isFallbackable && i < MODELS.length - 1) {
          console.warn(`Transient error on ${model.name}. Falling back to next model...`);
          continue;
        } else {
          throw new Error(`API Error (${response.status}) on ${model.name}: ${errorMsg}`);
        }
      }

      const data = await response.json();
      clearTimeout(timeoutId);
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error(`Invalid response format from ${model.name}: choices[0].message.content is empty`);
      }

      // Clean JSON: strip markdown fences
      let cleanContent = rawContent.trim();
      if (cleanContent.startsWith("```")) {
        const jsonStart = cleanContent.indexOf("{");
        const jsonEnd = cleanContent.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
        } else {
          cleanContent = cleanContent.replace(/```json/g, "").replace(/```/g, "").trim();
        }
      }

      try {
        const parsedData = JSON.parse(cleanContent);
        // Simple safety checks for required scores
        if (typeof parsedData.atsScore !== 'number' || typeof parsedData.overallScore !== 'number') {
          throw new Error("Missing score parameters in parsed response JSON");
        }
        return parsedData;
      } catch (parseErr) {
        throw new Error(`Failed to parse JSON response from ${model.name}: ${parseErr.message}`);
      }

    } catch (error) {
      clearTimeout(timeoutId);
      const errorStr = error.message || String(error);
      const isAbort = error.name === "AbortError" || errorStr.toLowerCase().includes("aborted");
      
      const isFallbackable = isAbort ||
        errorStr.toLowerCase().includes("rate limit") ||
        errorStr.toLowerCase().includes("unavailable") ||
        errorStr.toLowerCase().includes("overloaded") ||
        errorStr.toLowerCase().includes("failed to fetch") ||
        errorStr.toLowerCase().includes("bad gateway");

      if (isFallbackable && i < MODELS.length - 1) {
        console.warn(`Error on ${model.name}: ${errorStr}. Falling back to next model...`);
        continue;
      } else {
        throw error;
      }
    }
  }

  throw new Error("All models in the fallback chain were exhausted or failed.");
}
