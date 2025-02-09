const fs = require("fs");
const path = require("path");
const CONFIG_FILES = [path.join(process.cwd(), "_config.yml"), path.join(process.cwd(), "_config.butterfly.yml")];

(function () {
    const configPaths = CONFIG_FILES;
    configPaths.forEach((configPath) => {
        if (fs.existsSync(configPath+".bak")) {
            let content = fs.readFileSync(configPath+".bak", "utf8");
            fs.writeFileSync(configPath, content, "utf8");
            fs.unlinkSync(configPath+".bak");
        }
    });
})()