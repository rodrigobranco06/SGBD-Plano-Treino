// operadorExercicios.js
import ligacao from "./BD/configMySql.js";

class OperadorExercicios {
  criarExercicio({ nome, grupo_muscular_id, descricao, video_caminho }) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `INSERT INTO exercicios (nome, grupo_muscular_id, descricao, video_caminho)
         VALUES (?, ?, ?, ?)`,
        [nome, grupo_muscular_id, descricao || null, video_caminho || null],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });
  }

  listarExerciciosAtivos({ grupoId = null, nome = "" } = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT e.id,
               e.nome,
               e.descricao,
               e.video_caminho,
               e.ativo,
               g.id AS grupo_id,
               g.nome AS grupo_nome
        FROM exercicios e
        JOIN grupos_musculares g ON e.grupo_muscular_id = g.id
        WHERE e.ativo = 1
      `;
      const params = [];

      if (grupoId) {
        sql += " AND g.id = ? ";
        params.push(Number(grupoId));
      }

      if (nome && nome.trim()) {
        sql += " AND e.nome LIKE ? ";
        params.push(`%${nome.trim()}%`);
      }

      sql += " ORDER BY g.nome ASC, e.nome ASC";

      ligacao.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  desativarExercicio(id) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `UPDATE exercicios SET ativo = 0 WHERE id = ?`,
        [id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.affectedRows);
        }
      );
    });
  }

  obterExercicioPorId(id) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `SELECT e.id, e.nome, e.descricao, e.video_caminho, e.ativo,
                e.grupo_muscular_id, g.nome AS grupo_nome
         FROM exercicios e
         JOIN grupos_musculares g ON e.grupo_muscular_id = g.id
         WHERE e.id = ?`,
        [id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results[0] || null);
        }
      );
    });
  }

  atualizarExercicio({ id, nome, grupo_muscular_id, descricao, video_caminho }) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `UPDATE exercicios
         SET nome = ?, grupo_muscular_id = ?, descricao = ?, video_caminho = ?
         WHERE id = ? AND ativo = 1`,
        [nome, grupo_muscular_id, descricao || null, video_caminho || null, id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.affectedRows);
        }
      );
    });
  }
}

export default OperadorExercicios;
