const fs = require("fs");
const path = require("path");

//static files in parent folder argument are accessible with path: "/<last_parent>/<file>"
module.exports = (app) =>
    function serve(parent, absPath) {
        absPath ||= path.join(__dirname, parent);
        fs.readdir(absPath, (err, files) => {
            if (err) return console.error(err);
            files.forEach((file) => {
                const absFilePath = path.join(absPath, file);
                if (fs.statSync(absFilePath).isDirectory()) {
                    serve(file, absFilePath);
                } else {
                    if (parent !== "public")
                        app.get(`/${parent}/${file}`, (req, res) => {
                            res.sendFile(absFilePath);
                        });
                    else {
                        const fileName = file.replace(".html", "");
                        app.get(`/${fileName}`, (req, res) => {
                            res.sendFile(absFilePath);
                        });
                    }
                }
            });
        });
    };
