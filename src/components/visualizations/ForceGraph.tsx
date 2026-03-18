import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useQDAStore } from "@/store/qdaStore";
import type { Code, Theme } from "@/types/qda";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  RotateCcw,
  Link as LinkIcon,
  Trash2,
  GripVertical,
  Search,
} from "lucide-react";
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
  level?: string;
}

interface ManualLink {
  source: string;
  target: string;
}

export function ForceGraph({ codes, themes }: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { setSelectedCode, setSelectedTheme } = useQDAStore();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isAutoLayout, setIsAutoLayout] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(
    null,
  );

  // Manual mode state
  const [manualNodes, setManualNodes] = useState<ManualNode[]>([]);
  const [manualLinks, setManualLinks] = useState<ManualLink[]>([]);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = isAutoLayout
          ? containerRef.current.clientWidth
          : containerRef.current.clientWidth - 320; // Account for palette
        setDimensions({
          width,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [isAutoLayout]);

  // Auto layout rendering
  useEffect(() => {
    if (!svgRef.current || codes.length === 0 || !isAutoLayout) return;

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
            d.fx = null;
            d.fy = null;
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
      } else {
        setSelectedCode(d.id);
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
  }, [
    codes,
    themes,
    dimensions,
    setSelectedCode,
    setSelectedTheme,
    isAutoLayout,
    selectedNodeId,
  ]);

  // Manual layout rendering
  useEffect(() => {
    if (!isAutoLayout && svgRef.current) {
      renderManualLayout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoLayout, manualNodes, manualLinks, linkSourceId]);

  const renderManualLayout = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .filter((event) => {
        // Disable zoom/pan entirely - nodes have their own drag behavior
        return false;
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Draw links
    const linksGroup = g.append("g");
    const linkSelection = linksGroup
      .selectAll("line")
      .data(manualLinks)
      .join("line")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("x1", (d) => manualNodes.find((n) => n.id === d.source)?.x || 0)
      .attr("y1", (d) => manualNodes.find((n) => n.id === d.source)?.y || 0)
      .attr("x2", (d) => manualNodes.find((n) => n.id === d.target)?.x || 0)
      .attr("y2", (d) => manualNodes.find((n) => n.id === d.target)?.y || 0);

    // Draw nodes
    const nodeGroups = g
      .append("g")
      .selectAll("g")
      .data(manualNodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer");

    // Drag behavior for repositioning with click detection
    let hasMoved = false;
    const dragBehavior = d3
      .drag<SVGGElement, ManualNode>()
      .on("start", function (event, d) {
        hasMoved = false;
      })
      .on("drag", function (event, d) {
        hasMoved = true;

        // Update node position in DOM
        d3.select(this).attr("transform", `translate(${event.x}, ${event.y})`);

        // Update connected links in real-time
        linkSelection
          .filter((l: ManualLink) => l.source === d.id)
          .attr("x1", event.x)
          .attr("y1", event.y);

        linkSelection
          .filter((l: ManualLink) => l.target === d.id)
          .attr("x2", event.x)
          .attr("y2", event.y);
      })
      .on("end", function (event, d) {
        if (hasMoved) {
          // Update state with final position
          const newNodes = manualNodes.map((n) =>
            n.id === d.id ? { ...n, x: event.x, y: event.y } : n,
          );
          setManualNodes(newNodes);
        } else {
          // Was a click, not a drag - handle linking logic
          if (linkSourceId && linkSourceId !== "select") {
            // Creating a link - second click
            if (
              linkSourceId !== d.id &&
              !manualLinks.some(
                (l) =>
                  (l.source === linkSourceId && l.target === d.id) ||
                  (l.source === d.id && l.target === linkSourceId),
              )
            ) {
              setManualLinks([
                ...manualLinks,
                { source: linkSourceId, target: d.id },
              ]);
            }
            setLinkSourceId(null);
          } else if (linkSourceId === "select") {
            // First click - selecting source node
            setLinkSourceId(d.id);
          } else {
            // Select node for viewing
            setSelectedNodeId(d.id);
            if (d.type === "code") {
              setSelectedCode(d.id);
            } else {
              setSelectedTheme(d.id);
            }
          }
        }
      });

    nodeGroups.call(dragBehavior);

    nodeGroups
      .append("circle")
      .attr("r", (d) => Math.sqrt(d.frequency) * 3 + 8)
      .attr("fill", (d) => d.color)
      .attr("stroke", (d) => {
        if (d.id === selectedNodeId) return "hsl(var(--accent))";
        if (linkSourceId && linkSourceId !== "select" && d.id === linkSourceId)
          return "hsl(var(--primary))";
        return d.type === "theme" ? "hsl(var(--foreground))" : "none";
      })
      .attr("stroke-width", (d) => {
        if (d.id === selectedNodeId) return 3;
        if (linkSourceId && linkSourceId !== "select" && d.id === linkSourceId)
          return 3;
        return d.type === "theme" ? 2 : 0;
      })
      .attr("opacity", 0.85);

    nodeGroups
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => Math.sqrt(d.frequency) * 3 + 20)
      .attr("font-size", "10px")
      .attr("fill", "hsl(var(--foreground))")
      .attr("opacity", 0.8);

    // Delete button on hover
    const deleteBtn = nodeGroups
      .append("g")
      .attr("class", "delete-btn")
      .attr("opacity", 0)
      .attr("cursor", "pointer")
      .attr(
        "transform",
        (d) =>
          `translate(${Math.sqrt(d.frequency) * 3 + 8}, ${-Math.sqrt(d.frequency) * 3 - 8})`,
      );

    deleteBtn
      .append("circle")
      .attr("r", 8)
      .attr("fill", "hsl(var(--destructive))");

    deleteBtn
      .append("text")
      .text("×")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("font-size", "12px")
      .attr("fill", "white");

    nodeGroups
      .on("mouseenter", function () {
        d3.select(this).select(".delete-btn").attr("opacity", 1);
      })
      .on("mouseleave", function () {
        d3.select(this).select(".delete-btn").attr("opacity", 0);
      });

    deleteBtn.on("click", (event, d) => {
      event.stopPropagation();
      setManualNodes(manualNodes.filter((n) => n.id !== d.id));
      setManualLinks(
        manualLinks.filter((l) => l.source !== d.id && l.target !== d.id),
      );
    });
  };

  const handleAddToCanvas = (item: Code | Theme, isTheme: boolean) => {
    // Check if already on canvas
    if (manualNodes.some((n) => n.id === item.id)) return;

    // Calculate grid position
    const cols = 4;
    const spacing = 120;
    const offsetX = 100;
    const offsetY = 100;
    const index = manualNodes.length;
    const row = Math.floor(index / cols);
    const col = index % cols;

    const newNode: ManualNode = {
      id: item.id,
      name: item.name,
      type: isTheme ? "theme" : "code",
      color: item.color,
      x: offsetX + col * spacing,
      y: offsetY + row * spacing,
      frequency: isTheme
        ? (item as Theme).codeIds.length * 10
        : (item as Code).frequency || 1,
      level: isTheme ? undefined : (item as Code).level,
    };

    setManualNodes([...manualNodes, newNode]);
  };

  const handleReset = () => {
    if (isAutoLayout) {
      // In auto mode, restart the simulation
      if (simulationRef.current) {
        simulationRef.current.alpha(1).restart();
      }
    } else {
      // In manual mode, clear the canvas
      setManualNodes([]);
      setManualLinks([]);
      setLinkSourceId(null);
      setSelectedNodeId(null);
    }
  };

  const filteredCodes = codes.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredThemes = themes.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div ref={containerRef} className="w-full h-full relative flex gap-0">
      {/* Palette - Only in Manual Mode */}
      {!isAutoLayout && (
        <div className="w-80 flex-shrink-0 bg-card border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground mb-3">
              Element Palette
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Themes */}
              {filteredThemes.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Themes ({filteredThemes.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredThemes.map((theme) => (
                      <div
                        key={theme.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                          manualNodes.some((n) => n.id === theme.id) &&
                            "opacity-50",
                        )}
                        onClick={() => handleAddToCanvas(theme, true)}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: theme.color }}
                        />
                        <span className="text-sm truncate flex-1">
                          {theme.name}
                        </span>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Codes */}
              {filteredCodes.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Codes ({filteredCodes.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredCodes.map((code) => (
                      <div
                        key={code.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                          manualNodes.some((n) => n.id === code.id) &&
                            "opacity-50",
                        )}
                        onClick={() => handleAddToCanvas(code, false)}
                      >
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: code.color }}
                        />
                        <span className="text-sm truncate flex-1">
                          {code.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({code.frequency})
                        </span>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Manual Mode Instructions */}
          <div className="p-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Click</strong> items to add
              <br />
              <strong>Drag</strong> to move
              <br />
              <strong>Click link icon</strong>, then 2 nodes
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-card border border-border rounded-lg shadow-lg">
        <div className="flex items-center gap-2 p-2">
          <div className="flex items-center gap-2 px-2">
            <Switch
              id="auto-layout"
              checked={isAutoLayout}
              onCheckedChange={setIsAutoLayout}
            />
            <Label
              htmlFor="auto-layout"
              className="text-xs cursor-pointer whitespace-nowrap"
            >
              {isAutoLayout ? "Auto" : "Manual"}
            </Label>
          </div>
          <div className="h-4 w-px bg-border" />
          {!isAutoLayout && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  linkSourceId &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                onClick={() => setLinkSourceId(linkSourceId ? null : "select")}
                title={linkSourceId ? "Cancel linking" : "Link two nodes"}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <div className="h-4 w-px bg-border" />
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleReset}
            title={isAutoLayout ? "Restart simulation" : "Clear manual canvas"}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 relative">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="bg-muted/5"
        />

        {!isAutoLayout && manualNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">Manual Graph Builder</p>
              <p className="text-sm">
                Click items from the palette to add them to the canvas
              </p>
            </div>
          </div>
        )}

        {/* Linking Mode Indicator */}
        {linkSourceId && linkSourceId !== "select" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-none z-10">
            <LinkIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              Click another node to create a link
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
