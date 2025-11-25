const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const filePath = body.filePath;     // Ex: "data/operadoras.json"
    const content = body.content;       // Novo conteúdo do arquivo

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const { data: fileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      ref: process.env.GITHUB_BRANCH,
    });

    const sha = fileData.sha;

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      message: "Atualização automática pelo buscador",
      content: Buffer.from(content).toString("base64"),
      sha: sha,
      branch: process.env.GITHUB_BRANCH,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
