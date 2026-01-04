import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useQDAStore } from '@/store/qdaStore';
import type { Code, Theme } from '@/types/qda';

interface ForceGraphProps {
  codes: Code[];
  themes: Theme[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'theme' | 'code';
  level?: string;
  frequency: number;
  color: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export function ForceGraph({ codes, themes }: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { setSelectedCode, setSelectedTheme } = useQDAStore();
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
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || codes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Build nodes and links
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add theme nodes
    themes.forEach((theme) => {
      nodes.push({
        id: theme.id,
        name: theme.name,
        type: 'theme',
        frequency: theme.codeIds.length * 10,
        color: theme.color,
      });
    });

    // Add code nodes
    codes.forEach((code) => {
      nodes.push({
        id: code.id,
        name: code.name,
        type: 'code',
        level: code.level,
        frequency: code.frequency || 1,
        color: code.color,
      });

      // Link to parent
      if (code.parentId) {
        links.push({
          source: code.parentId,
          target: code.id,
        });
      }
    });

    // Link codes to themes
    themes.forEach((theme) => {
      theme.codeIds.forEach((codeId) => {
        links.push({
          source: theme.id,
          target: codeId,
        });
      });
    });

    // Create simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: GraphNode) => Math.sqrt(d.frequency) * 3 + 15));

    // Add zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    // Draw links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5);

    // Draw nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Add circles
    node
      .append('circle')
      .attr('r', (d) => Math.sqrt(d.frequency) * 3 + 8)
      .attr('fill', (d) => d.color)
      .attr('stroke', (d) => d.type === 'theme' ? 'hsl(var(--foreground))' : 'none')
      .attr('stroke-width', (d) => d.type === 'theme' ? 2 : 0)
      .attr('opacity', 0.85);

    // Add labels
    node
      .append('text')
      .text((d) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => Math.sqrt(d.frequency) * 3 + 20)
      .attr('font-size', '10px')
      .attr('fill', 'hsl(var(--foreground))')
      .attr('opacity', 0.8);

    // Click handler
    node.on('click', (event, d) => {
      event.stopPropagation();
      if (d.type === 'theme') {
        setSelectedTheme(d.id);
      } else {
        setSelectedCode(d.id);
      }
    });

    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [codes, themes, dimensions, setSelectedCode, setSelectedTheme]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  );
}
