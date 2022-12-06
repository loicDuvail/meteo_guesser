const { v4 } = require("uuid");
const Temporary = require("./temporary");

class Sessions {
    constructor() {
        this.sessions = [];
        //! TEMPORARY, used to not have to re-login at each server reset
        Temporary.getUploadedSessions()
            .then((sessions) => {
                this.sessions = sessions;
            })
            .catch((e) => {
                if (e === "no session found") return console.log(e);
                console.error(e);
            });
    }

    createSession(user_id) {
        const TWO_HOURS = 7_200_000;
        const session = {
            user_id: user_id,
            session_id: v4(),
            lifetime: TWO_HOURS,
        };

        this.sessions.push(session);
        Temporary.uploadSession(session);

        console.log(
            `
`,
            "new session initiated: ",
            session.session_id
        );

        return session.session_id;
    }

    killSession(session, cause) {
        const { session_id } = session;
        this.sessions.splice(this.sessions.indexOf(session), 1);
        Temporary.deleteUploadedSession(session_id);

        console.log(`
        `);
        console.log(`session terminated, id: ${session_id}
cause: ${cause}`);
    }

    dropSession(session_id) {
        const { sessions } = this;
        const session = sessions.find(
            (session) => session.session_id === session_id
        );
        this.killSession(session, "user manual termiation");
    }

    auth(session_id) {
        const { sessions } = this;
        if (!sessions) return false;

        const session = sessions.find(
            (session) => session.session_id === session_id
        );
        return Boolean(session);
    }

    initAging(interval_ms) {
        interval_ms ||= 10000;
        setInterval(() => {
            for (const session of this.sessions) this.age(session, interval_ms);
        }, interval_ms);
    }

    age(session, interval) {
        session.lifetime -= interval;
        if (session.lifetime <= 0)
            this.killSession(session, "session timed out");
    }

    getUserId(session_id) {
        const session = this.sessions.find(
            (session) => session.session_id === session_id
        );
        return session.user_id;
    }
}

module.exports = new Sessions();
