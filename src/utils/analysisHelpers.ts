import type { Code, CodeExcerpt, CoOccurrence } from "@/types/qda";

export function calculateCoOccurrences(
  codes: Code[],
  excerpts: CodeExcerpt[],
): CoOccurrence[] {
  const coOccurrenceMap = new Map<string, CoOccurrence>();

  // For each excerpt, find pairs of codes that appear together
  excerpts.forEach((excerpt) => {
    // Skip excerpts with less than 2 codes
    if (excerpt.codeIds.length < 2) return;

    // Create pairs from codes in this excerpt
    for (let i = 0; i < excerpt.codeIds.length; i++) {
      for (let j = i + 1; j < excerpt.codeIds.length; j++) {
        const code1 = excerpt.codeIds[i];
        const code2 = excerpt.codeIds[j];
        const key = [code1, code2].sort().join("-");
        const existing = coOccurrenceMap.get(key);

        if (existing) {
          existing.weight++;
          // Track unique documents where this pair appears
          if (!existing.documentIds.includes(excerpt.documentId)) {
            existing.documentIds.push(excerpt.documentId);
          }
        } else {
          coOccurrenceMap.set(key, {
            code1Id: code1,
            code2Id: code2,
            weight: 1,
            documentIds: [excerpt.documentId],
          });
        }
      }
    }
  });

  return Array.from(coOccurrenceMap.values());
}

export function getCodeExcerptCount(
  codeId: string,
  excerpts: CodeExcerpt[],
): number {
  return excerpts.filter((e) => e.codeIds.includes(codeId)).length;
}

export function getCodeDocumentCount(
  codeId: string,
  excerpts: CodeExcerpt[],
): number {
  const uniqueDocIds = new Set(
    excerpts.filter((e) => e.codeIds.includes(codeId)).map((e) => e.documentId),
  );
  return uniqueDocIds.size;
}
