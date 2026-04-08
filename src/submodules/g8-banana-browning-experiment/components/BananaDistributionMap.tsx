import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import styles from '../styles/BananaDistributionMap.module.css';

interface LocationData {
  id: string;
  name: string;
  coords: [number, number];
  size: number;
  color: string;
}

const LOCATIONS: LocationData[] = [
  { id: 'mx', name: '墨西哥', coords: [-102.5, 23.6], size: 1, color: '#10B981' },
  { id: 'gt', name: '危地马拉', coords: [-90.2, 15.7], size: 0.9, color: '#3B82F6' },
  { id: 'cr', name: '哥斯达黎加', coords: [-83.7, 9.7], size: 0.9, color: '#EF4444' },
  { id: 'pa', name: '巴拿马', coords: [-80.7, 8.5], size: 0.9, color: '#3B82F6' },
  { id: 'co', name: '哥伦比亚', coords: [-74.2, 4.5], size: 1, color: '#FBBF24' },
  { id: 'ec', name: '厄瓜多尔', coords: [-78.1, -1.8], size: 0.9, color: '#FBBF24' },
  { id: 'pe', name: '秘鲁', coords: [-75.0, -9.1], size: 1, color: '#EF4444' },
  { id: 'br', name: '巴西', coords: [-51.9, -14.2], size: 1.1, color: '#10B981' },
  { id: 'cm', name: '喀麦隆', coords: [12.3, 3.8], size: 1, color: '#FBBF24' },
  { id: 'et', name: '埃塞俄比亚', coords: [40.4, 9.1], size: 1, color: '#10B981' },
  { id: 'rw', name: '卢旺达', coords: [24.0, 1.5], size: 0.9, color: '#FBBF24' },
  { id: 'bi', name: '布隆迪', coords: [35.0, -6.0], size: 0.9, color: '#EF4444' },
  { id: 'cn', name: '中国', coords: [104.1, 35.8], size: 1.5, color: '#EF4444' },
  { id: 'in', name: '印度', coords: [78.9, 20.5], size: 1.1, color: '#F97316' },
  { id: 'th', name: '泰国', coords: [100.9, 15.8], size: 1, color: '#3B82F6' },
  { id: 'ph', name: '菲律宾', coords: [121.7, 12.8], size: 1, color: '#3B82F6' },
  { id: 'my', name: '马来西亚', coords: [101.9, 4.2], size: 1, color: '#3B82F6' },
];

const LATITUDES: ReadonlyArray<{ lat: number; label: string }> = [
  { lat: 30, label: '30°N' },
  { lat: 0, label: '0°' },
  { lat: -30, label: '30°S' },
];

const WORLD_ATLAS_URL = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

const BananaDistributionMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const projection = d3.geoMercator().scale(140).translate([500, 165]);
    const pathGenerator = d3.geoPath().projection(projection);
    const baseRadius = 11;

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('viewBox', '0 0 1000 310')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%');
    svgRef.current = svg.node();

    const defs = svg.append('defs');

    defs
      .append('pattern')
      .attr('id', 'dot-pattern')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 4)
      .attr('height', 4)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 1.2)
      .attr('fill', '#5A82D7')
      .attr('opacity', 0.8);

    defs
      .append('filter')
      .attr('id', 'drop-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%')
      .append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('stdDeviation', 3)
      .attr('flood-color', '#000')
      .attr('flood-opacity', 0.8);

    defs
      .append('clipPath')
      .attr('id', 'circle-clip')
      .attr('clipPathUnits', 'objectBoundingBox')
      .append('circle')
      .attr('cx', 0.5)
      .attr('cy', 0.5)
      .attr('r', 0.5);

    defs.append('style').text(`@keyframes pulse {
        0%   { r: 12;           opacity: 0.8; stroke-width: 2; }
        100% { r: 25;           opacity: 0;   stroke-width: 0; }
      }`);

    const mapLayer = svg.append('g');
    const gridLayer = svg.append('g');
    const markerLayer = svg.append('g');

    let cancelled = false;

    d3.json<Topology>(WORLD_ATLAS_URL)
      .then(world => {
        if (cancelled || !world) return;

        const landCollection = world.objects.land as GeometryCollection;
        const land = feature(world, landCollection);

        setLoading(false);

        mapLayer
          .append('path')
          .datum(land)
          .attr('d', pathGenerator as unknown as (d: unknown) => string)
          .attr('fill', 'url(#dot-pattern)')
          .attr('stroke', 'rgba(90, 130, 215, 0.2)')
          .attr('stroke-width', 0.5)
          .style('opacity', 0)
          .transition()
          .duration(1500)
          .style('opacity', 1);

        svg
          .append('text')
          .attr('x', 40)
          .attr('y', 28)
          .style('fill', '#6b93d6')
          .style('font-size', '24px')
          .style('font-weight', 'bold')
          .style('letter-spacing', '3px')
          .style('opacity', 0)
          .text('全球香蕉种植分布')
          .transition()
          .delay(1000)
          .duration(1000)
          .style('opacity', 1);

        LATITUDES.forEach(d => {
          const leftPoint = projection([-180, d.lat]);
          const rightPoint = projection([180, d.lat]);
          if (!leftPoint || !rightPoint) return;

          gridLayer
            .append('line')
            .attr('x1', leftPoint[0])
            .attr('y1', leftPoint[1])
            .attr('x2', rightPoint[0])
            .attr('y2', rightPoint[1])
            .attr('stroke', d.lat === 0 ? 'rgba(107, 147, 214, 0.6)' : 'rgba(107, 147, 214, 0.4)')
            .attr('stroke-width', d.lat === 0 ? 1.5 : 1)
            .attr('stroke-dasharray', '6, 4')
            .style('opacity', 0)
            .transition()
            .delay(800)
            .duration(1000)
            .style('opacity', 1);

          gridLayer
            .append('text')
            .attr('x', rightPoint[0] - 10)
            .attr('y', rightPoint[1] - 5)
            .attr('fill', 'rgba(107, 147, 214, 0.7)')
            .attr('font-size', '12px')
            .attr('text-anchor', 'end')
            .text(d.label)
            .style('opacity', 0)
            .transition()
            .delay(800)
            .duration(1000)
            .style('opacity', 1);
        });

        const topPoint = projection([0, 85]);
        const bottomPoint = projection([0, -85]);
        if (topPoint && bottomPoint) {
          gridLayer
            .append('line')
            .attr('x1', topPoint[0])
            .attr('y1', topPoint[1])
            .attr('x2', bottomPoint[0])
            .attr('y2', bottomPoint[1])
            .attr('stroke', 'rgba(107, 147, 214, 0.6)')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '6, 4')
            .style('opacity', 0)
            .transition()
            .delay(800)
            .duration(1000)
            .style('opacity', 1);

          gridLayer
            .append('text')
            .attr('x', topPoint[0] + 5)
            .attr('y', topPoint[1] + 15)
            .attr('fill', 'rgba(107, 147, 214, 0.7)')
            .attr('font-size', '12px')
            .text('0°')
            .style('opacity', 0)
            .transition()
            .delay(800)
            .duration(1000)
            .style('opacity', 1);
        }

        const tooltip = d3.select(tooltipRef.current);

        const markers = markerLayer
          .selectAll<SVGGElement, LocationData>('.marker-group')
          .data(LOCATIONS)
          .enter()
          .append('g')
          .attr('class', 'marker-group')
          .attr('transform', d => {
            const pos = projection(d.coords);
            return pos ? `translate(${pos[0]}, ${pos[1]}) scale(0)` : 'translate(0,0) scale(0)';
          })
          .style('cursor', 'pointer');

        markers
          .append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 12)
          .style('fill', 'none')
          .style('stroke', d => d.color)
          .style('stroke-width', 2)
          .style('animation', `pulse 2s infinite ease-out`)
          .style('animation-delay', (_d, i) => `${i * 0.1}s`);

        markers
          .append('circle')
          .attr('r', d => baseRadius * d.size)
          .attr('fill', '#ffffff')
          .attr('filter', 'url(#drop-shadow)');

        markers
          .append('image')
          .attr('href', d => `https://flagcdn.com/w40/${d.id}.png`)
          .attr('x', d => -baseRadius * d.size)
          .attr('y', d => -baseRadius * d.size)
          .attr('width', d => baseRadius * 2 * d.size)
          .attr('height', d => baseRadius * 2 * d.size)
          .attr('clip-path', 'url(#circle-clip)')
          .attr('preserveAspectRatio', 'xMidYMid slice');

        markers
          .transition()
          .delay((_d, i) => 1000 + i * 100)
          .duration(800)
          .ease(d3.easeElastic)
          .attr('transform', d => {
            const pos = projection(d.coords);
            return pos ? `translate(${pos[0]}, ${pos[1]}) scale(1)` : 'translate(0,0) scale(1)';
          });

        markers
          .on('mouseover', function (event: MouseEvent, d: LocationData) {
            const pos = projection(d.coords);
            if (!pos) return;
            d3.select(this)
              .transition()
              .duration(200)
              .ease(d3.easeCubicOut)
              .attr('transform', `translate(${pos[0]}, ${pos[1]}) scale(1.4)`);

            tooltip
              .style('opacity', 1)
              .html(`📍 ${d.name}`)
              .style('left', `${event.offsetX}px`)
              .style('top', `${event.offsetY}px`);
          })
          .on('mousemove', function (event: MouseEvent) {
            tooltip.style('left', `${event.offsetX}px`).style('top', `${event.offsetY}px`);
          })
          .on('mouseout', function (_event: MouseEvent, d: LocationData) {
            const pos = projection(d.coords);
            if (!pos) return;
            d3.select(this)
              .transition()
              .duration(300)
              .ease(d3.easeCubicOut)
              .attr('transform', `translate(${pos[0]}, ${pos[1]}) scale(1)`);

            tooltip.style('opacity', 0);
          });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error('加载地图数据失败:', message);
        setError('加载地图失败，请检查网络');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (svgRef.current && containerRef.current?.contains(svgRef.current)) {
        d3.select(svgRef.current).remove();
      }
      svgRef.current = null;
    };
  }, []);

  return (
    <div className={styles.mapContainer}>
      {loading && !error && <div className={styles.loader}>加载地图数据中...</div>}
      {error && <div className={styles.errorState}>{error}</div>}
      <div ref={tooltipRef} className={styles.tooltip} />
      <div ref={containerRef} className={styles.mapSvgContainer} />
      <div className={styles.descriptionPanel}>
        <p>
          全球香蕉主要产自赤道附近（南北纬30°内），分布在亚洲（如马来西亚、菲律宾、中国）、美洲（如巴拿马、巴西）和非洲（如卢旺达、布隆迪）。
        </p>
        <p>
          不同品种的香蕉在皮厚度和酶活性等特征上也有所不同。例如，南美洲卡文迪什香蕉皮较厚（0.3-0.5毫米），菲律宾香蕉皮较薄（0.2-0.3毫米）；而海南芝麻蕉则表现为多酚氧化酶活性更高，保存时间更短。
        </p>
      </div>
    </div>
  );
};

export default BananaDistributionMap;
