import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useQDAStore } from "@/store/qdaStore";
import type { Code, Theme } from "@/types/qda";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RotateCcw, X, Plus, Link as LinkIcon, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForceGraphProps {
  codes: Code[];
  themes: Theme[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: "theme" | "code";
  level?: string;
  frequency: number;
  color: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface ManualNode {
  id: string;
  name: string;
  type: "theme" | "code";
  color: string;
  x: number;
  y: number;
  frequency: number;
}

interface ManualLink {
  source: string;
  target: string;
}

export function ForceGraph({ codes, themes }: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { setSelectedCode, setSelectedTheme, excerpts, documents } = useQDAStore();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isAutoLayout, setIsAutoLayout] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showExcerpts, setShowExcerpts] = useState(false);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  
  // Manual mode state
  const [manualNodes, setManualNodes] = useState<ManualNode[]>([]);
  const [manualLinks, setManualLinks] = useState<ManualLink[]>([]);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    themes.forEach((theme) => {
      nodes.push({
        id: theme.id,
        name: theme.name,
        type: "theme",
        frequency: theme.codeIds.length * 10,
        color: theme.color,
      });
    });

    const codesInThemes = new Set(themes.flatMap((t) => t.codeIds));
    const parentCodeIds = new Set(
      codes.filter((c) => c.parentId).map((c) => c.parentId),
    );

    codes.forEach((code) => {
      const shouldInclude =
        codesInThemes.has(code.id) ||
        parentCodeIds.has(code.id) ||
        !code.parentId;

      if (shouldInclude) {
        nodes.push({
          id: code.id,
          name: code.name,
          type: "code",
          level: code.level,
          frequency: code.frequency || 1,
          color: code.color,
        });
      }
    });

    codes.forEach((code) => {
      if (
        code.parentId &&
        nodes.some((n) => n.id === code.id) &&
        nodes.some((n) => n.id === code.parentId)
      ) {
        links.push({
          source: code.parentId,
          target: code.id,
        });
      }
    });

    themes.forEach((theme) => {
      theme.codeIds.forEach((codeId) => {
        if (nodes.some((n) => n.id === codeId)) {
          links.push({
            source: theme.id,
            target: codeId,
          });
        }
      });
    });

    // Restore saved positions if in manual mode
    if (!isAutoLayout && nodePositions.size > 0) {
      nodes.forEach((node) => {
        const savedPos = nodePositions.get(node.id);
        if (savedPos) {
          node.x = savedPos.x;
          node.y = savedPos.y;
          node.fx = savedPos.x;
          node.fy = savedPos.y;
        }
      });
    }

    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(80),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d: GraphNode) => Math.sqrt(d.frequency) * 3 + 15),
      );

    simulationRef.current = simulation;

    // Stop simulation immediately if in manual mode
    if (!isAutoLayout) {
      simulation.alpha(0).stop();
    }

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg.append("g");

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    const node = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            
            // In manual mode, save position permanently
            if (!isAutoLayout) {
              const newPositions = new Map(nodePositions);
              newPositions.set(d.id, { x: d.fx!, y: d.fy! });
              setNodePositions(newPositions);
              // Keep node fixed in manual mode
            } else {
              // In auto mode, release after drag
              d.fx = null;
              d.fy = null;
            }
          }),
      );

    node
      .append("circle")
      .attr("r", (d) => Math.sqrt(d.frequency) * 3 + 8)
      .attr("fill", (d) => d.color)
      .attr("stroke", (d) => {
        if (d.id === selectedNodeId) return "hsl(var(--accent))";
        return d.type === "theme" ? "hsl(var(--foreground))" : "none";
      })
      .attr("stroke-width", (d) => {
        if (d.id === selectedNodeId) return 3;
        return d.type === "theme" ? 2 : 0;
      })
      .attr("opacity", 0.85);

    node
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => Math.sqrt(d.frequency) * 3 + 20)
      .attr("font-size", "10px")
      .attr("fill", "hsl(var(--foreground))")
      .attr("opacity", 0.8);

    node.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedNodeId(d.id);
      if (d.type === "theme") {
        setSelectedTheme(d.id);
        setShowExcerpts(false);
      } else {
        setSelectedCode(d.id);
        setShowExcerpts(true);
      }
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [codes, themes, dimensions, setSelectedCode, setSelectedTheme, isAutoLayout, nodePositions, selectedNodeId]);

  const handleResetLayout = () => {
    setNodePositions(new Map());
    setIsAutoLayout(true);
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  const selectedCode = codes.find((c) => c.id === selectedNodeId);
  const codeExcerpts = selectedCode
    ? excerpts.filter((e) => e.codeIds.includes(selectedCode.id))
    : [];

  return (
    <div ref={containerRef} className="w-full h-full relative flex gap-4">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-card border border-border rounded-lg p-3 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="auto-layout"
            checked={isAutoLayout}
            onCheckedChange={(checked) => {
              setIsAutoLayout(checked);
              if (checked && simulationRef.current) {
                // Release all fixed positions
                simulationRef.current.nodes().forEach((node: any) => {
                  node.fx = null;
                  node.fy = null;
                });
                simulationRef.current.alpha(1).restart();
              } else if (simulationRef.current) {
                // Fix all current positions
                const positions = new Map<string, { x: number; y: number }>();
                simulationRef.current.nodes().forEach((node: any) => {
                  if (node.x !== undefined && node.y !== undefined) {
                    positions.set(node.id, { x: node.x, y: node.y });
                    node.fx = node.x;
                    node.fy = node.y;
                  }
                });
                setNodePositions(positions);
                simulationRef.current.alpha(0).stop();
              }
            }}
          />
          <Label htmlFor="auto-layout" className="text-sm cursor-pointer">
            {isAutoLayout ? "Auto Layout" : "Manual Layout"}
          </Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetLayout}
          className="w-full gap-2"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Layout
        </Button>
      </div>

      {/* Graph */}
      <div className={cn("flex-1", showExcerpts && "pr-80")}>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
      </div>

      {/* Excerpts Panel */}
      {showExcerpts && selectedCode && (
        <div className="absolute top-0 right-0 w-80 h-full bg-card border-l border-border shadow-lg flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {selectedCode.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {codeExcerpts.length} excerpt{codeExcerpts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => {
                setShowExcerpts(false);
                setSelectedNodeId(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {codeExcerpts.length > 0 ? (
                codeExcerpts.map((excerpt) => {
                  const doc = documents.find((d) => d.id === excerpt.documentId);
                  return (
                    <div
                      key={excerpt.id}
                      className="p-3 bg-muted/30 rounded-lg border border-border space-y-2"
                    >
                      <p className="text-xs text-muted-foreground">
                        {doc?.title || "Unknown document"}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        "{excerpt.text}"
                      </p>
                      {excerpt.memo && (
                        <p className="text-xs text-muted-foreground italic">
                          Memo: {excerpt.memo}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No excerpts for this code
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
