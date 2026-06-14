export const MODELS = [
  // Free models (prioritized to keep the application 100% free to use)
  { id: "openai/gpt-4o-mini:free", name: "GPT-4o Mini (Free)" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (Free)" },
  { id: "qwen/qwen3-30b-a3b:free", name: "Qwen3 30B (Free)" },
  // Paid fallback options (only queried if free endpoints are completely down/congested)
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" }
];

export const SYSTEM_PROMPT = `You are an expert, objective resume analyzer and ATS optimization engine.
Your task is to analyze the provided resume text against the target job role.

CRITICAL RULES FOR CONSISTENCY, OBJECTIVITY & SPEED:
1. Be highly deterministic. Rate similar resumes consistently across sessions.
2. Keep all text descriptions and details concise (1-2 sentences maximum) to maintain high analytical depth and quality while remaining fast.
3. Limit all lists/arrays (improvements, toAdd, toRemove, atsIssues, roadmapSteps) to a maximum of 3 items.
4. **Skill Matching**: For "skillMatch", identify the top 6-8 core technical skills required for the target job role. Evaluate the candidate's actual experience and evidence in the resume for each skill, scoring it objectively from 0-100. Do not include generic soft skills unless they are critical technical competencies.
5. If a target company name is specified, tailor the advice, skills, and companyAlignment block using your knowledge of their business and workspace culture. If not specified, set all fields in companyAlignment to "".
6. You MUST respond ONLY with a raw JSON object matching the schema below. No markdown, no explanations.

SCORING METRICS (0-100):
- atsScore: 90+ for standard single-column PDF layout, 70-89 for minor format/header issues, <70 for complex columns/graphics.
- relevanceScore: 90+ for direct target role/skill matches, 70-89 for adjacent transferable roles, <70 for career switchers.
- overallScore: Average of atsScore and relevanceScore.
- Section Scores: Work experience (role alignment), Skills (keyword match), Education (relevance), Projects (practical work), Formatting (layout quality), Quantification (percentage of bullets with metrics: >50% = 85+, 20-49% = 70-84, <20% = <70).

JSON Schema:
{
  "candidateName": "string",
  "detectedTargetRole": "string",
  "currencySymbol": "string",
  "atsScore": number,
  "relevanceScore": number,
  "overallScore": number,
  "scoreSummary": "string (1-2 sentences)",
  "sectionScores": [
    { "name": "Work experience", "score": number },
    { "name": "Skills", "score": number },
    { "name": "Education", "score": number },
    { "name": "Projects", "score": number },
    { "name": "Formatting", "score": number },
    { "name": "Quantification", "score": number }
  ],
  "skillMatch": [
    { "skill": "string", "match": number }
  ],
  "salaryStats": [
    { "label": "Entry", "value": "string" },
    { "label": "Mid", "value": "string" },
    { "label": "Senior", "value": "string" },
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
  "learningRoadmap": [
    {
      "skill": "string",
      "steps": ["string", "string", "string"]
    }
  ],
  "careerRoadmap": {
    "currentSeniority": "string (Junior | Mid-Level | Senior | Lead | Principal)",
    "currentAssessment": "string (1 sentence)",
    "potentialGrowth": "string (potential peak role in 5-10 years, e.g. Staff Engineer, CTO)",
    "roadmapSteps": [
      {
        "phase": "string (e.g. Next Step)",
        "roleTitle": "string",
        "timeframe": "string",
        "keyFocus": "string",
        "potentialImpact": "string"
      }
    ]
  },
  "techToLearn": [
    {
      "category": "string",
      "skills": [
        {
          "name": "string",
          "priority": "High" | "Medium" | "Low",
          "reason": "string"
        }
      ]
    }
  ],
  "companyAlignment": {
    "companyName": "string",
    "alignedGoals": "string",
    "workspaceCulture": "string",
    "resumeFit": "string",
    "tailoredAdvice": "string"
  },
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
 * @param {string} [params.companyName]
 * @param {Function} params.onModelAttempt
 * @returns {Promise<Object>} The parsed analysis report JSON
 */
export async function analyzeResume({ apiKey, resumeText, targetRole, companyName, onModelAttempt }) {
  const cleanApiKey = (apiKey || "").trim();
  const cleanTargetRole = (targetRole || "").trim();
  const cleanCompanyName = (companyName || "").trim();

  const userMessage = `Resume content:
${resumeText}

Target job role:
${cleanTargetRole}
${cleanCompanyName ? `Target Company Name: ${cleanCompanyName}` : ""}`;

  for (let i = 0; i < MODELS.length; i++) {

    const model = MODELS[i];
    if (onModelAttempt) {
      onModelAttempt(model.name);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds timeout (fail-fast to next model)

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
