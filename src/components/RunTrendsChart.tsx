// src/components/RunTrendsChart.tsx
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

interface ToolRun {
  id: number;
  runNumber: number;
  runDateTime: string;
  tempFeed?: number;
  tempRear1?: number;
  tempRear2?: number;
  tempMiddle?: number;
  tempFront1?: number;
  tempFront2?: number;
  tempMoldLiveHalf?: number;
  tempMoldDeadHalf?: number;
  pressure1stStage?: number;
  pressure2ndStage?: number;
  pressureBack?: number;
  pressureClamping?: number;
  timeInject?: number;
  time2ndStage?: number;
  timeMoldClose?: number;
  timeMoldOpen?: number;
  timeOverallCycle?: number;
  injectionSpeed?: number;
  packHoldTime?: number;
}

interface RunTrendsChartProps {
  runs: ToolRun[];
}

export default function RunTrendsChart({ runs }: RunTrendsChartProps) {
  const [chartType, setChartType] = useState<"temps" | "pressures" | "times">(
    "temps"
  );

  if (runs.length === 0) {
    return null;
  }

  // Prepare chart data
  const chartData = runs.map((run) => ({
    runNumber: run.runNumber,
    // Temperatures
    Feed: run.tempFeed,
    "Rear 1": run.tempRear1,
    "Rear 2": run.tempRear2,
    Middle: run.tempMiddle,
    "Front 1": run.tempFront1,
    "Front 2": run.tempFront2,
    "Mold Live": run.tempMoldLiveHalf,
    "Mold Dead": run.tempMoldDeadHalf,
    // Pressures
    "1st Stage": run.pressure1stStage,
    "2nd Stage": run.pressure2ndStage,
    Back: run.pressureBack,
    Clamping: run.pressureClamping,
    // Times
    Inject: run.timeInject,
    "2nd Stage Time": run.time2ndStage,
    "Mold Close": run.timeMoldClose,
    "Mold Open": run.timeMoldOpen,
    "Overall Cycle": run.timeOverallCycle,
    "Injection Speed": run.injectionSpeed,
    "Pack/Hold": run.packHoldTime,
  }));

  const tempColors = [
    "#ff6b6b",
    "#ee5a6f",
    "#f06595",
    "#cc5de8",
    "#845ef7",
    "#5c7cfa",
    "#339af0",
    "#22b8cf",
  ];
  const pressureColors = ["#20c997", "#51cf66", "#94d82d", "#ffd43b"];
  const timeColors = [
    "#ff922b",
    "#fd7e14",
    "#fa5252",
    "#e64980",
    "#be4bdb",
    "#7950f2",
    "#4c6ef5",
  ];

  const renderChart = () => {
    switch (chartType) {
      case "temps":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                reversed={true}
                dataKey="runNumber"
                stroke="#0f0"
                label={{
                  value: "Run #",
                  position: "insideBottom",
                  offset: -5,
                  fill: "#0f0",
                }}
              />
              <YAxis
                stroke="#0f0"
                label={{
                  value: "Temperature (°F)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#0f0",
                }}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#0f0"
                label={{
                  value: "Temperature (°F)",
                  angle: 90,
                  position: "insideRight",
                  fill: "#0f0",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  border: "1px solid #0f0",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ color: "#0f0" }} />
              <Line
                type="monotone"
                dataKey="Feed"
                stroke={tempColors[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Rear 1"
                stroke={tempColors[1]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Rear 2"
                stroke={tempColors[2]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Middle"
                stroke={tempColors[3]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Front 1"
                stroke={tempColors[4]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Front 2"
                stroke={tempColors[5]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Mold Live"
                stroke={tempColors[6]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Mold Dead"
                stroke={tempColors[7]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pressures":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="runNumber"
                reversed={true}
                stroke="#0f0"
                label={{
                  value: "Run #",
                  position: "insideBottom",
                  offset: -5,
                  fill: "#0f0",
                }}
              />
              <YAxis
                stroke="#0f0"
                label={{
                  value: "Pressure (PSI)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#0f0",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#0f0"
                label={{
                  value: "Pressure (PSI)",
                  angle: 90,
                  position: "insideRight",
                  fill: "#0f0",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  border: "1px solid #0f0",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ color: "#0f0" }} />
              <Line
                type="monotone"
                dataKey="1st Stage"
                stroke={pressureColors[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="2nd Stage"
                stroke={pressureColors[1]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Back"
                stroke={pressureColors[2]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Clamping"
                stroke={pressureColors[3]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "times":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="runNumber"
                reversed={true}
                stroke="#0f0"
                label={{
                  value: "Run #",
                  position: "insideBottom",
                  offset: -5,
                  fill: "#0f0",
                }}
              />
              <YAxis
                stroke="#0f0"
                label={{
                  value: "Time (seconds)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#0f0",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#0f0"
                label={{
                  value: "Time (seconds)",
                  angle: 90,
                  position: "insideRight",
                  fill: "#0f0",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  border: "1px solid #0f0",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ color: "#0f0" }} />
              <Line
                type="monotone"
                dataKey="Inject"
                stroke={timeColors[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="2nd Stage Time"
                stroke={timeColors[1]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Mold Close"
                stroke={timeColors[2]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Mold Open"
                stroke={timeColors[3]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Overall Cycle"
                stroke={timeColors[4]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Injection Speed"
                stroke={timeColors[5]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Pack/Hold"
                stroke={timeColors[6]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        bgcolor: "#1a1a1a",
        borderRadius: 2,
        border: "1px solid #333",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: "#0f0", fontWeight: "bold" }}>
          Run Trends Visualization
        </Typography>
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={(_, newValue) => newValue && setChartType(newValue)}
          sx={{
            "& .MuiToggleButton-root": {
              color: "#0f0",
              borderColor: "#0f0",
              "&.Mui-selected": {
                backgroundColor: "#0f0",
                color: "#000",
                "&:hover": {
                  backgroundColor: "#0d0",
                },
              },
            },
          }}
        >
          <ToggleButton value="temps">Temperatures</ToggleButton>
          <ToggleButton value="pressures">Pressures</ToggleButton>
          <ToggleButton value="times">Cycle Times</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {renderChart()}
    </Box>
  );
}
