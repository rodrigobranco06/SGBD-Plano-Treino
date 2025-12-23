// operadorUsers.js
import ligacao from "./BD/configMySql.js";
import Utilizador from "./Modelos/utilizador.js";

class OperacoesUsers {
  constructor() {}

  // Registo de novo utilizador
  registarUtilizador(utilizador) {
    return new Promise((resolve, reject) => {
      const QUERY = `
        INSERT INTO sgbd_treinos.utilizadores (nome, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `;

      const params = [
        utilizador.nome,
        utilizador.email,
        utilizador.password_hash,
        utilizador.role || "atleta", 
      ];

      ligacao.query(QUERY, params, (err, result) => {
        if (err) {
          console.error("Erro ao registar utilizador:", err);
          return reject(err);
        }

        resolve(result.insertId);
      });
    });
  }

  // Obter utilizador pelo email 
  obterUtilizadorPorEmail(email) {
    return new Promise((resolve, reject) => {
      const QUERY = `
        SELECT id, nome, email, password_hash, role, criado_em
        FROM sgbd_treinos.utilizadores
        WHERE email = ?
        LIMIT 1
      `;

      ligacao.query(QUERY, [email], (err, result) => {
        if (err) {
          console.error("Erro ao obter utilizador por email:", err);
          return reject(err);
        }

        if (result.length === 0) {
          // quando nao encontra ninguém
          return resolve(null);
        }

        const r = result[0];

        const utilizador = new Utilizador(
          r.id,
          r.nome,
          r.email,
          r.password_hash,
          r.role,
          r.criado_em
        );

        resolve(utilizador);
      });
    });
  }
}

export default OperacoesUsers;
