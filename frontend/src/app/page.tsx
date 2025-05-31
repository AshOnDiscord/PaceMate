"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

export default function Home() {
  const [sectionEnd, setSectionEnd] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);

  const [activeWebsite, setActiveWebsite] = useState<string | null>(null);

  const [productivityHistory, setProductivityHistory] = useState<
    [number, number, number][]
  >(new Array(60 * 5).fill([0, 0, 0])); // last 5 minutes of data

  const [siteProductivity, setSiteProductivity] = useState<
    Record<string, number[]>
  >({});

  const [phase, setPhase] = useState("Work");
  const [paused, setPaused] = useState(false);

  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const WS = new WebSocket("ws://localhost:3001/ws");
    WS.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.phase === "Work") {
        setSectionEnd(data.workEnd);
      } else {
        setSectionEnd(data.breakEnd);
      }
      setPhase(data.phase);
      setPaused(data.paused);
      setActiveWebsite(data.activeWebsite);
      setProductivityHistory((p) => [
        ...p.slice(p.length - 60 * 5),
        data.score,
      ]);
      setSiteProductivity((p) => {
        const newSiteProductivity = { ...p };
        newSiteProductivity[data.activeWebsite] = [
          ...(newSiteProductivity[data.activeWebsite] || []),
          data.score[0] + data.score[1] * 0.5,
        ];
        return newSiteProductivity;
      });
      console.log("Received data:", { ...data, now: new Date().getTime() });
    };
    setWs(WS);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const diff = sectionEnd - now.getTime();

      console.log(diff, sectionEnd, now.getTime());

      if (diff <= 0) {
        setSecondsLeft(0);
        setMinutesLeft(0);
        setHoursLeft(0);
        return;
      }

      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor(diff / (1000 * 60 * 60));

      setSecondsLeft(seconds);
      setMinutesLeft(minutes);
      setHoursLeft(hours);
      console.log(`Time left: ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [sectionEnd]);

  const lineConfig = {
    producitvity: {
      label: "productivity",
      color: "#2563eb",
    },
  } satisfies ChartConfig;

  const lineData = productivityHistory.map((item, index) => ({
    time: new Date().getTime() - (productivityHistory.length - index) * 1000,
    productivity: item[0] + item[1] * 0.5,
  }));

  const activeConfig = {
    usage: {
      label: "Usage",
      color: "#2563eb",
    },
    productivity: {
      label: "Productivity",
      color: "#16a34a",
    },
  } satisfies ChartConfig;

  const activeData = Object.entries(siteProductivity)
    .map(([site, scores]) => ({
      site,
      usage: scores.length,
      productivity:
        scores.reduce((acc, score) => acc + score, 0) / scores.length,
    }))
    .sort((a, b) => b.usage - a.usage)
    .map((item) => ({
      // we have to make the productivity scaled to usage and usage stack on top
      site: item.site,
      productivity: item.productivity * item.usage,
      usage: item.usage * (1 - item.productivity),
    }));

  useEffect(() => {
    console.log(activeData);
  }, [activeData]);

  return (
    <div
      className={`grid place-content-center gap-8 py-16 min-h-screen transition transition-500 ${
        phase === "Work" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Card dark={phase === "Work"}>
        <CardContent className="flex flex-col items-center gap-0">
          <h1 className="text-2xl leading-none">Time Left</h1>
          <p className="font-bold text-8xl leading-[.9] mt-2">
            {hoursLeft ? hoursLeft.toString().padStart(2, "0") + ":" : ""}
            {minutesLeft.toString().padStart(2, "0")}:
            {secondsLeft.toString().padStart(2, "0")}
          </p>
          <h2
            className={`font-light leading-none ${
              phase === "Work" ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            {phase}
          </h2>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button
            dark={phase === "Work"}
            variant="default"
            className="w-full"
            onClick={() => {
              if (paused) {
                ws?.send("resume");
              } else {
                ws?.send("pause");
              }
            }}
          >
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button
            className="w-full"
            variant="outline"
            dark={phase === "Work"}
            onClick={() => {
              ws?.send("reset");
            }}
          >
            Reset
          </Button>
        </CardFooter>
      </Card>

      <Card dark={phase === "Work"}>
        <CardHeader>
          <CardTitle>Productivity</CardTitle>
          <CardDescription>
            Your productivity over the last 5 minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={lineConfig}
            className="min-h-[200px] w-full pr-8"
          >
            <LineChart accessibilityLayer data={lineData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  return new Date(value).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                }}
              />
              <YAxis
                domain={[0, 1]} // 👈 fixed min and max values
                tickCount={6}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Line
                dataKey={"productivity"}
                type="basis"
                stroke={`oklch(54.1% 0.281 293.009)`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card dark={phase === "Work"} className="overflow-hidden w-full">
        <CardHeader>
          <CardTitle>Site Usage</CardTitle>
          <CardDescription>
            How much time you spent on each site and your productivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-scroll">
            <ChartContainer
              config={activeConfig}
              className="h-[400px] pr-8"
              style={{ minWidth: `${activeData.length * 150}px` }}
            >
              <BarChart accessibilityLayer data={activeData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="site"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickCount={6}
                  tickFormatter={(value) => {
                    // value is how many seconds you spent on the site
                    return (value / 60).toFixed(2) + " min";
                  }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="productivity"
                  stackId="a"
                  fill="oklch(54.1% 0.281 293.009)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="usage"
                  stackId="a"
                  fill="oklch(70.2% 0.183 293.541)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
