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

  listarExerciciosAtivos() {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `SELECT e.id,
                e.nome,
                e.descricao,
                e.video_caminho,
                e.ativo,
                g.nome AS grupo_nome
         FROM exercicios e
         JOIN grupos_musculares g ON e.grupo_muscular_id = g.id
         WHERE e.ativo = 1
         ORDER BY g.nome ASC, e.nome ASC`,
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  }

  desativarExercicio(id) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `UPDATE exercicios
         SET ativo = 0
         WHERE id = ?`,
        [id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.affectedRows); // 0 = não existia, 1 = desativado
        }
      );
    });
  }
}

export default OperadorExercicios;
