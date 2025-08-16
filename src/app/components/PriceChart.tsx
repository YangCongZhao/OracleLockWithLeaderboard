"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ChartDataLabels);

export default function PriceChart({ coin }: { coin: string }) {
    const [labels, setLabels] = useState<string[]>([]);
    const [prices, setPrices] = useState<number[]>([]);

    useEffect(() => {
        const id = coin.toLowerCase() === "eth" ? "ETHUSDT" : "BTCUSDT";
        fetch(`https://api.binance.com/api/v3/klines?symbol=${id}&interval=1m&limit=60`)
            .then(res => res.json())
            .then(data => {
                const labels = data.map((d: any) => {
                    const date = new Date(d[0]);
                    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
                });
                const prices = data.map((d: any) => Number(parseFloat(d[4]).toFixed(2))); // 收盘价
                setLabels(labels);
                setPrices(prices);
            });
    }, [coin]);

    const chartData = {
        labels,
        datasets: [
            {
                label: `${coin} 实时价格`,
                data: prices,
                borderColor: "#ec4899",
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: "#ec4899",
                tension: 0.4,
                fill: true,
                backgroundColor: (ctx: any) => {
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
                    gradient.addColorStop(0, "rgba(236,72,153,0.25)");
                    gradient.addColorStop(1, "rgba(236,72,153,0)");
                    return gradient;
                },
            },
        ],
    };

    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            datalabels: {
                color: "#fff",
                anchor: "end",
                align: "top",
                formatter: (value: number) => `$${value}`,
                font: { weight: "bold", size: 12 },
                textStrokeColor: "#000",
                textStrokeWidth: 3,
            },
        },
        scales: {
            x: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.1)" } },
            y: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.1)" } },
        },
    };

    return (
        <div className="w-full h-[50vh] p-4 rounded-lg bg-gradient-to-b from-black via-purple-950 to-black shadow-lg">
            <Line data={chartData} options={options} />
        </div>
    );
}
