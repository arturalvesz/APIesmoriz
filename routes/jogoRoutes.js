const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar um novo jogo
router.post('/novo', async (req, res) => {
  try {
    const { data, hora, equipa_casa, escalao_id, equipa_fora, localizacao } = req.body;    
    const [dia, mes, ano] = data.split("-");
    const dataFormatada = `${ano}-${mes}-${dia}`;

    const novoJogo = await pool.query(
      'INSERT INTO jogo (data, hora, equipa_casa, escalao_id, equipa_fora, localizacao, competicao) VALUES ($1, $2, $3, $4, $5, $6,$7) RETURNING *',
      [dataFormatada, hora, equipa_casa, escalao_id, equipa_fora, localizacao]
    );
    res.json({ jogo: novoJogo.rows[0] });
  } catch (err) {
    console.error('Erro ao criar jogo:', err);
    res.status(500).json({ error: 'Erro ao criar jogo' });
  }
});

// Obter todos os jogos
router.get('/all', async (req, res) => {
  try {
    const todosJogos = await pool.query("SELECT id, to_char(data, 'DD-MM-YYYY') AS data, to_char(hora, 'HH24:MI') AS hora, equipa_casa, escalao_id, resultado_casa, equipa_fora, resultado_fora, localizacao, competicao FROM Jogo");
    res.json({ jogos: todosJogos.rows });
  } catch (err) {
    console.error('Erro ao obter jogos:', err);
    res.status(500).json({ error: 'Erro ao obter jogos' });
  }
});

//obter array de jogos de determinado escalao
router.get('/all/:escalao_id', async (req, res) => {
  try {
    const { escalao_id } = req.params;

    // Consulta para obter o nome do escalão
    const nomeEscalaoQuery = await pool.query("SELECT nome FROM Escalao WHERE id = $1", [escalao_id]);
    const nomeEscalao = nomeEscalaoQuery.rows[0].nome;

    // Consulta para obter todos os jogos do escalão
    const todosJogos = await pool.query("SELECT id, to_char(data, 'DD-MM-YYYY') AS data, to_char(hora, 'HH24:MI') AS hora, equipa_casa, escalao_id, resultado_casa, equipa_fora, resultado_fora, localizacao, competicao FROM Jogo WHERE escalao_id = $1", [escalao_id]);
    
    // Resposta JSON com os jogos e o nome do escalão
    res.json({ 
      escalao: nomeEscalao, 
      jogos: todosJogos.rows 
    });
  } catch (err) {
    console.error('Erro ao obter jogos:', err);
    res.status(500).json({ error: 'Erro ao obter jogos' });
  }
});

//obter um jogo de um determinado escalao
router.get('/:escalao_id/:jogo_id', async (req, res) => {
  try {
    const { escalao_id, jogo_id } = req.params;
    const jogo = await pool.query("SELECT id, to_char(data, 'DD-MM-YYYY') AS data, to_char(hora, 'HH24:MI') AS hora, equipa_casa, escalao_id, resultado_casa, equipa_fora, resultado_fora, localizacao, competicao FROM Jogo WHERE escalao_id = $1 AND id = $2", [escalao_id, jogo_id]);
    if (jogo.rows.length === 0) {
      res.status(404).json({ error: 'Jogo não encontrado' });
      return;
    }
    res.json({ jogo: jogo.rows[0] });
  } catch (err) {
    console.error('Erro ao obter jogo:', err);
    res.status(500).json({ error: 'Erro ao obter jogo' });
  }
});

// Obter um único jogo pelo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jogo = await pool.query("SELECT id, to_char(data, 'DD-MM-YYYY') AS data, to_char(hora, 'HH24:MI') AS hora, equipa_casa, escalao_id, resultado_casa, equipa_fora, resultado_fora, localizacao, competicao FROM Jogo WHERE id = $1", [id]);
    if (jogo.rows.length === 0) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    res.json({ jogo: jogo.rows[0] });
  } catch (err) {
    console.error('Erro ao obter jogo pelo ID:', err);
    res.status(500).json({ error: 'Erro ao obter jogo pelo ID' });
  }
});

// Atualizar um jogo
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, hora, equipa_casa, escalao_id, equipa_fora, localizacao, competicao } = req.body;

    const jogoAtualizado = await pool.query(
      "UPDATE jogo SET data = $1, hora = $2, equipa_casa = $3, escalao_id = $4, equipa_fora = $5, localizacao = $6, competicao = $7 WHERE id = $8 RETURNING *",
      [data, hora, equipa_casa, escalao_id, equipa_fora, localizacao, competicao,id]
    );

    if (jogoAtualizado.rows.length === 0) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    res.json({ jogo: jogoAtualizado.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar jogo:', err);
    res.status(500).json({ error: 'Erro ao atualizar jogo' });
  }
});

// Excluir um jogo
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jogoExcluido = await pool.query(
      "DELETE FROM Jogo WHERE id = $1 RETURNING *",
      [id]
    );
    if (jogoExcluido.rows.length === 0) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    res.json({ message: 'Jogo excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir jogo:', err);
    res.status(500).json({ error: 'Erro ao excluir jogo' });
  }
});

module.exports = router;
