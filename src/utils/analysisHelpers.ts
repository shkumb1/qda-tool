import type { Code, CodeExcerpt, CoOccurrence } from "@/types/qda";

export function calculateCoOccurrences(
  codes: Code[],
  excerpts: CodeExcerpt[]
): CoOccurrence[] {
  const coOccurrenceMap = new Map<string, CoOccurrence>();

  // Group excerpts by document
  const excerptsByDoc = new Map<string, CodeExcerpt[]>();
  excerpts.forEach((excerpt) => {
    const docExcerpts = excerptsByDoc.get(excerpt.documentId) || [];
    docExcerpts.push(excerpt);
    excerptsByDoc.set(excerpt.documentId, docExcerpts);
  });

  // For each document, find codes that appear together
  excerptsByDoc.forEach((docExcerpts, documentId) => {
    // Get all unique codes in this document
    const docCodes = new Set<string>();
    docExcerpts.forEach((e) => e.codeIds.forEach((id) => docCodes.add(id)));

    // Create pairs
    const codeArray = Array.from(docCodes);
    for (let i = 0; i < codeArray.length; i++) {
      for (let j = i + 1; j < codeArray.length; j++) {
        const key = [codeArray[i], codeArray[j]].sort().join("-");
        const existing = coOccurrenceMap.get(key);

        if (existing) {
          existing.weight++;
          if (!existing.documentIds.includes(documentId)) {
            existing.documentIds.push(documentId);
          }
        } else {
          coOccurrenceMap.set(key, {
            code1Id: codeArray[i],
            code2Id: codeArray[j],
            weight: 1,
            documentIds: [documentId],
          });
        }
      }
    }
  });

  return Array.from(coOccurrenceMap.values());
}

export function buildHierarchicalTree(codes: Code[]) {
  const rootCodes = codes.filter((c) => !c.parentId);

  const buildNode = (code: Code): any => {
    const children = codes.filter((c) => c.parentId === code.id);
    return {
      id: code.id,
      name: code.name,
      frequency: code.frequency,
      level: code.level,
      color: code.color,
      children: children.length > 0 ? children.map(buildNode) : undefined,
    };
  };

  return rootCodes.map(buildNode);
}

export function getCodeStats(codes: Code[], excerpts: CodeExcerpt[]) {
  return {
    totalCodes: codes.length,
    mainCodes: codes.filter((c) => c.level === "main").length,
    childCodes: codes.filter((c) => c.level === "child").length,
    subchildCodes: codes.filter((c) => c.level === "subchild").length,
    totalExcerpts: excerpts.length,
    averageFrequency:
      codes.length > 0
        ? codes.reduce((sum, c) => sum + c.frequency, 0) / codes.length
        : 0,
  };
}

export function getCodeExcerptCount(
  codeId: string,
  excerpts: CodeExcerpt[]
): number {
  return excerpts.filter((e) => e.codeIds.includes(codeId)).length;
}

export function getCodeDocumentCount(
  codeId: string,
  excerpts: CodeExcerpt[]
): number {
  const uniqueDocIds = new Set(
    excerpts.filter((e) => e.codeIds.includes(codeId)).map((e) => e.documentId)
  );
  return uniqueDocIds.size;
}
