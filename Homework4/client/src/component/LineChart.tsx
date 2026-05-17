import { useRef, useEffect } from "react";
import * as d3 from "d3";

// define types
interface StockDataPoint {
  Date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

interface StockApiResponse {
  name: string;
  date: string[];
  Open: number[];
  High: number[];
  Low: number[];
  Close: number[];
}

interface LineChartProps {
  selectedStock: string | null;
}

interface Metric {
  name: keyof Omit<StockDataPoint, "Date">;  // "Open" | "High" | "Low" | "Close"
  color: string;
}

export default function LineChart({ selectedStock }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedStock || !svgRef.current || !wrapperRef.current) return;

    let ignore = false;

    // 1. get container size
    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;
    const margin = { top: 20, right: 120, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 2. fetch data from FastAPI backend
    fetch(`http://127.0.0.1:8000/stock/${selectedStock}`)
      .then((response) => response.json())
      .then((jsonData: StockApiResponse) => {
        if (ignore) return;

        const data: StockDataPoint[] = jsonData.date.map((dateStr, i) => ({
          Date: new Date(dateStr),
          Open: jsonData.Open[i],
          High: jsonData.High[i],
          Low: jsonData.Low[i],
          Close: jsonData.Close[i],
        }));

        // 3. set svg size & clean old drawing
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // 4. create the drawing group
        const g = svg
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("defs")
          .append("clipPath")
          .attr("id", "clip")
          .append("rect")
          .attr("width", innerWidth)
          .attr("height", innerHeight);

        // 5. set up scales
        const xScale = d3
          .scaleTime()
          .domain(d3.extent(data, (d) => d.Date) as [Date, Date])
          .range([0, innerWidth]);

        const yMax = d3.max(data, (d) => Math.max(d.Open, d.High, d.Low, d.Close)) as number;
        const yMin = d3.min(data, (d) => Math.min(d.Open, d.High, d.Low, d.Close)) as number;

        const yScale = d3
          .scaleLinear()
          .domain([yMin * 0.95, yMax * 1.05])
          .range([innerHeight, 0]);

        // 6. draw axes
        const xAxis = g
          .append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(d3.axisBottom(xScale));

        g.append("g").call(d3.axisLeft(yScale));

        // x axis label
        g.append("text")
          .attr("class", "x-axis-label")
          .attr("text-anchor", "middle")
          .attr("x", innerWidth / 2)
          .attr("y", innerHeight + 35)
          .text("Date")
          .style("font-size", "14px")
          .style("fill", "#666");

        // y axis label
        g.append("text")
          .attr("class", "y-axis-label")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("x", -innerHeight / 2)
          .attr("y", -30)
          .text("Price (USD)")
          .style("font-size", "14px")
          .style("fill", "#666");

        // 7. draw lines
        const metrics: Metric[] = [
          { name: "Open",  color: "steelblue" },
          { name: "High",  color: "green"     },
          { name: "Low",   color: "red"        },
          { name: "Close", color: "orange"     },
        ];

        const lineGroup = g.append("g").attr("clip-path", "url(#clip)");

        const lines: Record<string, d3.Selection<SVGPathElement, StockDataPoint[], null, undefined>> = {};

        metrics.forEach((metric) => {
          const lineGenerator = d3
            .line<StockDataPoint>()
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

        // 8. legend
        const legend = svg
          .append("g")
          .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

        metrics.forEach((metric, i) => {
          const legendRow = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
          legendRow.append("rect").attr("width", 10).attr("height", 10).attr("fill", metric.color);
          legendRow
            .append("text")
            .attr("x", 20)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .text(metric.name);
        });

        // 9. zooming & panning
        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 10])
          .translateExtent([[0, 0], [innerWidth, innerHeight]])
          .extent([[0, 0], [innerWidth, innerHeight]])
          .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
            const newXScale = event.transform.rescaleX(xScale);
            xAxis.call(d3.axisBottom(newXScale));
            metrics.forEach((metric) => {
              const newLineGen = d3
                .line<StockDataPoint>()
                .x((d) => newXScale(d.Date))
                .y((d) => yScale(d[metric.name]));
              lines[metric.name].attr("d", newLineGen);
            });
          });

        d3.select(svgRef.current!).call(zoom);
      })
      .catch((error) => console.error("Error fetching stock data:", error));

    return () => {
      ignore = true;
    };
  }, [selectedStock]);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}