////////// dependencies //////////

require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const Weather = require("./modules/weather/weather");
const serveFnGen = require("./modules/staticServe");
const pool = require("./modules/db_connection");
const SHA256 = require("./modules/SHA256");
const Sessions = require("./modules/sessions");
Sessions.initAging();

const app = express();

const serve = serveFnGen(app);

///////////// authentification middleware ////////////

const publicRoutes = ["/api", "/login", "/signUp", "/css", "/js"];

function auth(req, res, next) {
    //bypass auth for public routes
    if (publicRoutes.some((route) => route === req.path.slice(0, route.length)))
        return next();

    const { session_id } = req.cookies;

    if (Sessions.auth(session_id)) return next();

    const PRIV_API_PATH = "/private-api";
    if (req.path.substring(0, PRIV_API_PATH.length) === PRIV_API_PATH)
        return res
            .send({ error: "user not recognized, please log in" })
            .status(401);

    res.redirect(302, "/login");
}

app.use(
    express.json(),
    cookieParser(),
    bodyParser.urlencoded({ extended: false }),
    auth
);

////////////// routing ///////////////

serve("public", path.join(__dirname, "../public"));

app.get("/", (req, res) =>
    res.sendFile(path.join(__dirname, "../public/index.html"))
);

///////////////// methods ///////////////////

/// account creation/connection //

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.send({ error: "missing input field" }).status(400);

    pool.query(
        `SELECT hash, salt, id FROM login WHERE email="${email}"`,
        (err, response) => {
            if (err)
                return console.error(err), res.send({ error: err }).status(500);

            if (!response[0])
                return res.send({ error: "email not recognized" }).status(404);

            const { hash, salt, id } = response[0];

            //if valid passord
            if (hash === SHA256(password + salt)) {
                const session_id = Sessions.createSession(id);
                res.cookie("session_id", session_id, { sameSite: true });
                res.send({ ok: true }).status(200);
            }

            //if invalid password
            else {
                res.send({ error: "invalid password" }).status(401);
            }
        }
    );
});

app.post("/api/createAccount", async (req, res) => {
    const { name, email, digest, salt } = req.body;

    if (!email || !salt || !digest)
        return res.send({ error: "missing field content" }).status(400);

    pool.query(
        `SELECT email FROM login WHERE email="${email}"`,
        (err, response) => {
            if (err)
                return console.error(err), res.send({ error: err }).status(500);

            if (response[0])
                return res.send({ error: "email already in use" }).status(409);

            pool.query(
                `INSERT INTO login (user_name, email, salt, hash) VALUES ("${name}","${email}","${salt}","${digest}")`,
                (err, response) => {
                    if (err)
                        return (
                            console.error(err),
                            res.send({ error: err }).status(500)
                        );
                    return res.send({ ok: "session created" }).status(200);
                }
            );
        }
    );
});

app.post("/private-api/logout", (req, res) => {
    const { session_id } = req.cookies;
    Sessions.dropSession(session_id);
    res.clearCookie("session_id");
    res.send({ ok: "successfuly logged out" }).status(200);
});

app.post("/private-api/deleteAccount", (req, res) => {
    const { session_id } = req.cookies;
    const user_id = Sessions.getUserId(session_id);
    pool.query(`DELETE FROM login WHERE id="${user_id}"`, (err, response) => {
        if (err)
            return console.error(err), res.send({ error: err }).status(500);
        res.send({ ok: "account successfuly deleted" }).status(200);
    });
});

// bet system //

app.post("/private-api/tempBet", async (req, res) => {
    const { temp } = req.body;
    const { session_id } = req.cookies;
    const user_id = Sessions.getUserId(session_id);

    pool.query(
        `SELECT id FROM temp_bets WHERE id = ${user_id}`,
        (err, response) => {
            if (err)
                return console.log(err), res.send({ error: err }).status(500);
            if (response[0]) return res.send({ error: "already bet today" });

            pool.query(
                `INSERT INTO temp_bets VALUES ("${user_id}", "${temp}")`,
                (err, response) => {
                    if (err)
                        return (
                            console.error(err),
                            res.send({ error: err }).status(500)
                        );
                    res.send({ ok: "bet accepted" }).status(200);
                }
            );
        }
    );
});

(function dailyBetCheck() {
    const REFRESH_PERIOD_ms = 1000 * 60;
    const ONE_DAY_ms = 1000 * 3600 * 24;
    const findNoonInterval = setInterval(() => {
        const time = new Date();
        const mins = time.getMinutes();
        const hours = time.getHours();
        if (hours == 12 && mins == 0) {
            Weather.evaluateTempBet();
            setTimeout(() => {
                Weather.choseTodayCity();
            }, 60_000);
            setInterval(() => {
                Weather.evaluateTempBet();
                setTimeout(() => {
                    Weather.choseTodayCity();
                }, 60_000);
            }, ONE_DAY_ms);
            clearInterval(findNoonInterval);
        }
    }, REFRESH_PERIOD_ms);
})();

app.get("/api/getTodayCity", (req, res) => {
    res.send({ todayCity: Weather.todayCity }).status(200);
});

app.get("/private-api/getLastScore", (req, res) => {
    const { session_id } = req.cookies;
    const user_id = Sessions.getUserId(session_id);
    pool.query(
        `SELECT score, rank, temp_bet from temp_bet_results WHERE id = ${user_id}`,
        (err, res) => {
            if (err)
                return console.error(err), res.send({ error: err }).status(500);
            if (!res[0])
                return res
                    .send({ error: "no score found for user" })
                    .status(404);
            res.send(res[0]);
        }
    );
});

//////////// uncaught exeptions ////////////

process.on("uncaughtException", (err) => console.error(err));

//////////// server init //////////

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`listening on port ${PORT}...`));
