// operadorGruposMusculares.js
import ligacao from "./BD/configMySql.js";

class OperadorGruposMusculares {
    // registar novo grupo muscular
  criarGrupo(nome) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        "INSERT INTO grupos_musculares (nome) VALUES (?)",
        [nome],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });
  }

  // listar grupos musculares
  listarGrupos() {
    return new Promise((resolve, reject) => {
      ligacao.query(
        "SELECT id, nome FROM grupos_musculares ORDER BY nome ASC",
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  }

  // apagar grupo muscular
  apagarGrupo(id) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        "DELETE FROM grupos_musculares WHERE id = ?",
        [id],
        (err, result) => {
          if (err) return reject(err);       
          resolve(result.affectedRows);      
        }
      );
    });
  }
}

export default OperadorGruposMusculares;
