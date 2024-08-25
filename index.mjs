// const core = require('@actions/core');
import core from '@actions/core';
import { getData } from './getData.mjs';
import { drawChart } from './drawChart.mjs';

async function run() {
  try {
    const orgName = core.getInput('org-name');
    console.log(`Input received: ${orgName}`);
    const token = core.getInput('token');
    // Get data
    const data = await getData(orgName, token);
    console.log(data);
    // Draw chart
    await drawChart(data);

    // Set the output
    core.setOutput('myOutput', "Hello World");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
