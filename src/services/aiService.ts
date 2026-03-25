// Use Vercel serverless function as proxy to avoid CORS
const OPENAI_API_URL = "/api/openai";

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

export interface DocumentIntelligence {
  summary: string;
  themes: ThemeNode[];
  keyInsights: {
    mainPoints: string[];
    keyQuotes: { text: string; relevance: string }[];
    patterns: string[];
  };
  mindMap: MindMapNode;
}

export interface ThemeNode {
  name: string;
  description: string;
  subThemes?: ThemeNode[];
  confidence: number;
}

export interface MindMapNode {
  id: string;
  name: string;
  type: "root" | "theme" | "subtheme" | "concept";
  children?: MindMapNode[];
  description?: string;
  frequency?: number;
}

async function callOpenAI(
  messages: { role: string; content: string }[],
  temperature = 0.7,
): Promise<string> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        temperature,
        max_tokens: 1000,
      }),
    });

    console.log("OpenAI Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.details || response.statusText;
      
      console.error("OpenAI API Error:", response.status, errorData);
      
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenAI API key in Vercel environment variables.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      } else if (response.status === 403) {
        throw new Error("API key doesn't have access. Check your OpenAI account permissions.");
      } else if (response.status === 500) {
        throw new Error(`Server error: ${errorMessage}`);
      }
      
      throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    console.log("OpenAI Response received successfully");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Fetch Error Details:", error);
    
    // Handle network/fetch errors specifically
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Failed to connect to OpenAI. Check your internet connection or try again later.");
    }
    
    // Re-throw if it's already an error with a message
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error("Unexpected error connecting to OpenAI API.");
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

export async function analyzeDocument(
  documentTitle: string,
  documentContent: string,
): Promise<DocumentIntelligence> {
  try {
    // Truncate very long documents for API limits
    const maxContentLength = 6000; // Reduced for better API performance
    const truncatedContent =
      documentContent.length > maxContentLength
        ? documentContent.substring(0, maxContentLength) + "\n\n[Document truncated for analysis...]"
        : documentContent;

    const prompt = `Analyze this qualitative research document and provide a comprehensive intelligence report.

Document Title: "${documentTitle}"

Content:
${truncatedContent}

Provide a detailed analysis as a JSON object with this EXACT structure:
{
  "summary": "A 2-3 paragraph executive summary",
  "themes": [
    {
      "name": "Theme Name",
      "description": "Theme description",
      "confidence": 0.85,
      "subThemes": [
        {
          "name": "Sub-theme Name",
          "description": "Sub-theme description",
          "confidence": 0.75
        }
      ]
    }
  ],
  "keyInsights": {
    "mainPoints": ["Point 1", "Point 2", "Point 3"],
    "keyQuotes": [
      {"text": "Quote text", "relevance": "Why it matters"}
    ],
    "patterns": ["Pattern 1", "Pattern 2"]
  },
  "mindMap": {
    "id": "root",
    "name": "${documentTitle}",
    "type": "root",
    "children": [
      {
        "id": "theme1",
        "name": "Theme Name",
        "type": "theme",
        "description": "Theme description",
        "children": [
          {
            "id": "subtheme1",
            "name": "Sub-theme",
            "type": "subtheme",
            "description": "Details"
          }
        ]
      }
    ]
  }
}

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Identify 3-5 main themes from the actual content
- Each theme should have 1-3 sub-themes based on the document
- Use actual quotes from the document text
- Confidence values between 0.6 and 0.95`;

    console.log("Starting document analysis...");
    
    const response = await callOpenAI(
      [
        {
          role: "system",
          content:
            "You are an expert qualitative research analyst. Analyze documents and return ONLY a valid JSON object with no additional text, markdown formatting, or code blocks. Extract themes, patterns, and insights from the actual document content.",
        },
        { role: "user", content: prompt },
      ],
      0.3, // Lower temperature for more consistent structured output
    );

    console.log("Received analysis response, parsing JSON...");
    
    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }
    
    const analysis = JSON.parse(cleanedResponse);
    console.log("Document analysis successful!");
    return analysis;
  } catch (error) {
    console.error("Document analysis error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    
    // If it's a parsing error, throw it so the user knows
    if (error instanceof SyntaxError) {
      throw new Error("AI returned invalid data format. Please try again or check your API configuration.");
    }
    
    // If it's an API error, pass it through
    if (error instanceof Error) {
      throw error;
    }
    
    // Generic error
    throw new Error("Document analysis failed unexpectedly. Please try again.");
  }
}
