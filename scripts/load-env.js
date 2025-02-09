require("dotenv").config();
const fs = require("fs");
const path = require("path");
const CONFIG_FILES = [path.join(process.cwd(), "_config.yml"), path.join(process.cwd(), "_config.butterfly.yml")];

function replaceEnvVars(content) {
    return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
        // console.log(match,key,process.env[key])
        return process.env[key] || match;
    });
    //环境变量不存在时，保持原样
}

hexo.extend.filter.register("before_generate", function () {
    const configPaths = CONFIG_FILES;
    configPaths.forEach((configPath) => {
        if (fs.existsSync(configPath+".bak")) {
            let content = fs.readFileSync(configPath+".bak", "utf8");
            fs.writeFileSync(configPath, content, "utf8");
            fs.unlinkSync(configPath+".bak");
        }
        if (fs.existsSync(configPath)) {
            let content = fs.readFileSync(configPath, "utf8");
            //保存对应的.bak文件
            fs.writeFileSync(configPath + ".bak", content, "utf8");
            // console.log('content', content)
            content = replaceEnvVars(content);
            fs.writeFileSync(configPath, content, "utf8");
        }
    })
});

//还原配置文件
// hexo.extend.filter.register("before_exit", function () {
//     const configPaths = CONFIG_FILES;
//     configPaths.forEach((configPath) => {
//         if (fs.existsSync(configPath+".bak")) {
//             let content = fs.readFileSync(configPath+".bak", "utf8");
//             fs.writeFileSync(configPath, content, "utf8");
//             fs.unlinkSync(configPath+".bak");
//         }
//     });
// });