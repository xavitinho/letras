require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const simpleGit = require('simple-git');
const app = express();

const PORT = 3000
const SENHA = process.env.SENHA;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_URL = 'https://github.com/xavitinho/letras.git';
const LOCAL_REPO_PATH = './temp-repo';
const JSON_PATH = path.join(LOCAL_REPO_PATH, 'data', 'songs.json');

app.use(cors());
app.use(express.json());

// Clona ou atualiza o repositório
async function syncRepo() {
  const git = simpleGit();
  try {
    if (!fs.existsSync(LOCAL_REPO_PATH)) {
      await git.clone(`https://${GITHUB_TOKEN}@github.com/xavitinho/letras.git`, LOCAL_REPO_PATH);
    } else {
      await git.cwd(LOCAL_REPO_PATH).pull();
    }
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar repositório:', error);
    return false;
  }
}

// Atualiza o JSON no GitHub
async function updateGitHub(newData) {
  const git = simpleGit(LOCAL_REPO_PATH);
  try {
    fs.writeFileSync(JSON_PATH, JSON.stringify(newData, null, 2));
    
    await git
      .add('./data/songs.json')
      .commit('Atualização automática de letras')
      .push('origin', 'main');
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar GitHub:', error);
    return false;
  }
}

// Rota para obter letras
app.get('/letras', async (req, res) => {
  try {
    await syncRepo();
    const data = fs.readFileSync(JSON_PATH);
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar letras' });
  }
});

// Rota para adicionar letra
app.post('/letras', async (req, res) => {
  const { nome, artista, letra, senha } = req.body;
  
  if (senha !== SENHA) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  try {
    await syncRepo();
    const fileData = fs.readFileSync(JSON_PATH);
    const jsonData = JSON.parse(fileData);
    
    const novaLetra = {
      nome,
      artista,
      letra,
      data: new Date().toISOString()
    };
    
    jsonData.push(novaLetra);
    
    const success = await updateGitHub(jsonData);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar no GitHub' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar letra' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  syncRepo(); // Sincroniza ao iniciar
});
