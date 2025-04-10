require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const SENHA = process.env.SENHA || 'senha123';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'xavitinho';
const REPO_NAME = 'letras';
const FILE_PATH = 'data/songs.json';
const BRANCH = 'main';

app.use(cors());
app.use(express.json());

// Apenas POST /letras
app.post('/letras', async (req, res) => {
    const { nome, artista, letra, senha } = req.body;

    if (senha !== SENHA) {
        return res.status(401).json({ error: 'Senha incorreta' });
    }

    try {
        // 1. Buscar o conteúdo atual do arquivo no GitHub
        const { data: fileData } = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json',
            },
            params: {
                ref: BRANCH
            }
        });

        // 2. Decodificar conteúdo Base64
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const json = JSON.parse(content);

        // 3. Adicionar nova música
        json.push({
            nome,
            artista,
            letra,
            data: new Date().toISOString()
        });

        const newContent = Buffer.from(JSON.stringify(json, null, 2)).toString('base64');

        // 4. Fazer commit via GitHub API
        await axios.put(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            message: `Nova letra adicionada: ${nome} - ${artista}`,
            content: newContent,
            sha: fileData.sha,
            branch: BRANCH
        }, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json',
            }
        });

        res.json({ success: true });
    } catch (error) {
    if (error.response) {
        console.error('Erro da API GitHub:', error.response.status, error.response.statusText);
        console.error('Corpo da resposta:', error.response.data);
    } else {
        console.error('Erro inesperado:', error.message);
    }
    res.status(500).json({ error: 'Erro ao salvar letra no GitHub' });
}

});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
