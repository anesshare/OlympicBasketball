const fs = require('fs');

const groupsData = JSON.parse(fs.readFileSync('./groups.json'));
const exibitionsData = JSON.parse(fs.readFileSync('./exibitions.json'));

function simulateMatch(team1, team2) {
    const fibaDifference = team1.FIBA_Rank - team2.FIBA_Rank;
    const probability = 0.5 + fibaDifference * 0.01;

    const team1Score = Math.floor(Math.random() * 50) + 75;
    const team2Score = Math.floor(Math.random() * 50) + 75;

    if (Math.random() < probability) {
        return { winner: team1.Team, loser: team2.Team, score: `${team1Score}:${team2Score}` };
    } else {
        return { winner: team2.Team, loser: team1.Team, score: `${team2Score}:${team1Score}` };
    }
}

function simulateGroupStage(groups) {
    const groupStageResults = {};

    for (const [groupName, teams] of Object.entries(groups)) {
        groupStageResults[groupName] = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const matchResult = simulateMatch(teams[i], teams[j]);
                groupStageResults[groupName].push({ match: `${teams[i].Team} - ${teams[j].Team}`, result: matchResult.score });
            }
        }
    }

    return groupStageResults;
}

const groupStageResults = simulateGroupStage(groupsData);
console.log("Grupna faza - Rezultati:");
for (const [groupName, results] of Object.entries(groupStageResults)) {
    console.log(`  Grupa ${groupName}:`);
    results.forEach(({ match, result }) => console.log(`    ${match} (${result})`));
}

function rankTeams(groupResults) {
    const rankings = {};

    for (const [groupName, results] of Object.entries(groupResults)) {
        const standings = {};

        results.forEach(({ match, result }) => {
            const [team1, team2] = match.split(' - ');
            const [score1, score2] = result.split(':').map(Number);

            standings[team1] = standings[team1] || { points: 0, scored: 0, conceded: 0, wins: 0, losses: 0 };
            standings[team2] = standings[team2] || { points: 0, scored: 0, conceded: 0, wins: 0, losses: 0 };

            standings[team1].scored += score1;
            standings[team1].conceded += score2;
            standings[team2].scored += score2;
            standings[team2].conceded += score1;

            if (score1 > score2) {
                standings[team1].points += 2;
                standings[team1].wins += 1;
                standings[team2].points += 1;
                standings[team2].losses += 1;
            } else {
                standings[team2].points += 2;
                standings[team2].wins += 1;
                standings[team1].points += 1;
                standings[team1].losses += 1;
            }
        });

        rankings[groupName] = Object.entries(standings).sort((a, b) => {
            const [teamA, statsA] = a;
            const [teamB, statsB] = b;

            if (statsA.points !== statsB.points) {
                return statsB.points - statsA.points;
            } else if ((statsA.scored - statsA.conceded) !== (statsB.scored - statsB.conceded)) {
                return (statsB.scored - statsB.conceded) - (statsA.scored - statsA.conceded);
            } else {
                return statsB.scored - statsA.scored;
            }
        });
    }

    return rankings;
}

const rankings = rankTeams(groupStageResults);
console.log("\nKonačan plasman u grupama:");
for (const [groupName, rankedTeams] of Object.entries(rankings)) {
    console.log(`  Grupa ${groupName}:`);
    rankedTeams.forEach(([team, stats], index) => {
        console.log(`    ${index + 1}. ${team} - Pobede/Porazi: ${stats.wins}/${stats.losses}, Bodovi: ${stats.points}, Postignuti/Primljeni koševi: ${stats.scored}/${stats.conceded}, Koš razlika: ${stats.scored - stats.conceded}`);
    });
}

function formSeshiri(rankings) {
    const seshiri = { D: [], E: [], F: [], G: [] };


    for (const [groupName, rankedTeams] of Object.entries(rankings)) {
        seshiri.D.push(rankedTeams[0][0]); 
        seshiri.E.push(rankedTeams[1][0]); 
        seshiri.F.push(rankedTeams[2][0]); 
        seshiri.G.push(rankedTeams[3][0]); 
    }

    return seshiri;
}

const seshiri = formSeshiri(rankings);
console.log("\nŠeširi:");
for (const [seshirName, teams] of Object.entries(seshiri)) {
    console.log(`  Šešir ${seshirName}:`);
    teams.forEach(team => console.log(`    ${team}`));
}


function simulateElimination(seshiri) {
    const quarterfinalsWinners = [];
    const semifinalsWinners = [];
    const thirdPlaceMatchTeams = [];

    
    const quarterfinals = [
        [seshiri.D[0], seshiri.G[1]],  
        [seshiri.D[1], seshiri.G[0]],  
        [seshiri.E[0], seshiri.F[1]],  
        [seshiri.E[1], seshiri.F[0]]   
    ];

    console.log("\nČetvrtfinale:");
    quarterfinals.forEach(([team1, team2]) => {
        const matchResult = simulateMatch({ Team: team1 }, { Team: team2 });
        quarterfinalsWinners.push(matchResult.winner);
        console.log(`  ${team1} - ${team2} (${matchResult.score})`);
    });

   
    const semifinals = [
        [quarterfinalsWinners[0], quarterfinalsWinners[1]],
        [quarterfinalsWinners[2], quarterfinalsWinners[3]]
    ];

    console.log("\nPolufinale:");
    semifinals.forEach(([team1, team2]) => {
        const matchResult = simulateMatch({ Team: team1 }, { Team: team2 });
        semifinalsWinners.push(matchResult.winner);
        thirdPlaceMatchTeams.push(matchResult.loser);
        console.log(`  ${team1} - ${team2} (${matchResult.score})`);
    });


    console.log("\nUtakmica za treće mesto:");
    const thirdPlaceMatch = simulateMatch({ Team: thirdPlaceMatchTeams[0] }, { Team: thirdPlaceMatchTeams[1] });
    console.log(`  ${thirdPlaceMatchTeams[0]} - ${thirdPlaceMatchTeams[1]} (${thirdPlaceMatch.score})`);

    
    console.log("\nFinale:");
    const finalMatch = simulateMatch({ Team: semifinalsWinners[0] }, { Team: semifinalsWinners[1] });
    console.log(`  ${semifinalsWinners[0]} - ${semifinalsWinners[1]} (${finalMatch.score})`);
    console.log('Prvo mesto:'+ finalMatch.winner)
    console.log('Drugo mesto:'+ finalMatch.loser)
    console.log('Trece mesto:'+ thirdPlaceMatch.winner)
}

simulateElimination(seshiri);
