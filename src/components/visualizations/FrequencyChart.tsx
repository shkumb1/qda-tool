import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useQDAStore } from '@/store/qdaStore';
import type { Code } from '@/types/qda';

interface FrequencyChartProps {
  codes: Code[];
}

export function FrequencyChart({ codes }: FrequencyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { setSelectedCode } = useQDAStore();
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
    const margin = { top: 30, right: 30, bottom: 100, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const sortedCodes = [...codes].sort((a, b) => b.frequency - a.frequency).slice(0, 20);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(sortedCodes.map((d) => d.id))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(sortedCodes, (d) => d.frequency) || 1])
      .nice()
      .range([innerHeight, 0]);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-dasharray', '2,2');

    g.select('.grid').select('.domain').remove();

    // Bars
    g.selectAll('.bar')
      .data(sortedCodes)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.id)!)
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', (d) => d.color)
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedCode(d.id);
      })
      .on('mouseenter', function () {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
      })
      .transition()
      .duration(500)
      .delay((_, i) => i * 30)
      .attr('y', (d) => yScale(d.frequency))
      .attr('height', (d) => innerHeight - yScale(d.frequency));

    // Frequency labels on bars
    g.selectAll('.bar-label')
      .data(sortedCodes)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => xScale(d.id)! + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.frequency) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', 'hsl(var(--foreground))')
      .attr('opacity', 0)
      .text((d) => d.frequency)
      .transition()
      .duration(500)
      .delay((_, i) => i * 30 + 200)
      .attr('opacity', 1);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(() => ''))
      .selectAll('text')
      .remove();

    // Custom x-axis labels
    g.selectAll('.x-label')
      .data(sortedCodes)
      .join('text')
      .attr('class', 'x-label')
      .attr('x', (d) => xScale(d.id)! + xScale.bandwidth() / 2)
      .attr('y', innerHeight + 15)
      .attr('text-anchor', 'end')
      .attr('transform', (d) => `rotate(-45, ${xScale(d.id)! + xScale.bandwidth() / 2}, ${innerHeight + 15})`)
      .attr('font-size', '10px')
      .attr('fill', 'hsl(var(--foreground))')
      .text((d) => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name);

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .attr('font-size', '10px');

    g.select('.domain').attr('stroke', 'hsl(var(--border))');
    g.selectAll('.tick line').attr('stroke', 'hsl(var(--border))');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .text('Frequency (excerpts)');

  }, [codes, dimensions, setSelectedCode]);

  return (
    <div ref={containerRef} className="w-full h-full p-4">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  );
}
