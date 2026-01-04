const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface AICodeSuggestion {
  code: string;
  confidence: number;
  reason: string;
  existingMatch?: string;
}

export interface AIRefinementSuggestion {
  type: "merge" | "split" | "rename" | "group";
  codes: string[];
  suggestion: string;
  reason: string;
}

export interface AIThemeSuggestion {
  name: string;
  description: string;
  suggestedCodes: string[];
  summary: string;
}

export interface AISummary {
  meaning: string;
  keyExcerpts: string[];
  documentPresence: string;
}

async function callOpenAI(
  messages: { role: string; content: string }[],
  temperature = 0.7
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      temperature,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function suggestCodes(
  selectedText: string,
  existingCodes: string[],
  fullDocumentContext?: string
): Promise<AICodeSuggestion[]> {
  try {
    const contextPrompt = fullDocumentContext
      ? `\n\nFull document context for reference:\n${fullDocumentContext.substring(
          0,
          3000
        )}...`
      : "";

    const prompt = `You are a qualitative data analysis expert. Analyze the following selected text and suggest 3-5 relevant codes for qualitative coding.

Selected text: "${selectedText}"
${contextPrompt}

Existing codes: ${
      existingCodes.length > 0 ? existingCodes.join(", ") : "None yet"
    }

Return a JSON array of suggestions with this exact format:
[
  {
    "code": "Code Name",
    "confidence": 0.85,
    "reason": "Brief explanation of why this code fits",
    "existingMatch": "ExistingCodeName or null"
  }
]

Consider:
1. The meaning and context of the selected text${
      fullDocumentContext ? " within the full document" : ""
    }
2. Whether similar codes already exist
3. Standard qualitative coding practices

Return only the JSON array, no other text.`;

    const response = await callOpenAI([
      {
        role: "system",
        content:
          "You are a qualitative research assistant specializing in coding interview transcripts and documents.",
      },
      { role: "user", content: prompt },
    ]);

    const suggestions = JSON.parse(response);
    return suggestions;
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    // Fallback to keyword-based suggestions
    return getKeywordBasedSuggestions(selectedText, existingCodes);
  }
}

// Fallback keyword-based suggestions
function getKeywordBasedSuggestions(
  selectedText: string,
  existingCodes: string[]
): AICodeSuggestion[] {
  const CODE_KEYWORDS: Record<string, string[]> = {
    "Work-Life Balance": [
      "balance",
      "boundary",
      "boundaries",
      "personal",
      "family",
      "commute",
      "flexibility",
      "separation",
    ],
    Communication: [
      "communication",
      "email",
      "meeting",
      "call",
      "slack",
      "teams",
      "video",
      "message",
      "chat",
    ],
    Productivity: [
      "productive",
      "productivity",
      "focus",
      "efficient",
      "efficiency",
      "output",
      "performance",
      "work",
    ],
    "Mental Health": [
      "mental",
      "health",
      "stress",
      "anxiety",
      "isolation",
      "lonely",
      "wellbeing",
      "mood",
      "burnout",
    ],
    Collaboration: [
      "collaboration",
      "team",
      "together",
      "brainstorm",
      "creative",
      "colleague",
      "collective",
    ],
  };

  const text = selectedText.toLowerCase();
  const suggestions: AICodeSuggestion[] = [];

  Object.entries(CODE_KEYWORDS).forEach(([code, keywords]) => {
    const matchingKeywords = keywords.filter((kw) => text.includes(kw));
    if (matchingKeywords.length > 0) {
      const confidence = Math.min(0.95, 0.5 + matchingKeywords.length * 0.15);
      const existingMatch = existingCodes.find(
        (ec) =>
          ec.toLowerCase().includes(code.toLowerCase()) ||
          code.toLowerCase().includes(ec.toLowerCase())
      );

      suggestions.push({
        code,
        confidence,
        reason: `Contains keywords: ${matchingKeywords.join(", ")}`,
        existingMatch,
      });
    }
  });

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

export async function suggestRefinements(
  codes: { name: string; frequency: number; documentCount: number }[]
): Promise<AIRefinementSuggestion[]> {
  try {
    const prompt = `Analyze these qualitative codes and suggest refinements (merge similar codes, split broad codes, rename unclear ones, or group related codes):

Codes:
${codes
  .map(
    (c) =>
      `- "${c.name}" (${c.frequency} excerpts, ${c.documentCount} documents)`
  )
  .join("\n")}

Return a JSON array of up to 5 suggestions with this format:
[
  {
    "type": "merge|split|rename|group",
    "codes": ["Code1", "Code2"],
    "suggestion": "Brief action to take",
    "reason": "Why this refinement makes sense"
  }
]

Return only the JSON array.`;

    const response = await callOpenAI(
      [
        {
          role: "system",
          content:
            "You are a qualitative research expert helping refine a codebook.",
        },
        { role: "user", content: prompt },
      ],
      0.5
    );

    return JSON.parse(response).slice(0, 5);
  } catch (error) {
    console.error("Error getting refinement suggestions:", error);
    return [];
  }
}

export async function suggestThemes(
  codes: { name: string; frequency: number }[]
): Promise<AIThemeSuggestion[]> {
  try {
    const prompt = `Based on these qualitative codes, suggest 3-5 overarching themes that group related codes together:

Codes:
${codes.map((c) => `- "${c.name}" (${c.frequency} excerpts)`).join("\n")}

Return a JSON array with this format:
[
  {
    "name": "Theme Name",
    "description": "What this theme encompasses",
    "suggestedCodes": ["Code1", "Code2", "Code3"],
    "summary": "Brief explanation of the theme"
  }
]

Return only the JSON array.`;

    const response = await callOpenAI(
      [
        {
          role: "system",
          content:
            "You are a qualitative research expert identifying themes from codes.",
        },
        { role: "user", content: prompt },
      ],
      0.6
    );

    return JSON.parse(response);
  } catch (error) {
    console.error("Error getting theme suggestions:", error);
    return [];
  }
}

export async function generateSummary(
  type: "code" | "theme",
  name: string,
  excerpts: string[],
  documentTitles: string[]
): Promise<AISummary> {
  try {
    const excerptSamples = excerpts.slice(0, 5).join("\n\n");

    const prompt = `Summarize this ${type} "${name}" based on the coded excerpts:

Excerpts (${excerpts.length} total):
${excerptSamples}

Found in documents: ${documentTitles.join(", ")}

Provide:
1. A clear explanation of what this ${type} means in the research context
2. 2-3 key representative excerpts (use exact quotes from above)
3. How it appears across documents

Format as JSON:
{
  "meaning": "What this ${type} represents...",
  "keyExcerpts": ["excerpt 1", "excerpt 2"],
  "documentPresence": "Description of where it appears"
}`;

    const response = await callOpenAI([
      {
        role: "system",
        content:
          "You are a qualitative research assistant providing insights on coded data.",
      },
      { role: "user", content: prompt },
    ]);

    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating summary:", error);
    return {
      meaning: `"${name}" captures instances related to ${name.toLowerCase()}. Found ${
        excerpts.length
      } time(s) across ${documentTitles.length} document(s).`,
      keyExcerpts: excerpts.slice(0, 3).map((e) => e.substring(0, 100) + "..."),
      documentPresence: `Found in: ${documentTitles.join(", ")}`,
    };
  }
}
