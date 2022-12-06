const pool = require("../db_connection");

function mapDiffToScore(diff) {
    const score = parseInt(1000 * 1.2 ** -diff);
    return score;
}

function noteAndRankUsersResults(bets_data = [], acutalTemp) {
    const usersResults = [];
    for (const user_bet of bets_data) {
        const { id, temp } = user_bet;
        const diff = Math.abs(acutalTemp - temp);
        const score = mapDiffToScore(diff);
        usersResults.push({ id, temp, score });
    }

    return usersResults.sort((a, b) => a.score - b.score);
}

async function uploadScores(usersResults, acutalTemp) {
    pool.query(`truncate table temp_bets`, (err) => {
        if (err) console.error(err);
    });
    pool.query(`truncate table temp_bet_results`, (err) => {
        if (err) console.error(err);
    });

    usersResults.forEach(async (userResult, index) => {
        const rank = index + 1;
        const { id, temp, score } = userResult;
        userResult.rank = rank;

        pool.query(
            `INSERT INTO temp_bet_results (id, temp_bet, score, bet_rank) VALUES (${id}, ${temp}, ${score}, ${rank})`,
            (err, response) => {
                if (err) return console.error(err);
            }
        );

        pool.query(
            `INSERT INTO temp_bet_results_log (id, temp_bet, score, bet_rank) VALUES (${id}, ${temp}, ${score}, ${rank})`
        );

        console.log(
            `bets done being evaluated: acutal temp:`,
            acutalTemp,
            `
users resulsts:`,
            usersResults
        );
    });
}

module.exports = { mapDiffToScore, noteAndRankUsersResults, uploadScores };
