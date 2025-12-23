import ligacao from "./BD/configMySql.js";

class OperadorPerfil {
  
  // Obter dados do utilizador + perfil
  obterPerfil(utilizador_id) {
    return new Promise((resolve, reject) => {
      // Usamos LEFT JOIN porque o utilizador pode existir mas ainda não ter perfil criado
      const sql = `
        SELECT u.nome, u.email, p.data_nascimento, p.genero, p.altura_cm, p.peso_inicial_kg
        FROM utilizadores u
        LEFT JOIN perfis_atleta p ON u.id = p.utilizador_id
        WHERE u.id = ?
      `;
      ligacao.query(sql, [utilizador_id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }

  // Guardar ou Atualizar perfil (Upsert)
  guardarPerfil({ utilizador_id, data_nascimento, genero, altura_cm, peso_inicial_kg }) {
    return new Promise((resolve, reject) => {
      // Verifica se já existe perfil
      ligacao.query(
        "SELECT id FROM perfis_atleta WHERE utilizador_id = ?",
        [utilizador_id],
        (err, results) => {
          if (err) return reject(err);

          if (results.length > 0) {
            // ATUALIZAR (UPDATE)
            const sqlUpdate = `
              UPDATE perfis_atleta 
              SET data_nascimento = ?, genero = ?, altura_cm = ?, peso_inicial_kg = ?
              WHERE utilizador_id = ?
            `;
            ligacao.query(
              sqlUpdate, 
              [data_nascimento, genero, altura_cm, peso_inicial_kg, utilizador_id],
              (err, res) => {
                if (err) return reject(err);
                resolve({ mensagem: "Perfil atualizado" });
              }
            );
          } else {
            // CRIAR (INSERT)
            const sqlInsert = `
              INSERT INTO perfis_atleta (utilizador_id, data_nascimento, genero, altura_cm, peso_inicial_kg)
              VALUES (?, ?, ?, ?, ?)
            `;
            ligacao.query(
              sqlInsert, 
              [utilizador_id, data_nascimento, genero, altura_cm, peso_inicial_kg],
              (err, res) => {
                if (err) return reject(err);
                resolve({ mensagem: "Perfil criado" });
              }
            );
          }
        }
      );
    });
  }
}

export default OperadorPerfil;