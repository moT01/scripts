// After getting survey data with get-daily-challenges.js, this goes through the
// completed-daily-challenges.json file and writes totals to analyzed-daily-challenges.json
// Be sure to update the daily-challenges.js file to have the latest challenges before running this.

const fs = require("fs");
const dailyChallenges = require("./daily-challenges.js");

// console.log(dailyChallenges);

const analyzedData = {
  // metadata
  numberOfChallenges: dailyChallenges.size,
  uniqueUsers: 0,

  // challenge completions
  challengeCompletions: 0,
  challengeCompletionsOnReleaseDay: 0,
  challenges: {},

  // weekday completions
  weekdayCompletions: {
    monday: {
      total: 0,
      onReleaseDay: 0,
    },
    tuesday: {
      total: 0,
      onReleaseDay: 0,
    },
    wednesday: {
      total: 0,
      onReleaseDay: 0,
    },
    thursday: {
      total: 0,
      onReleaseDay: 0,
    },
    friday: {
      total: 0,
      onReleaseDay: 0,
    },
    saturday: {
      total: 0,
      onReleaseDay: 0,
    },
    sunday: {
      total: 0,
      onReleaseDay: 0,
    },
  },

  // language completions
  languageCompletionsTotal: 0,
  languageCompletionsJavascript: 0,
  languageCompletionsPython: 0,
  languageCompletionsBoth: 0,
  languageCompletions: {},

  // number of users (value) with X completed challenges (key)
  challengeCompletionDistribution: {},
  challengeCompletionDistributionOnReleaseDay: {},

  // streaks

  // number of users (value) with X completed consecutive challenges (key)
  consecutiveCompletedChallenges: {},
  releaseDayStreaks: {},
};

dailyChallenges.values().forEach(({ date, challengeNumber, title }) => {
  analyzedData.challenges[date] = {
    challengeNumber,
    title,
    completions: 0,
    completionsOnReleaseDay: 0,
  };

  analyzedData.languageCompletions[date] = {
    challengeNumber,
    title,
    total: 0,
    javascript: 0,
    python: 0,
    both: 0,
  };
});

/*
const averageCompletionsPerChallenge = totlalNumberOfCompletions / totalNumberOfChallenges
const averageCompletionsOnReleaseDay = numberOfCompletionsOnReleaseDay / totalNumberOfChallenges

number of users who have completed in both languages
average completetions per day - completed any time
average completetions on release day
most completed challenge
most completed challenge on release day - maybe we can look at some trends, like what days have more completions on release day


something about streaks, who's coming back? 
average number of completions in a row?
top X user streaks
average streaks

all streaks - e.g: 10 3 release day streaks, 100 2 day streaks - no 1 day streaks.
both release day and overall

what about like completions per user - how many times did the users come back
what about day of the week trends - are there days of the week that have more completions?
how many days in a row have users come back?

most completed overall challenges per user - 
most completed release day challenges per user -

completions per user overall
completions per user on release day

e.g: 31 users completed 1 challenge overall - 10 users completed 15 challenges overall
e.g: 50 users completed 1 challenge on release day - 5 users completed 10 challenges on release day

what about weekday completions

e.g: X completions on mondays, Y of X of those are on release day

*/

function isCompletedOnReleaseDay(releaseDate, completedTimestamp) {
  const completed = new Date(completedTimestamp);
  const release = new Date(releaseDate);

  return (
    completed.getUTCFullYear() === release.getUTCFullYear() &&
    completed.getUTCMonth() === release.getUTCMonth() &&
    completed.getUTCDate() === release.getUTCDate()
  );
}

function getDayOfWeek(timestamp) {
  const date = new Date(timestamp);
  const daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return daysOfWeek[date.getUTCDay()];
}

function recordConsecutiveCompletedChallengesStreak(streak) {
  console.log('recording streak: ' + streak);
  if (analyzedData.consecutiveCompletedChallenges[streak]) {
    analyzedData.consecutiveCompletedChallenges[streak]++;
  } else {
    analyzedData.consecutiveCompletedChallenges[streak] = 1;
  }
}

fs.readFile("completed-daily-challenges.json", "utf8", (err, data) => {
  if (err) {
    console.error(`Error reading the file: ${err}`);
    return;
  }

  try {
    const userData = JSON.parse(data);

    analyzedData.uniqueUsers = userData.length;

    // map and add properties, and sort by challenge release date, this users completed challenges
    userData.forEach((user) => {
      const userChallenges = user
        .map((challenge) => {
          const dailyChallenge = dailyChallenges.get(challenge.id);
          if (!dailyChallenge) {
            throw new Error(
              `No daily challenge found for challenge ID: ${challenge.id}`
            );
          }

          const { date, challengeNumber, title } = dailyChallenge;

          return {
            ...challenge,
            releaseDate: date,
            challengeNumber,
            title,
            completedOnReleaseDay: isCompletedOnReleaseDay(
              date,
              challenge.completedDate
            ),
            weekdayCompleted: getDayOfWeek(challenge.completedDate),
          };
        })
        .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

      // so we have all the challenges for the user - we know each is completed, some on release day
      // and they're sorted by release date.

      /*
        so what kind of streaks do we want?
        We have release day streaks, with their completed challenges sorted by challenge release date, I can see how many in a row they completed on release day.
        We also have overall completions - which is sort of a streak, but we can see how many challenges they completed in a row regardless of when they completed the challenge.
        We also have the time users completed challenges - so we know how many days in a row they came back and completed a challenge.

        // so what would the data for a single user look like?

        const releaseDayStreaks = [2, 5, 7] - meaning 2, 5, and 7, day streaks of completing on release day.


        All this is on a per user basis, so we can calculate each of these for each user, but then we also want to put all the streaks from all users together in a data set, maybe something like:
        releaseDayStreaks: {
          2: N, // where 2 is a streak of completing a challenge on release day 2 days in a row, and N is the number of users with that streak.
          3: N, // similar
          ...rest of release day streaks.
        }

        // consecutiveChallengeStreak
        overallStreaks: {
          similar structure as above.
          2: N // means N number of users completed challenges for 2 days in a row, regardless of when they were completed
        }

        consistencyStreak: {
          2: N // this is based on the completedDate (timestamp) of the completed challenge, so we want to know how many days in a row someone came and completed a challenge - regardless of the challenge release day.
        }

        what about info on specific users - like time between completing a challenge. Then we aggregate? Lets start with the streaks.
      */

      // no, this doesn't work cause we need to find the day of the challenge, and see
      // let currentReleaseDayStreak = 0;
      // let releaseDayStreaks = [];

      let consecutiveCompletedChallengeStreak = 1;

      for (let i = 0; i < userChallenges.length; i++) {
        const currentChallenge = userChallenges[i];
        const previousChallenge = i > 0 ? userChallenges[i - 1] : null;

        const {
          completedOnReleaseDay,
          languages,
          releaseDate,
          weekdayCompleted,
        } = currentChallenge;

        // challenge completions
        analyzedData.challengeCompletions += 1;
        analyzedData.challenges[releaseDate].completions += 1;

        if (completedOnReleaseDay) {
          analyzedData.challengeCompletionsOnReleaseDay += 1;
          analyzedData.challenges[releaseDate].completionsOnReleaseDay += 1;
        }

        // weekday completions
        analyzedData.weekdayCompletions[weekdayCompleted].total += 1;
        if (completedOnReleaseDay) {
          analyzedData.weekdayCompletions[weekdayCompleted].onReleaseDay += 1;
        }

        // languages completions
        analyzedData.languageCompletionsTotal += languages.length;
        analyzedData.languageCompletions[releaseDate].total += languages.length;

        if (languages.includes("javascript")) {
          analyzedData.languageCompletionsJavascript += 1;
          analyzedData.languageCompletions[releaseDate].javascript += 1;
        }

        if (languages.includes("python")) {
          analyzedData.languageCompletionsPython += 1;
          analyzedData.languageCompletions[releaseDate].python += 1;
        }

        if (languages.includes("python") && languages.includes("javascript")) {
          analyzedData.languageCompletionsBoth += 1;
          analyzedData.languageCompletions[releaseDate].both += 1;
        }

        const isConsecutiveDay = previousChallenge
          ? currentChallenge.challengeNumber ===
            previousChallenge.challengeNumber + 1
          : false;

        if (isConsecutiveDay) {
          consecutiveCompletedChallengeStreak++;
        } else if (consecutiveCompletedChallengeStreak > 0) {
          console.log('not recording streak...')
          recordConsecutiveCompletedChallengesStreak(
            consecutiveCompletedChallengeStreak
          );
          consecutiveCompletedChallengeStreak = 1;
        }
      }

      // Save the final streak if it exists
      if (consecutiveCompletedChallengeStreak > 0) {
        recordConsecutiveCompletedChallengesStreak(
          consecutiveCompletedChallengeStreak
        );
      }

      // userChallenges.forEach((challenge) => {
      //   const {
      //     completedOnReleaseDay,
      //     languages,
      //     releaseDate,
      //     weekdayCompleted,
      //   } = challenge;

      //   // challenge completions
      //   analyzedData.challengeCompletions += 1;
      //   analyzedData.challenges[releaseDate].completions += 1;

      //   if (completedOnReleaseDay) {
      //     analyzedData.challengeCompletionsOnReleaseDay += 1;
      //     analyzedData.challenges[releaseDate].completionsOnReleaseDay += 1;
      //   }

      //   // weekday completions
      //   analyzedData.weekdayCompletions[weekdayCompleted].total += 1;
      //   if (challenge.completedOnReleaseDay) {
      //     analyzedData.weekdayCompletions[weekdayCompleted].onReleaseDay += 1;
      //   }

      //   // languages completions
      //   analyzedData.languageCompletionsTotal += languages.length;
      //   analyzedData.languageCompletions[releaseDate].total += languages.length;

      //   if (languages.includes("javascript")) {
      //     analyzedData.languageCompletionsJavascript += 1;
      //     analyzedData.languageCompletions[releaseDate].javascript += 1;
      //   }

      //   if (languages.includes("python")) {
      //     analyzedData.languageCompletionsPython += 1;
      //     analyzedData.languageCompletions[releaseDate].python += 1;
      //   }

      //   if (languages.includes("python") && languages.includes("javascript")) {
      //     analyzedData.languageCompletionsBoth += 1;
      //     analyzedData.languageCompletions[releaseDate].both += 1;
      //   }
      // });

      // challenge completion distribution
      const numberOfCompletedChallenges = userChallenges.length;
      if (
        analyzedData.challengeCompletionDistribution[
          numberOfCompletedChallenges
        ]
      ) {
        analyzedData.challengeCompletionDistribution[
          numberOfCompletedChallenges
        ] += 1;
      } else {
        analyzedData.challengeCompletionDistribution[
          numberOfCompletedChallenges
        ] = 1;
      }

      const numberOfCompletedChallengesOnReleaseDay = userChallenges.filter(
        (c) => c.completedOnReleaseDay
      ).length;
      if (
        analyzedData.challengeCompletionDistributionOnReleaseDay[
          numberOfCompletedChallengesOnReleaseDay
        ]
      ) {
        analyzedData.challengeCompletionDistributionOnReleaseDay[
          numberOfCompletedChallengesOnReleaseDay
        ] += 1;
      } else {
        analyzedData.challengeCompletionDistributionOnReleaseDay[
          numberOfCompletedChallengesOnReleaseDay
        ] = 1;
      }
    });
  } catch (e) {
    console.error("An error occurred:");
    console.error(e);
  }

  try {
    fs.writeFileSync(
      "analyzed-daily-challenges.json",
      JSON.stringify(analyzedData, null, 2),
      "utf-8"
    );

    console.log(`Done writing data to 'analyzed-daily-challenges.json'`);
  } catch (e) {
    console.error("Error writing JSON:");
    console.error(e);
  }
});
