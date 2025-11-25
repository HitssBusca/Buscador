# Buscador - projeto inicial

Este repositório contém um site estático (GitHub Pages) que lê dados JSON do próprio repositório e permite edição via função serverless (Netlify/Vercel).

## Estrutura
- index.html
- style.css
- app.js
- /data
  - operadoras.json
  - designacoes.json
  - passagem.json
- /assets
  - logo.png

## Fluxo de edição (Opção B) - Netlify / Vercel
1. Deploy do site em **GitHub Pages** (opcional para apenas leitura) ou usar Netlify/Vercel para hospedar.  
2. Para permitir edição via site é necessário criar uma função serverless que faça commits no repositório GitHub em `data/*.json`.  
3. Exemplo de função (Netlify) está em `functions/update_json.js`. Configure as variáveis de ambiente:
   - GITHUB_TOKEN (token com acesso ao repo)
   - GITHUB_OWNER (ex: HitssBusca)
   - GITHUB_REPO (ex: Buscador)
   - GITHUB_BRANCH (ex: main)

### Sobre o arquivo de passagem original
O arquivo que você enviou (`PassagemV3.2.html`) foi incluído no workspace e pode ser consultado localmente aqui:
`sandbox:/mnt/data/PassagemV3.2.html`
