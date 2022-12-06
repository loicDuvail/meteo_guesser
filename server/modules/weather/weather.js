const pool = require("../db_connection");
require("dotenv").config();
const fetch = (url) =>
    import("node-fetch").then(({ default: fetch }) => fetch(url));
const { noteAndRankUsersResults, uploadScores } = require("./weatherDep");

let weather = {
    apiKey: process.env.WEATHER_API_KEY,
    todayCity: "Rennes",
    fetchWeather: function () {
        return fetch(
            "https://api.openweathermap.org/data/2.5/weather?q=" +
                this.todayCity +
                "&units=metric&appid=" +
                this.apiKey
        )
            .then((response) => response.json())
            .catch((e) => console.error(e));
    },

    evaluateTempBet: function () {
        this.fetchWeather().then((data) => {
            const acutalTemp = data.main.temp;

            pool.query(`SELECT * FROM temp_bets`, (err, response) => {
                if (err) return console.error(err);
                if (!response[0])
                    return console.log(
                        "empty array returned from temp_bets table"
                    );

                let usersResults = noteAndRankUsersResults(
                    response,
                    acutalTemp
                );

                uploadScores(usersResults, acutalTemp);
            });
        });
    },

    choseTodayCity: function () {
        const cities = [
            "Paris",
            "Marseille",
            "Lyon",
            "Toulouse",
            "Nice",
            "Strasbourg",
            "Nantes",
            "Bordeaux",
            "Montpellier",
            "Rennes",
            "Saint-Etienne",
            "Le Havre",
            "Reims",
            "Lille",
            "Toulon",
            "Grenoble",
            "Brest",
            "Dijon",
            "Le Mans",
            "Angers",
        ];

        return (this.todayCity =
            cities[parseInt(Math.random() * cities.length)]);
    },
};

module.exports = weather;
