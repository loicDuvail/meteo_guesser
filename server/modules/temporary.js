const pool = require("./db_connection");

const temporary = {
    uploadSession(session) {
        const { user_id, session_id, lifetime } = session;
        pool.query(
            `INSERT INTO sessions (user_id, session_id, lifetime) VALUES (${user_id}, "${session_id}", ${lifetime})`,
            (err, res) => {
                if (err) return console.error(err);
            }
        );
    },

    getUploadedSessions: async function () {
        const dataPromise = new Promise((resolve, reject) => {
            pool.query(`SELECT * FROM sessions`, (err, res) => {
                if (err) reject(err);
                if (!res[0]) reject("no session found");
                resolve(res);
            });
        });
        return dataPromise;
    },

    deleteUploadedSession: function (session_id) {
        pool.query(
            `DELETE FROM sessions WHERE session_id = "${session_id}"`,
            (err, res) => {
                if (err) return console.error(err);
            }
        );
    },
};

module.exports = temporary;
