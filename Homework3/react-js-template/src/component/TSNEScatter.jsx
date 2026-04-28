import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function TSNEScatter({ selectedStock }) {
  const svgRef = useRef();
  const wrapperRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      const width = wrapperRef.current.clientWidth;
      const height = wrapperRef.current.clientHeight;

      if (width === 0 || height === 0) return;

      const margin = { top: 30, right: 160, bottom: 40, left: 40 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      svg.selectAll("*").remove();

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      g.append("defs").append("clipPath")
        .attr("id", "scatter-clip")
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight);

      // 读取数据
      d3.csv("/data/tsne.csv").then((data) => {
        
        // 🚨 核心修复点在这里 🚨
        // 我们强制把 CSV 里的 't-SNE_Dim1' 和 't-SNE_Dim2' 抓取出来，存给 X 和 Y
        const formattedData = data.map(d => ({
          Ticker: d.Ticker,
          Sector: d.Sector,
          X: +d['t-SNE_Dim1'], // 对应你 csv 的真实列名
          Y: +d['t-SNE_Dim2']  // 对应你 csv 的真实列名
        })).filter(d => !isNaN(d.X) && !isNaN(d.Y));

        // 如果解析后数据是空的，在控制台报错提示
        if (formattedData.length === 0) {
            console.error("No valid data found! Check if the CSV path is correct and accessible.");
            return;
        }

        const xScale = d3.scaleLinear()
          .domain(d3.extent(formattedData, d => d.X)).nice()
          .range([10, innerWidth - 10]);

        const yScale = d3.scaleLinear()
          .domain(d3.extent(formattedData, d => d.Y)).nice()
          .range([innerHeight - 10, 10]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const xAxisG = g.append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(d3.axisBottom(xScale));

        const yAxisG = g.append("g")
          .call(d3.axisLeft(yScale));

        const scatterGroup = g.append("g").attr("clip-path", "url(#scatter-clip)");

        const circles = scatterGroup.selectAll("circle")
          .data(formattedData)
          .enter()
          .append("circle")
          .attr("cx", d => xScale(d.X))
          .attr("cy", d => yScale(d.Y))
          .attr("r", d => d.Ticker === selectedStock ? 8 : 5)
          .attr("fill", d => colorScale(d.Sector))
          .attr("stroke", d => d.Ticker === selectedStock ? "black" : "#fff")
          .attr("stroke-width", d => d.Ticker === selectedStock ? 3 : 1)
          .attr("opacity", 0.8)
          .style("cursor", "pointer");

        const labelsData = selectedStock ? formattedData.filter(d => d.Ticker === selectedStock) : [];
        const labels = scatterGroup.selectAll(".stock-label")
          .data(labelsData)
          .enter()
          .append("text")
          .attr("class", "stock-label")
          .attr("x", d => xScale(d.X) + 12)
          .attr("y", d => yScale(d.Y) + 4)
          .text(d => d.Ticker)
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .style("fill", "#333");

        // 图例
        const sectors = Array.from(new Set(formattedData.map((d) => d.Sector)));
        const legend = svg.append("g")
          .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

        sectors.forEach((sector, i) => {
          const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);
          
          legendRow.append("circle")
            .attr("cx", 5)
            .attr("cy", 5)
            .attr("r", 5)
            .attr("fill", colorScale(sector));
            
          legendRow.append("text")
            .attr("x", 15)
            .attr("y", 10)
            .style("font-size", "12px")
            .text(sector);
        });

        // 缩放
        const zoom = d3.zoom()
          .scaleExtent([0.5, 10])
          .on("zoom", (event) => {
            const newXScale = event.transform.rescaleX(xScale);
            const newYScale = event.transform.rescaleY(yScale);

            xAxisG.call(d3.axisBottom(newXScale));
            yAxisG.call(d3.axisLeft(newYScale));

            circles
              .attr("cx", d => newXScale(d.X))
              .attr("cy", d => newYScale(d.Y));
            
            labels
              .attr("x", d => newXScale(d.X) + 12)
              .attr("y", d => newYScale(d.Y) + 4);
          });

        svg.call(zoom);
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [selectedStock]);

  return (
    <div ref={wrapperRef} className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
}