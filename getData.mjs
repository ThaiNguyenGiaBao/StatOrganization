import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import fs from "fs";


async function getData(orgName, token) {
  dotenv.config();
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  //const orgName = "TickLabVN";

  const data = {
    name: "",
    founded: "",
    description: "",
    avarta: "",
    activeMembers: "",
    publicRepositories: "",
    programmingLanguages: [],
    followers: "",
    contributors: "",
    recentAdditions: "",
    stargazersEvolution: {
      total: "",
      newPerDay: "",
    },
    codingHabits: {
      activeHours: "",
      recentlyUsedLanguages: "",
    },
    topRepositories: [],
    repositoryStats: {
      totalStars: "",
      totalForks: "",
      totalOpenIssues: "",
      totalClosedIssues: "",
    },
    growthTrends: "",
    issueResolutionTime: "",
    recentActivity: {
      pushEvents: [],
      issueEvents: [],
      pullRequestEvents: [],
      codingHabits: {
        morning: 29,
        afternoon: 91,
        evening: 1,
        night: 29,
      },
    },
    highActivityPeriods: "",
    topEngagement: "",
    contact: "",
    githubUrl: "",
    socialMedia: {
      twitter: "",
      linkedin: "",
      facebook: "",
    },
  };
  const { data: orgData } = await octokit.orgs.get({ org: orgName });
  const { data: members } = await octokit.orgs.listMembers({ org: orgName });
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org: orgName,
  });

  data.avarta = orgData.avatar_url;
  data.githubUrl = orgData.html_url;
  data.socialMedia.twitter = orgData.twitter_username;
  data.blogUrl = orgData.blog;
  data.contact = orgData.email;

  async function getOrganizationDetails() {
    // Get organization details

    const foundedYear = new Date(orgData.created_at).getFullYear();
    const publicRepos = orgData.public_repos;

    // Get the number of members (requires admin access to the organization)
    const activeMembers = members.length;
    //console.log(members);

    // Get programming languages and frameworks used across repositories
    let languages = new Set();
    let frameworks = new Set(["Django", "React", "Kubernetes"]); // Example frameworks to check for

    for (const repo of repos) {
      const { data: repoLanguages } = await octokit.repos.listLanguages({
        owner: orgName,
        repo: repo.name,
      });

      for (const lang in repoLanguages) {
        languages.add(lang);
      }
    }

    // Convert sets to arrays for display
    languages = Array.from(languages);

    data.name = orgData.name;
    data.founded = foundedYear;
    data.activeMembers = activeMembers;
    data.publicRepositories = publicRepos;
    data.programmingLanguages = languages;
    data.frameworks = frameworks;
    data.description = orgData.description;
    console.log("Completed fetching organization details");
  }

  async function getCommunityStats() {
    // Stargazers evolution in year
    const stars = new Array(12).fill(0);
    let totalStargazers = 0;

    for (const repo of repos) {
      console.log(repo.name, repo.stargazers_count, repo.created_at);
    }

    console.log(stars);
  }

  async function getRepoStats() {
    repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    // Top repositories

    const topRepo = repos.slice(0, 3);
    data.topRepositories = [];
    for (let repo of topRepo) {
      data.topRepositories.push({
        name: repo.name,
        description: repo.description,
        license: repo.license,
        stars: repo.stargazers_count,
        forks: repo.forks,
        openIssues: repo.open_issues,
        mergedPullRequests: repo.merged_pull_requests,
      });
    }

    //Repo stats
    data.repositoryStats.totalStars = 0;
    data.repositoryStats.totalForks = 0;
    data.repositoryStats.totalOpenIssues = 0;
    data.repositoryStats.totalClosedIssues = 0;

    for (let repo of repos) {
      data.repositoryStats.totalStars += repo.stargazers_count;
      data.repositoryStats.totalForks += repo.forks;
      data.repositoryStats.totalOpenIssues += repo.open_issues;
      data.repositoryStats.totalClosedIssues +=
        repo.open_issues - repo.open_issues_count;
    }

    let languagesByte = {};
    var totalByte = 0;

    for (const repo of repos) {
      const response = await octokit.repos.listLanguages({
        owner: orgName,
        repo: repo.name,
      });
      const languagesArray = Object.entries(response.data);

      languagesArray.forEach(([language, byte]) => {
        if (languagesByte[language] === undefined) {
          languagesByte[language] = 0;
        }
        languagesByte[language] += byte;
        totalByte += byte;
      });
    }

    let languages = Object.entries(languagesByte).map(([language, byte]) => ({
      language,
      percentage: ((byte / totalByte) * 100).toFixed(2),
    }));
    data.repositoryStats.languages = languages;

    console.log("Completed fetching repository stats");
  }

  async function recentActivity() {
    // Recent month activity
    let monthCommit = Array(31).fill(0);
    let monthPullRequest = Array(31).fill(0);
    let monthIssue = Array(31).fill(0);

    const currentMonth = new Date().getUTCMonth() + 1;
    let isStop = false;
    let morning = 0,
      afternoon = 0,
      evening = 0,
      night = 0;
    let activeHour = Array(24).fill(0);
    //const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let activeDay = Array(7).fill(0);
    for (var page = 1; page <= 3 && !isStop; page++) {
      const { data: data } = await octokit.activity.listPublicOrgEvents({
        org: orgName,
        per_page: 100,
        page: page,
      });
      for (var event of data) {
        const created_at = new Date(event.created_at);
        const hour = created_at.getUTCHours();
        const day = created_at.getUTCDate(); // Get the day of the month (1-31)
        const month = created_at.getUTCMonth() + 1; // Get the month (0-11)
        const dayName = created_at.getUTCDay(); // Get the day of the week (0-6)
        activeDay[dayName]++;
        activeHour[hour]++;
        if (month != currentMonth) {
          isStop = true;
          break;
        }
        //console.log(day, month, currentMonth);
        if (event.type === "PushEvent") {
          monthCommit[day]++;
        }
        if (event.type === "PullRequestEvent") {
          monthPullRequest[day]++;
        }
        if (event.type === "IssuesEvent") {
          monthIssue[day]++;
        }
        if (hour >= 6 && hour < 12) {
          morning++;
        }
        if (hour >= 12 && hour < 18) {
          afternoon++;
        }
        if (hour >= 18 && hour < 24) {
          evening++;
        }
        if (hour >= 0 && hour < 6) {
          night++;
        }
      }
    }

    // Total commits per day and per hour
    let commitPerDay = Array.from({ length: 7 }, (v, i) => 0);
    let commitPerHour = Array.from({ length: 24 }, (v, i) => 0);

    for (const repo of repos) {
      try {
        const { data: re } = await octokit.rest.repos.getPunchCardStats({
          owner: "TickLabVN",
          repo: repo.name,
        });

        let l = re ? re.length : 0;
        for (let i = 0; i < l; i++) {
          commitPerDay[re[i][0]] += re[i][2];
          commitPerHour[re[i][1]] += re[i][2];
        }
      } catch (error) {
        console.error(
          `Error fetching punch card stats for ${repo.name}:`,
          error
        );
      }
    }
    data.repositoryStats.commitPerDay = commitPerDay;
    data.repositoryStats.commitPerHour = commitPerHour;

    data.recentActivity.pushEvents = monthCommit;
    data.recentActivity.issueEvents = monthIssue;
    data.recentActivity.pullRequestEvents = monthPullRequest;
    data.recentActivity.codingHabits = {
      morning: morning,
      afternoon: afternoon,
      evening: evening,
      night: night,
    };
    data.recentActivity.activeHour = activeHour;
    data.recentActivity.activeDay = activeDay;

    // Commit per Month last year
    let commitPerMonthLastYear = Array.from({ length: 12 }, () => 0);

    for (var repo of repos) {
      const { data: commit } = await octokit.rest.repos.getCommitActivityStats({
        owner: orgName,
        repo: repo.name,
      });
      if (Array.isArray(commit)) {
        commit.forEach((entry) => {
          const { total, week } = entry;
          const date = new Date(week * 1000); // Convert Unix timestamp to JavaScript Date
          commitPerMonthLastYear[date.getMonth()] += total;
        });
        //console.log(repo.name);
      } else {
        //console.log(`No commit data for ${repo.name}`);
      }
    }
    data.repositoryStats.commitPerMonthLastYear = commitPerMonthLastYear;
    console.log("Completed fetching recent activity");
  }

  await getOrganizationDetails();
  //await getCommunityStats();
  await getRepoStats();
  await recentActivity();

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  return data;
}

export { getData };

// export { data };
