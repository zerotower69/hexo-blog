const OpenAI = require("openai");
const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");

require("dotenv").config();

async function generateAbstract(content) {
  const openai = new OpenAI({
    // baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    baseURL:"https://api.deepseek.com",
    // apiKey: process.env.DASHSCOPE_API_KEY,
    apiKey: process.env.DEEPSEEK_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "deepseek-chat", // 模型名称
    messages: [
      {
        role: "user",
        content:
          "给这篇markdown格式的文章生成不少于40字，不多于120字的摘要，生成结果开头不需要“摘要”两字。文章内容为：" + content,
      },
    ],
  });
  const answer = completion.choices[0].message.content;
//   console.log(answer);
  return answer;
}

hexo.extend.filter.register("before_post_render", async function (document) {
  try {
    if (document.layout === "post") {
      // console.log(document.title);
      const md = document.raw;
      if (
        // document.title === "前端大图切分加载" &&
        !(document.description === false || typeof document.description === 'string')
      ) {
        // console.log(document)
        const description = await generateAbstract(md);
        document.description = description;
        // console.log(document);
        const mdFilePath = path.resolve(
          process.cwd(),
          "source",
          document.source
        );
        const frontMatterRegex = /^---\n([\s\S]*?)\n---\n/;
        const match = md.match(frontMatterRegex);
        if (match) {
          const frontMatter = match[1];
          const body = md.slice(match[0].length);

          // 解析 YAML front-matter
          const frontMatterObj = yaml.load(frontMatter) || {};
          frontMatterObj.description = description;
          // 将更新后的 front-matter 和内容写回文件
          const updatedFrontMatter = yaml.dump(frontMatterObj, {
            lineWidth: -1,
          }); // 保持 YAML 格式
          const updatedFileContent = `---\n${updatedFrontMatter}---\n${body}`;
          fs.writeFileSync(mdFilePath, updatedFileContent, "utf8");
        }
      }
    }
    return document;
  } catch (error) {
    console.error(error);
  }
});
