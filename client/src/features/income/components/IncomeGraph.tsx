import React, { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";
import type { IncomeData } from "../lib/getIncomeData";
import type { Investor } from "../types/investor";

interface DataPoint {
    label: string;
    sources: number[];
    length: number;
}

function generateDataPoints(incomeData: IncomeData, investors: Investor[], splitBy: string): DataPoint[] {
    let result: DataPoint[] = [];

    if (incomeData.events.length === 0) {
        return result;
    }

    const labels = getLabels(splitBy);
    const n = labels.length;

    let currPoint = {
        label: incomeData.events[0].date ?? "",
        sources: Array(n).fill(0),
        length: n
    };

    for (const event of incomeData.events) {
        if (currPoint.label !== event.date) {
            result.push(currPoint);
            currPoint = {
                label: event.date,
                sources: Array(n).fill(0),
                length: n
            };
        }

        for (let i = 0; i < n; i++) {
            if (splitBy === "fund") {
                if (event.shareClass.includes(labels[i])) {
                    currPoint.sources[i] += event.amount;
                    break;
                }
            } else if (splitBy === "class") {
                if (event.shareClass.includes(labels[i])) {
                    currPoint.sources[i] += event.amount;
                    break;
                }
            } else if (splitBy === "segment") {
                const customer = investors.find(x => x.customerId === event.customerId)!;
                if (customer.customerType === labels[i]) {
                    currPoint.sources[i] += event.amount;
                    break;
                }
            } else if (splitBy === "category") {
                const customer = investors.find(x => x.customerId === event.customerId)!;
                if (customer.category === labels[i]) {
                    currPoint.sources[i] += event.amount;
                    break;
                }
            } else {
                throw new Error("unexpected splitBy");
            }
        }
    }
    result.push(currPoint);

    return result;
}

function getCumulativeDataPoints(data: DataPoint[]): DataPoint[] {
    return data.map((point) => {
        let sum = 0;
        return {
            label: point.label,
            sources: point.sources.map(n => sum += n),
            length: point.length
        };
    });
}

function getLabels(splitBy: string): string[] {
    if (splitBy === "fund") {
        return ["Norden", "Global", "Kreditt"];
    } else if (splitBy === "class") {
        return ["Klasse B", "Klasse C"];
    } else if (splitBy === "segment") {
        return ["Aksjeselskap", "Pensjonskasse", "Ansatt", "Fond", "Fondsforvalter", "Forsikringsselskap", "Privatperson", "Stiftelse"];
    } else if (splitBy === "category") {
        return ["Professional", "Retail"];
    } else {
        throw new Error("NEI");
    }
}

function getColors(splitBy: string) {
    const colors = [
        "#FFD449",  // Yellow
        "#32DE8A",  // Green
        "#F5A623",  // Orange-Yellow
        "#B8E986",  // Light Green
        "#4A90E2",  // Blue
        "#7B68EE",  // Purple
        "#50E3C2",  // Teal
        "#fb771c",  // Orange
        "#FF6B6B",   // Coral
    ];

    const labels = getLabels(splitBy);

    return [...Array(labels.length).keys()].map((i) => ({
        fill: colors[i],
        stroke: colors[i],
        label: labels[i]
    }));
}

const SplitByButtons = ({splitBy, setSplitBy}: {splitBy: string, setSplitBy: any}) => {

  const buttons = [
    { label: "Fond", value: "fund" as const },
    { label: "Fondsklasse", value: "class" as const },
    { label: "Kundesegment", value: "segment" as const },
    { label: "Kundekategori", value: "category" as const },
  ];

  return (
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {buttons.map((button) => (
              <button
                  className={`btn btn-light ${splitBy === button.value ? " active" : ""}`}
                  key={button.value}
                  onClick={() => setSplitBy(button.value)}
              >
                {button.label}
              </button>
      ))}
      </div>
  );
};

const IncomeGraph = ({ incomeData, investors }: { incomeData: IncomeData, investors: Investor[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);


    const [splitBy, setSplitBy] = useState<"fund" | "class" | "segment" | "category">("fund");
    const data = generateDataPoints(incomeData, investors, splitBy);
    const cumulativeData = getCumulativeDataPoints(data);
    const colors = getColors(splitBy);
    const numCategories = colors.length;

    // Update container width on mount and resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (cumulativeData.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas dimensions to match container
        canvas.width = containerWidth;
        canvas.height = 400;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Padding and dimensions
        const padding = 60;
        const graphWidth = canvas.width - 2 * padding - 100;
        const graphHeight = canvas.height - 2 * padding;

        // Find the maximum cumulative value for scaling
        const maxValue = Math.max(
            ...cumulativeData.map((point) => point.sources[point.sources.length - 1])
        );

        // Round maxValue to the nearest "nice" number for Y-axis labels
        const roundedMaxValue = Math.ceil(maxValue / 1000) * 1000;
        const yAxisSteps = 5;
        const yAxisStepValue = roundedMaxValue / yAxisSteps;

        // Scale factors
        const xScale = data.length > 1 ? graphWidth / (data.length - 1) : 1;
        const yScale = graphHeight / roundedMaxValue;

        // Limit X-axis labels to max 8, evenly spaced
        const xLabelCount = Math.min(data.length, 8);
        const xLabelStep = Math.ceil(data.length / xLabelCount);

        // Draw axes
        const drawAxes = () => {
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;

            // X-axis
            ctx.beginPath();
            ctx.moveTo(padding, canvas.height - padding);
            ctx.lineTo(canvas.width - padding, canvas.height - padding);
            ctx.stroke();

            // Y-axis
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, canvas.height - padding);
            ctx.stroke();

            // X-axis labels (limited to max 8)
            for (let i = 0; i < data.length; i += xLabelStep) {
                ctx.fillStyle = "#000";
                ctx.textAlign = "center";
                ctx.font = "12px Arial";
                ctx.fillText(
                    data[i].label,
                    padding + i * xScale,
                    canvas.height - padding + 20
                );
            }

            // Y-axis labels (rounded)
            for (let i = 0; i <= yAxisSteps; i++) {
                const value = i * yAxisStepValue;
                ctx.fillStyle = "#000";
                ctx.textAlign = "right";
                ctx.font = "12px Arial";
                ctx.fillText(
                    "kr " + value.toLocaleString(),
                    padding - 10,
                    canvas.height - padding - (i * graphHeight) / yAxisSteps
                );
            }
        };

        // Draw the stacked area for any number of categories
        const drawStackedArea = () => {
            if (cumulativeData.length === 0) return;

            // Draw each layer from bottom to top
            for (let layer = 0; layer < numCategories; layer++) {
                ctx.beginPath();

                // Start at the bottom of the first point
                if (layer === 0) {
                    ctx.moveTo(padding, canvas.height - padding);
                } else {
                    ctx.moveTo(
                        padding,
                        canvas.height - padding - (cumulativeData[0].sources[layer] * yScale)
                    );
                }

                // Draw the top line of this layer
                cumulativeData.forEach((point, i) => {
                    ctx.lineTo(
                        padding + i * xScale,
                        canvas.height - padding - (point.sources[layer] * yScale)
                    );
                });

                // Draw the right side
                ctx.lineTo(
                    padding + (data.length - 1) * xScale,
                    canvas.height - padding - (cumulativeData[data.length - 1].sources[layer - 1] * yScale)
                );

                // Draw the bottom line (backwards)
                for (let i = data.length - 1; i >= 0; i--) {
                    const prevLayer = layer > 0 ? layer - 1 : -1;
                    const yPos = prevLayer >= 0
                        ? cumulativeData[i].sources[prevLayer] * yScale
                        : 0;
                    ctx.lineTo(
                        padding + i * xScale,
                        canvas.height - padding - yPos
                    );
                }

                ctx.closePath();
                ctx.fillStyle = colors[layer].fill;
                ctx.fill();
                ctx.strokeStyle = colors[layer].stroke;
                ctx.stroke();
            }
        };

        // Draw legend
        const drawLegend = () => {
            const legendX = canvas.width - padding - 80;
            const legendYStart = padding + 10;
            const legendItemHeight = 20;
            const legendItemSpacing = 10;

            // Calculate legend dimensions
            const legendWidth = 140;
            const legendHeight = (legendItemHeight + legendItemSpacing) * numCategories + 10;

            // Draw background
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(
                legendX - 10,
                legendYStart - 10,
                legendWidth,
                legendHeight
            );

            // Draw border
            ctx.strokeStyle = "#ccc";
            ctx.lineWidth = 1;
            ctx.strokeRect(
                legendX - 10,
                legendYStart - 10,
                legendWidth,
                legendHeight
            );

            colors.forEach((color, i) => {
                // Draw color box
                ctx.fillStyle = color.fill;
                ctx.fillRect(
                    legendX,
                    legendYStart + i * (legendItemHeight + legendItemSpacing),
                    15,
                    10
                );

                // Draw label
                ctx.fillStyle = "#000";
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.font = "12px Arial";
                ctx.fillText(
                    color.label,
                    legendX + 20,
                    legendYStart + i * (legendItemHeight + legendItemSpacing) + 5
                );
            });
        };

        // Draw everything
        drawAxes();
        drawStackedArea();
        drawLegend();
    }, [incomeData, containerWidth, numCategories]);

    return (
        <div className="data-table-card feature-section__surface" ref={containerRef}>
            <SplitByButtons splitBy={splitBy} setSplitBy={setSplitBy as any} />
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '400px' }}
            />
        </div>
    );
};

export default IncomeGraph;
