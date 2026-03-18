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
  temperature = 0.7,
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.");
  }

  try {
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
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenAI API key in .env file.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      } else if (response.status === 403) {
        throw new Error("API key doesn't have access. Check your OpenAI account permissions.");
      }
      
      throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error. Please check your internet connection.");
  }
}

export async function suggestCodes(
  selectedText: string,
  existingCodes: string[],
  fullDocumentContext?: string,
): Promise<AICodeSuggestion[]> {
  try {
    const contextPrompt = fullDocumentContext
      ? `\n\nFull document context for reference:\n${fullDocumentContext.substring(
          0,
          3000,
        )}...`
      : "";

    const textLengthNote = selectedText.length < 20 
      ? "\n\nNote: This is a SHORT text selection (single word or phrase). Provide 2-3 focused, specific codes appropriate for this brief excerpt."
      : "\n\nProvide 3-5 relevant codes for this text selection.";

    const prompt = `You are a qualitative data analysis expert. Analyze the following selected text and suggest relevant codes for qualitative coding.

Selected text: "${selectedText}"
${contextPrompt}${textLengthNote}

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
4. Even short text can be meaningfully coded

IMPORTANT: Return ONLY a valid JSON array, with no markdown formatting, no code blocks, no explanation text. Just the JSON array.`;

    const response = await callOpenAI([
      {
        role: "system",
        content:
          "You are a qualitative research assistant specializing in coding interview transcripts and documents. Always return valid JSON arrays with no markdown formatting.",
      },
      { role: "user", content: prompt },
    ]);

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, "").replace(/```$/, "").trim();
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, "").replace(/```$/, "").trim();
    }

    console.log("AI Response:", cleanedResponse);
    
    try {
      const suggestions = JSON.parse(cleanedResponse);
      if (!Array.isArray(suggestions)) {
        throw new Error("AI response is not an array");
      }
      return suggestions;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Response was:", cleanedResponse);
      throw new Error(`Failed to parse AI response. The AI returned invalid JSON. Raw response: ${cleanedResponse.substring(0, 200)}`);
    }
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get AI suggestions");
  }
}

// Fallback keyword-based suggestions
function getKeywordBasedSuggestions(
  selectedText: string,
  existingCodes: string[],
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
          code.toLowerCase().includes(ec.toLowerCase()),
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
  codes: { name: string; frequency: number; documentCount: number }[],
): Promise<AIRefinementSuggestion[]> {
  try {
    const prompt = `Analyze these qualitative codes and suggest refinements (merge similar codes, split broad codes, rename unclear ones, or group related codes):

Codes:
${codes
  .map(
    (c) =>
      `- "${c.name}" (${c.frequency} excerpts, ${c.documentCount} documents)`,
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
      0.5,
    );

    return JSON.parse(response).slice(0, 5);
  } catch (error) {
    return [];
  }
}

export async function suggestThemes(
  codes: { name: string; frequency: number }[],
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
      0.6,
    );

    return JSON.parse(response);
  } catch (error) {
    return [];
  }
}

export async function generateSummary(
  type: "code" | "theme",
  name: string,
  excerpts: string[],
  documentTitles: string[],
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
    return {
      meaning: `"${name}" captures instances related to ${name.toLowerCase()}. Found ${
        excerpts.length
      } time(s) across ${documentTitles.length} document(s).`,
      keyExcerpts: excerpts.slice(0, 3).map((e) => e.substring(0, 100) + "..."),
      documentPresence: `Found in: ${documentTitles.join(", ")}`,
    };
  }
}
