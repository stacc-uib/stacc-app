import React, { useEffect, useRef, useState } from "react";
import type { IncomeData } from "../lib/getIncomeData";

interface DataPoint {
    label: string;
    source1: number;
    source2: number;
    source3: number;
}

function generateDataPoints(incomeData: IncomeData, splitBy: string) {
    let result: DataPoint[] = [];

    if (incomeData.events.length === 0) {
        return result;
    }

    let currPoint = {
        label: incomeData.events[0].date ?? "",
        source1: 0,
        source2: 0,
        source3: 0
    };

    if (splitBy === "fund") {
        for (const event of incomeData.events) {
            if (currPoint.label !== event.date) {
                result.push(currPoint);
                currPoint = {
                    label: event.date,
                    source1: 0,
                    source2: 0,
                    source3: 0
                };
            }

            if (event.shareClass.includes("Norden")) {
                currPoint.source1 += event.amount;
            } else if (event.shareClass.includes("Global")) {
                currPoint.source2 += event.amount;
            } else if (event.shareClass.includes("Kreditt")) {
                currPoint.source3 += event.amount;
            } else {
                throw new Error("NEINEI");
            }
        }
        result.push(currPoint);
    } else {
        throw new Error("NEI");
    }
    return result;
}

function getCumulativeDataPoints(data: DataPoint[]) {
    return data.map((point) => ({
        label: point.label,
        source1: point.source1,
        source2: point.source1 + point.source2,
        source3: point.source1 + point.source2 + point.source3,
    }));
}

function getLabels(splitBy: string) {
    if (splitBy === "fund") {
        return ["Norden", "Global", "Kreditt"];
    } else {
        throw new Error("NEI");
    }
}


function getColors(splitBy: string) {
    const labels = getLabels(splitBy);
    return [
        { fill: "#8884d8", stroke: "#8884d8", label: labels[0]}, 
        { fill: "#82ca9d", stroke: "#82ca9d", label: labels[1]},
        { fill: "#ffc658", stroke: "#ffc658", label: labels[2]},
    ];

} 

const IncomeGraph = ({ incomeData }: { incomeData: IncomeData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const splitBy = "fund";
    const data = generateDataPoints(incomeData, splitBy);
    const cumulativeData = getCumulativeDataPoints(data);

    // Colors for each source
    const colors = getColors(splitBy);

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
        canvas.height = 400; // Fixed height or make responsive too

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Padding and dimensions
        const padding = 60;
        const graphWidth = canvas.width - 2 * padding;
        const graphHeight = canvas.height - 2 * padding;

        // Find the maximum cumulative value for scaling
        const maxValue = Math.max(
            ...cumulativeData.map((point) => point.source3)
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
                    value.toLocaleString(),
                    padding - 10,
                    canvas.height - padding - (i * graphHeight) / yAxisSteps
                );
            }
        };

        // Draw the stacked area
        const drawStackedArea = () => {
            if (cumulativeData.length === 0) return;

            // Draw source3 (top layer)
            ctx.beginPath();
            ctx.moveTo(
                padding,
                canvas.height - padding - (cumulativeData[0].source3 * yScale)
            );
            cumulativeData.forEach((point, i) => {
                ctx.lineTo(
                    padding + i * xScale,
                    canvas.height - padding - (point.source3 * yScale)
                );
            });
            ctx.lineTo(
                padding + (data.length - 1) * xScale,
                canvas.height - padding
            );
            for (let i = data.length - 1; i >= 0; i--) {
                ctx.lineTo(
                    padding + i * xScale,
                    canvas.height - padding - (cumulativeData[i].source2 * yScale)
                );
            }
            ctx.closePath();
            ctx.fillStyle = colors[2].fill;
            ctx.fill();
            ctx.strokeStyle = colors[2].stroke;
            ctx.stroke();

            // Draw source2 (middle layer)
            ctx.beginPath();
            ctx.moveTo(
                padding,
                canvas.height - padding - (cumulativeData[0].source2 * yScale)
            );
            cumulativeData.forEach((point, i) => {
                ctx.lineTo(
                    padding + i * xScale,
                    canvas.height - padding - (point.source2 * yScale)
                );
            });
            ctx.lineTo(
                padding + (data.length - 1) * xScale,
                canvas.height - padding - (cumulativeData[data.length - 1].source1 * yScale)
            );
            for (let i = data.length - 1; i >= 0; i--) {
                ctx.lineTo(
                    padding + i * xScale,
                    canvas.height - padding - (cumulativeData[i].source1 * yScale)
                );
            }
            ctx.closePath();
            ctx.fillStyle = colors[1].fill;
            ctx.fill();
            ctx.strokeStyle = colors[1].stroke;
            ctx.stroke();

            // Draw source1 (bottom layer)
            ctx.beginPath();
            ctx.moveTo(padding, canvas.height - padding);
            cumulativeData.forEach((point, i) => {
                ctx.lineTo(
                    padding + i * xScale,
                    canvas.height - padding - (point.source1 * yScale)
                );
            });
            ctx.lineTo(
                padding + (data.length - 1) * xScale,
                canvas.height - padding
            );
            ctx.closePath();
            ctx.fillStyle = colors[0].fill;
            ctx.fill();
            ctx.strokeStyle = colors[0].stroke;
            ctx.stroke();
        };

        // Draw legend
        const drawLegend = () => {
            const legendX = canvas.width - padding - 120;
            const legendYStart = padding + 10;
            const legendItemHeight = 20;
            const legendItemSpacing = 10;

            // Draw background
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(
                legendX - 10,
                legendYStart - 10,
                140,
                (legendItemHeight + legendItemSpacing) * colors.length + 10
            );

            // Draw border
            ctx.strokeStyle = "#ccc";
            ctx.lineWidth = 1;
            ctx.strokeRect(
                legendX - 10,
                legendYStart - 10,
                140,
                (legendItemHeight + legendItemSpacing) * colors.length + 10
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
    }, [incomeData, containerWidth]);

    return (
        <div className="data-table-card feature-section__surface" ref={containerRef}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '400px' }}
            />
        </div>
    );
};

export default IncomeGraph;
