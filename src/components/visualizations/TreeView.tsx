import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useQDAStore } from "@/store/qdaStore";
import type { Code } from "@/types/qda";

interface TreeViewProps {
  codes: Code[];
}

interface TreeNode {
  name: string;
  id: string;
  frequency: number;
  level: string;
  color: string;
  children?: TreeNode[];
}

export function TreeView({ codes }: TreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { setSelectedCode, themes } = useQDAStore();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || codes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 120, bottom: 40, left: 120 };

    // Build hierarchical data
    const buildTree = (): TreeNode => {
      const root: TreeNode = {
        name: "Analysis Structure",
        id: "root",
        frequency: 0,
        level: "root",
        color: "hsl(var(--muted-foreground))",
        children: [],
      };

      if (themes.length > 0) {
        themes.forEach((theme) => {
          const themeNode: TreeNode = {
            name: theme.name,
            id: theme.id,
            frequency: theme.codeIds.length,
            level: "theme",
            color: theme.color,
            children: [],
          };

          theme.codeIds.forEach((codeId) => {
            const code = codes.find((c) => c.id === codeId);
            if (!code) return;

            const codeNode: TreeNode = {
              name: code.name,
              id: code.id,
              frequency: code.frequency,
              level: code.level,
              color: code.color,
              children: [],
            };

            const children = codes.filter((c) => c.parentId === code.id);
            children.forEach((child) => {
              const childNode: TreeNode = {
                name: child.name,
                id: child.id,
                frequency: child.frequency,
                level: child.level,
                color: child.color,
                children: [],
              };

              const subchildren = codes.filter((c) => c.parentId === child.id);
              subchildren.forEach((subchild) => {
                childNode.children?.push({
                  name: subchild.name,
                  id: subchild.id,
                  frequency: subchild.frequency,
                  level: subchild.level,
                  color: subchild.color,
                });
              });

              if (childNode.children?.length === 0) delete childNode.children;
              codeNode.children?.push(childNode);
            });

            if (codeNode.children?.length === 0) delete codeNode.children;
            themeNode.children?.push(codeNode);
          });

          if (themeNode.children && themeNode.children.length > 0) {
            root.children?.push(themeNode);
          }
        });

        const assignedCodeIds = new Set(themes.flatMap((t) => t.codeIds));
        const unassignedCodes = codes.filter(
          (c) =>
            !assignedCodeIds.has(c.id) && !c.parentId && c.level === "main",
        );

        if (unassignedCodes.length > 0) {
          const unassignedNode: TreeNode = {
            name: "Unassigned Codes",
            id: "unassigned",
            frequency: unassignedCodes.length,
            level: "unassigned",
            color: "hsl(var(--muted))",
            children: [],
          };

          unassignedCodes.forEach((code) => {
            const codeNode: TreeNode = {
              name: code.name,
              id: code.id,
              frequency: code.frequency,
              level: code.level,
              color: code.color,
              children: [],
            };

            const children = codes.filter((c) => c.parentId === code.id);
            children.forEach((child) => {
              const childNode: TreeNode = {
                name: child.name,
                id: child.id,
                frequency: child.frequency,
                level: child.level,
                color: child.color,
                children: [],
              };

              const subchildren = codes.filter((c) => c.parentId === child.id);
              subchildren.forEach((subchild) => {
                childNode.children?.push({
                  name: subchild.name,
                  id: subchild.id,
                  frequency: subchild.frequency,
                  level: subchild.level,
                  color: subchild.color,
                });
              });

              if (childNode.children?.length === 0) delete childNode.children;
              codeNode.children?.push(childNode);
            });

            if (codeNode.children?.length === 0) delete codeNode.children;
            unassignedNode.children?.push(codeNode);
          });

          root.children?.push(unassignedNode);
        }
      } else {
        const mainCodes = codes.filter(
          (c) => !c.parentId && c.level === "main",
        );

        mainCodes.forEach((main) => {
          const mainNode: TreeNode = {
            name: main.name,
            id: main.id,
            frequency: main.frequency,
            level: main.level,
            color: main.color,
            children: [],
          };

          const children = codes.filter((c) => c.parentId === main.id);
          children.forEach((child) => {
            const childNode: TreeNode = {
              name: child.name,
              id: child.id,
              frequency: child.frequency,
              level: child.level,
              color: child.color,
              children: [],
            };

            const subchildren = codes.filter((c) => c.parentId === child.id);
            subchildren.forEach((subchild) => {
              childNode.children?.push({
                name: subchild.name,
                id: subchild.id,
                frequency: subchild.frequency,
                level: subchild.level,
                color: subchild.color,
              });
            });

            if (childNode.children?.length === 0) delete childNode.children;
            mainNode.children?.push(childNode);
          });

          if (mainNode.children?.length === 0) delete mainNode.children;
          root.children?.push(mainNode);
        });
      }

      return root;
    };

    const treeData = buildTree();

    if (!treeData.children || treeData.children.length === 0) return;

    const hierarchy = d3.hierarchy(treeData);
    const treeLayout = d3
      .tree<TreeNode>()
      .size([
        height - margin.top - margin.bottom,
        width - margin.left - margin.right,
      ]);

    const root = treeLayout(hierarchy);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .linkHorizontal<
            d3.HierarchyPointLink<TreeNode>,
            d3.HierarchyPointNode<TreeNode>
          >()
          .x((d) => d.y)
          .y((d) => d.x),
      );

    const node = g
      .selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("cursor", (d) => (d.data.id !== "root" ? "pointer" : "default"));

    node
      .append("circle")
      .attr("r", (d) =>
        d.data.id === "root" ? 6 : Math.sqrt(d.data.frequency + 1) * 3 + 5,
      )
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "hsl(var(--card))")
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dy", "0.35em")
      .attr("x", (d) => (d.children ? -12 : 12))
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .attr("font-size", "11px")
      .attr("fill", "hsl(var(--foreground))")
      .text((d) => (d.data.id === "root" ? "" : d.data.name));

    node
      .filter((d) => d.data.id !== "root" && d.data.frequency > 0)
      .append("text")
      .attr("dy", "-1em")
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "hsl(var(--muted-foreground))")
      .text((d) => d.data.frequency);

    node.on("click", (event, d) => {
      if (
        d.data.id !== "root" &&
        d.data.id !== "unassigned" &&
        d.data.level !== "theme"
      ) {
        setSelectedCode(d.data.id);
      }
    });
  }, [codes, themes, dimensions, setSelectedCode]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={Math.max(dimensions.height, codes.length * 30)}
      />
    </div>
  );
}
