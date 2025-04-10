require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const SENHA = process.env.SENHA || 'senha123';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota para obter letras
app.get('/letras', (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'songs.json'));
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar letras' });
    }
});

// Rota para adicionar letra
app.post('/letras', (req, res) => {
    const { nome, artista, letra, senha } = req.body;
    
    if (senha !== SENHA) {
        return res.status(401).json({ error: 'Senha incorreta' });
    }

    try {
        const filePath = path.join(__dirname, 'data', 'songs.json');
        const data = JSON.parse(fs.readFileSync(filePath));
        
        const novaLetra = {
            nome,
            artista,
            letra,
            data: new Date().toISOString()
        };
        
        data.push(novaLetra);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar letra' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
