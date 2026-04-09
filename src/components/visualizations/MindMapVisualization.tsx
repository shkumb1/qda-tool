import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { MindMapNode } from "@/services/aiService";

interface MindMapVisualizationProps {
  data: MindMapNode;
  onNodeClick?: (node: MindMapNode) => void;
}

export function MindMapVisualization({
  data,
  onNodeClick,
}: MindMapVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create tree layout - use more available space
    const tree = d3.tree<MindMapNode>().size([height - 80, width - 100]);

    const root = d3.hierarchy(data);
    const treeData = tree(root);

    // Draw links
    g.selectAll(".link")
      .data(treeData.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .linkHorizontal<
            d3.HierarchyLink<MindMapNode>,
            d3.HierarchyPointNode<MindMapNode>
          >()
          .x((d) => d.y + 50)
          .y((d) => d.x + 40),
      );

    // Draw nodes
    const nodes = g
      .selectAll(".node")
      .data(treeData.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y + 50},${d.x + 40})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onNodeClick) onNodeClick(d.data);
      });

    // Node circles with colors based on type
    nodes
      .append("circle")
      .attr("r", (d) => {
        if (d.data.type === "root") return 16;
        if (d.data.type === "theme") return 12;
        if (d.data.type === "subtheme") return 10;
        return 8;
      })
      .attr("fill", (d) => {
        if (d.data.type === "root") return "hsl(var(--primary))";
        if (d.data.type === "theme") return "hsl(217 91% 60%)";
        if (d.data.type === "subtheme") return "hsl(142 76% 55%)";
        return "hsl(var(--muted-foreground))";
      })
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2);

    // Node labels
    nodes
      .append("text")
      .attr("dy", 4)
      .attr("x", (d) => (d.children ? -20 : 20))
      .style("text-anchor", (d) => (d.children ? "end" : "start"))
      .style("font-size", (d) => {
        if (d.data.type === "root") return "16px";
        if (d.data.type === "theme") return "14px";
        return "12px";
      })
      .style("font-weight", (d) =>
        d.data.type === "root" || d.data.type === "theme" ? "600" : "normal",
      )
      .style("fill", "hsl(var(--foreground))")
      .text((d) => d.data.name);

    // Node descriptions on hover
    nodes.append("title").text((d) => d.data.description || d.data.name);

    // Center the view with better initial zoom
    const bounds = g.node()?.getBBox();
    if (bounds) {
      // Use less aggressive scaling to show content larger
      const scaleX = (width * 0.85) / bounds.width;
      const scaleY = (height * 0.85) / bounds.height;
      const scale = Math.min(scaleX, scaleY, 1.2); // Cap at 1.2x for readability

      const translate: [number, number] = [
        width / 2 - (bounds.x + bounds.width / 2) * scale,
        height / 2 - (bounds.y + bounds.height / 2) * scale,
      ];

      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale),
      );
    }
  }, [data, onNodeClick]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} width="100%" height="100%" className="bg-muted/5" />
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        💡 Scroll to zoom • Drag to pan • Click nodes for details
      </div>
    </div>
  );
}
