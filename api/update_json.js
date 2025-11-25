import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { filePath, content } = req.body;

  if (!filePath || !content) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const { data: fileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
    });

    const result = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      message: "Atualizando JSON via site",
      content: Buffer.from(content).toString("base64"),
      sha: fileData.sha,
    });

    return res.status(200).json({ success: true, result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
