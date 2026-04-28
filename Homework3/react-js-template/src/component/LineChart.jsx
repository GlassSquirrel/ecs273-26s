import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function LineChart({ selectedStock }) {
  const svgRef = useRef();
  const wrapperRef = useRef();

  useEffect(() => {
    if (!selectedStock) return;

    // 1. get container size
    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;
    const margin = { top: 20, right: 120, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // clean the window, in case of overlap
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 创建主视图组
    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 2. 定义 Clip Path (限制缩放时线条不超出坐标轴边界)
    g.append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    // 3. 读取数据
    // 注意路径：如果数据在 public/data/stockdata/ 中，使用绝对路径 "/"
    d3.csv(`/data/stockdata/${selectedStock}.csv`).then((data) => {
      // 解析数据
      const parseDate = d3.timeParse("%Y-%m-%d"); // 根据你的CSV日期格式调整
      data.forEach((d) => {
        d.Date = parseDate(d.Date) || new Date(d.Date); // 兼容处理
        d.Open = +d.Open;
        d.High = +d.High;
        d.Low = +d.Low;
        d.Close = +d.Close;
      });

      // 4. 设置比例尺 (Scales)
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.Date))
        .range([0, innerWidth]);

      const yMax = d3.max(data, (d) => Math.max(d.Open, d.High, d.Low, d.Close));
      const yMin = d3.min(data, (d) => Math.min(d.Open, d.High, d.Low, d.Close));

      const yScale = d3
        .scaleLinear()
        .domain([yMin * 0.95, yMax * 1.05]) // 上下留出 5% 的空白
        .range([innerHeight, 0]);

      // 5. 绘制坐标轴 (Axes)
      const xAxis = g
        .append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));

      const yAxis = g.append("g").call(d3.axisLeft(yScale));

      // add x label
      g.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 35)
        .text("Date")
        .style("font-size", "14px")
        .style("fill", "#666");

      // add y label
      g.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -30)
        .text("Price (USD)")
        .style("font-size", "14px")
        .style("fill", "#666");

      // 6. 准备绘制线条的工具 (Line Generators)
      const metrics = [
        { name: "Open", color: "steelblue" },
        { name: "High", color: "green" },
        { name: "Low", color: "red" },
        { name: "Close", color: "orange" },
      ];

      // 创建一个容纳线条的组，并应用 clip-path
      const lineGroup = g.append("g").attr("clip-path", "url(#clip)");

      const lines = {};
      metrics.forEach((metric) => {
        const lineGenerator = d3
          .line()
          .x((d) => xScale(d.Date))
          .y((d) => yScale(d[metric.name]));

        lines[metric.name] = lineGroup
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", metric.color)
          .attr("stroke-width", 1.5)
          .attr("d", lineGenerator);
      });

      // 7. 图例 (Legend)
      const legend = svg
        .append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

      metrics.forEach((metric, i) => {
        const legendRow = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
        legendRow
          .append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", metric.color);
        legendRow
          .append("text")
          .attr("x", 20)
          .attr("y", 10)
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .text(metric.name);
      });

      // 8. 缩放和平移功能 (Zooming & Panning)
      const zoom = d3
        .zoom()
        .scaleExtent([1, 10]) // 限制放大倍数 (1x 到 10x)
        .translateExtent([[0, 0], [innerWidth, innerHeight]]) // 限制平移范围
        .extent([[0, 0], [innerWidth, innerHeight]])
        .on("zoom", (event) => {
          // 只缩放 X 轴
          const newXScale = event.transform.rescaleX(xScale);
          // 更新 X 轴显示
          xAxis.call(d3.axisBottom(newXScale));
          // 更新所有线条的 X 坐标
          metrics.forEach((metric) => {
            const newLineGen = d3
              .line()
              .x((d) => newXScale(d.Date))
              .y((d) => yScale(d[metric.name]));
            lines[metric.name].attr("d", newLineGen);
          });
        });

      // 将 zoom 绑定到背景上，以便鼠标在图表任何位置都可以触发
      svg.call(zoom);

    });
  }, [selectedStock]); // 依赖数组：当 selectedStock 变化时，重新执行绘制

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}