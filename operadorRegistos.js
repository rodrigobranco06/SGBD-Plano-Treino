import ligacao from "./BD/configMySql.js";

class OperadorRegistos {
  // Cria o cabeçalho do treino
  criarSessao(utilizador_id, plano_id, data_treino, notas) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO registos_treino (utilizador_id, plano_id, data_treino, notas) VALUES (?, ?, ?, ?)`;
      ligacao.query(sql, [utilizador_id, plano_id, data_treino, notas], (err, res) => {
        if (err) return reject(err);
        resolve(res.insertId);
      });
    });
  }

  // Grava cada série individualmente
  gravarSerie(registo_treino_id, exercicio_id, serie, reps, carga_kg, esforfo) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO registos_exercicio 
        (registo_treino_id, exercicio_id, serie, reps, carga_kg, percepcao_esforco) 
        VALUES (?, ?, ?, ?, ?, ?)`;
      
      ligacao.query(sql, [registo_treino_id, exercicio_id, serie, reps, carga_kg, esforfo], (err, res) => {
        if (err) return reject(err);
        resolve(res.insertId);
      });
    });
  }

  // HISTORICO
  listarHistorico(utilizador_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT rt.id, rt.data_treino, rt.notas, pt.nome AS nome_plano
        FROM registos_treino rt
        LEFT JOIN planos_treino pt ON rt.plano_id = pt.id
        WHERE rt.utilizador_id = ?
        ORDER BY rt.data_treino DESC, rt.id DESC`;
      
      ligacao.query(sql, [utilizador_id], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  }

  detalharTreino(registo_id) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT re.*, e.nome AS exercicio_nome, g.nome AS grupo_nome
            FROM registos_exercicio re
            JOIN exercicios e ON re.exercicio_id = e.id
            JOIN grupos_musculares g ON e.grupo_muscular_id = g.id
            WHERE re.registo_treino_id = ?
            ORDER BY re.id ASC`;
        
        ligacao.query(sql, [registo_id], (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
}
} 

export default OperadorRegistos;