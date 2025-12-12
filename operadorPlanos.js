// operadorPlanos.js
import ligacao from "./BD/configMySql.js";

class OperadorPlanos {
  criarPlano({ utilizador_id, nome, objetivo, data_inicio, data_fim }) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `INSERT INTO planos_treino (utilizador_id, nome, objetivo, data_inicio, data_fim)
         VALUES (?, ?, ?, ?, ?)`,
        [
          utilizador_id,
          nome,
          objetivo || null,
          data_inicio || null,
          data_fim || null,
        ],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });
  }

  listarPlanosPorUtilizador(utilizador_id) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `SELECT id, nome, objetivo, data_inicio, data_fim, ativo, criado_em
         FROM planos_treino
         WHERE utilizador_id = ? AND ativo = 1
         ORDER BY criado_em DESC`,
        [utilizador_id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  }

  obterPlanoPorId(plano_id, utilizador_id) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `SELECT id, utilizador_id, nome, objetivo, data_inicio, data_fim, ativo, criado_em
         FROM planos_treino
         WHERE id = ? AND utilizador_id = ?`,
        [plano_id, utilizador_id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results[0] || null);
        }
      );
    });
  }

  desativarPlano(plano_id, utilizador_id) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `UPDATE planos_treino
         SET ativo = 0
         WHERE id = ? AND utilizador_id = ?`,
        [plano_id, utilizador_id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.affectedRows);
        }
      );
    });
  }

  atualizarPlano({ plano_id, utilizador_id, nome, objetivo, data_inicio, data_fim }) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `UPDATE planos_treino
         SET nome = ?, objetivo = ?, data_inicio = ?, data_fim = ?
         WHERE id = ? AND utilizador_id = ? AND ativo = 1`,
        [nome, objetivo || null, data_inicio || null, data_fim || null, plano_id, utilizador_id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.affectedRows);
        }
      );
    });
  }
}

export default OperadorPlanos;
