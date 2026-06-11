export const MODELS = [
  { id: "openai/gpt-4o-mini:free", name: "GPT-4o Mini" },
  { id: "qwen/qwen3-30b-a3b:free", name: "Qwen3 30B" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B" },
  { id: "qwen/qwen3-coder:free", name: "Qwen3 Coder 480B" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Llama 3.1 Nemotron 253B" },
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
6. You MUST respond ONLY with a raw JSON object matching the schema below. No markdown fences (do NOT wrap in \`\`\`json), no preamble, no explanations.

JSON Schema:
{
  "candidateName": "string",
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
    { "label": "Entry", "value": "$X–Yk" },
    { "label": "Mid", "value": "$X–Yk" },
    { "label": "Senior", "value": "$X–Yk" },
    { "label": "Demand", "value": "High" | "Medium" | "Low" }
  ],
  "salaryTrend": [
    { "level": "Entry", "salary": number },
    { "level": "Mid", "salary": number },
    { "level": "Senior", "salary": number },
    { "level": "Lead", "salary": number },
    { "level": "Principal", "salary": number }
  ],
  "salarySource": "string",
  "improvements": [
    { "title": "string", "detail": "string" }
  ],
  "toAdd": ["string"],
  "toRemove": ["string"],
  "atsIssues": ["string"],
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
  const userMessage = `Resume content:
${resumeText}

Target job role:
${targetRole}`;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    if (onModelAttempt) {
      onModelAttempt(model.name);
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
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
        let errorMsg = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorJson.message || errorText;
        } catch (_) {}

        const isFallbackable = response.status === 429 || response.status === 503 ||
          errorMsg.toLowerCase().includes("rate limit") ||
          errorMsg.toLowerCase().includes("unavailable") ||
          errorMsg.toLowerCase().includes("overloaded");

        if (isFallbackable && i < MODELS.length - 1) {
          console.warn(`Transient error on ${model.name}. Falling back to next model...`);
          continue;
        } else {
          throw new Error(`API Error (${response.status}) on ${model.name}: ${errorMsg}`);
        }
      }

      const data = await response.json();
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
      const errorStr = error.message || String(error);
      const isFallbackable = errorStr.toLowerCase().includes("rate limit") ||
        errorStr.toLowerCase().includes("unavailable") ||
        errorStr.toLowerCase().includes("overloaded") ||
        errorStr.toLowerCase().includes("failed to fetch"); // Network disconnects/transient errors

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
