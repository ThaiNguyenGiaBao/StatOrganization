import { Chart, registerables } from "chart.js";
import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const imgDir = path.join(__dirname, "img");

// Check if the img directory exists, and create it if it doesn't
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true }); // recursive option ensures that nested directories are created
}

// Register necessary components for Chart.js
Chart.register(...registerables);

export function drawChart(data) {
  // Get this month
  const currentMonth = new Date().getMonth() + 1;
  const beginThisMonth = "1/" + currentMonth;

  //console.log( data.recentActivity.activeDay)

  // Active days
  createBarChart(
    data.recentActivity.activeDay,
    [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],

    "Active Days from " + beginThisMonth,
    "activeDays.png"
  );

  // Active hours
  createBarChart(
    data.recentActivity.activeHour,
    Array.from({ length: 24 }, (v, i) => i),
    "Active Hours from" + beginThisMonth,
    "activeHoursFromThisMonth.png"
  );

  // Push events
  createBarChart(
    data.recentActivity.pushEvents,
    Array.from(
      { length: data.recentActivity.pushEvents.length },
      (v, i) => i + 1
    ),
    "Push Events ",
    "pushEvents.png",
    800,
    200
  );

  
  // Pull request events
  createBarChart(
    data.recentActivity.pullRequestEvents,
    Array.from(
      { length: data.recentActivity.pullRequestEvents.length },
      (v, i) => i + 1
    ),
    "Pull Request Events",
    "pullRequestEvents.png",
    800,
    200
  );

  // Coding habits
  createLanguagesChart(data);

  // Repository stats - Commit per day
  createBarChart(
    data.repositoryStats.commitPerDay,
    Array.from({ length: 7 }, (v, i) => i),
    "Total Commits per Day",
    "TotalcommitPerDay.png"
  );

  // Repository stats - Commit per hour
  createBarChart(
    data.repositoryStats.commitPerHour,
    Array.from({ length: 24 }, (v, i) => i),
    "Total Commits per Hour",
    "TotalcommitPerHour.png"
  );

  // Commit per Month last year
  createBarChart(
    data.repositoryStats.commitPerMonthLastYear,
    Array.from({ length: 12 }, (v, i) => i + 1),
    "Commits per Month Last Year",
    "commitPerMonthLastYear.png"
  );

  console.log("Charts created successfully.");
}

function createBarChart(
  datas,
  labels,
  title,
  filename,
  width = 600,
  height = 400
) {
  // Create a canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  //console.log(filename, datas);

  var color = datas.map((value) => {
    let max = Math.max(...datas);
    var opacity = value / max;
    return (color = `rgba(54, 162, 235, ${opacity})`);
  });

  // Chart configuration
  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: title,
          data: datas,
          backgroundColor: color,
          fill: false,
          borderRadius: 3,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "white", // Labels color for dark theme
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)", // Tooltip background color for dark theme
          titleColor: "white", // Tooltip title color for dark theme
          bodyColor: "white", // Tooltip body color for dark theme
        },
      },
      interaction: {
        intersect: false,
      },
      scales: {
        y: {
          ticks: {
            color: "white", // Y-axis tick color for dark theme
          },
        },
        x: {
          ticks: {
            color: "white", // X-axis tick color for dark theme
          },
        },
      },
    },
  };

  // Create chart instance
  const chart = new Chart(ctx, config);

  // Save the chart as an image
  const out = fs.createWriteStream(path.join(imgDir, filename));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
}

function createLanguagesChart(data) {
  // Create a canvas
  const canvas = createCanvas(600, 600);
  const ctx = canvas.getContext("2d");

  let languageData = data.repositoryStats.languages.filter(
    (language) => language.percentage > 1
  );
  // Chart configuration
  const config = {
    type: "doughnut",
    data: {
      labels: languageData.map((language) => language.language),
      datasets: [
        {
          data: languageData.map((language) => language.percentage),
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(201, 203, 207, 1)",
          ],
          backgroundColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(201, 203, 207, 1)",
          ],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "white", // Labels color for dark theme
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)", // Tooltip background color for dark theme
          titleColor: "white", // Tooltip title color for dark theme
          bodyColor: "white", // Tooltip body color for dark theme
        },
      },
    },
  };

  // Create chart instance
  const chart = new Chart(ctx, config);

  // Save the chart as an image
  const out = fs.createWriteStream(path.join(imgDir, "languages.png"));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
}
