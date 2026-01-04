import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useQDAStore } from '@/store/qdaStore';
import { calculateCoOccurrences } from '@/utils/analysisHelpers';
import type { Code, CodeExcerpt } from '@/types/qda';

interface CoOccurrenceGraphProps {
  codes: Code[];
  excerpts: CodeExcerpt[];
}

interface CoOccurrenceNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  frequency: number;
  color: string;
}

interface CoOccurrenceLink extends d3.SimulationLinkDatum<CoOccurrenceNode> {
  source: string | CoOccurrenceNode;
  target: string | CoOccurrenceNode;
  weight: number;
}

export function CoOccurrenceGraph({ codes, excerpts }: CoOccurrenceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { setSelectedCode } = useQDAStore();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const coOccurrences = useMemo(() => calculateCoOccurrences(codes, excerpts), [codes, excerpts]);

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

    // Get codes that have co-occurrences
    const codesWithCooccurrence = new Set<string>();
    coOccurrences.forEach((co) => {
      codesWithCooccurrence.add(co.code1Id);
      codesWithCooccurrence.add(co.code2Id);
    });

    // Build nodes
    const nodes: CoOccurrenceNode[] = codes
      .filter((c) => codesWithCooccurrence.has(c.id))
      .map((code) => ({
        id: code.id,
        name: code.name,
        frequency: code.frequency,
        color: code.color,
      }));

    // Build links
    const maxWeight = Math.max(...coOccurrences.map((c) => c.weight), 1);
    const links: CoOccurrenceLink[] = coOccurrences.map((co) => ({
      source: co.code1Id,
      target: co.code2Id,
      weight: co.weight,
    }));

    if (nodes.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'hsl(var(--muted-foreground))')
        .text('No co-occurrences found. Code multiple excerpts with different codes.');
      return;
    }

    // Create simulation
    const simulation = d3
      .forceSimulation<CoOccurrenceNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<CoOccurrenceNode, CoOccurrenceLink>(links)
          .id((d) => d.id)
          .distance(100)
          .strength((d) => d.weight / maxWeight)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Add zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    // Link width scale
    const linkWidthScale = d3.scaleLinear().domain([1, maxWeight]).range([1, 8]);

    // Draw links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'hsl(var(--accent))')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', (d) => linkWidthScale(d.weight));

    // Link labels
    const linkLabel = g
      .append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .text((d) => d.weight);

    // Draw nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, CoOccurrenceNode>()
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

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => Math.sqrt(d.frequency + 1) * 4 + 10)
      .attr('fill', (d) => d.color)
      .attr('stroke', 'hsl(var(--card))')
      .attr('stroke-width', 2)
      .attr('opacity', 0.85);

    // Node labels
    node
      .append('text')
      .text((d) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => Math.sqrt(d.frequency + 1) * 4 + 22)
      .attr('font-size', '10px')
      .attr('fill', 'hsl(var(--foreground))');

    // Click handler
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedCode(d.id);
    });

    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [codes, excerpts, coOccurrences, dimensions, setSelectedCode]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  );
}
