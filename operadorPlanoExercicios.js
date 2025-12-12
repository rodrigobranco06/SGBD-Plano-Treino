// operadorPlanoExercicios.js
import ligacao from "./BD/configMySql.js";

class OperadorPlanoExercicios {
  adicionarExercicioAoPlano({
    plano_id,
    exercicio_id,
    dia_semana,
    ordem,
    series,
    reps,
    carga_sugerida_kg,
    descanso_segundos,
  }) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `INSERT INTO plano_exercicios
         (plano_id, exercicio_id, dia_semana, ordem, series, reps, carga_sugerida_kg, descanso_segundos)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plano_id,
          exercicio_id,
          dia_semana || null,
          ordem || 1,
          series,
          reps,
          carga_sugerida_kg || null,
          descanso_segundos || null,
        ],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });
  }

  listarExerciciosDoPlano(plano_id) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `SELECT pe.id,
                pe.plano_id,
                pe.exercicio_id,
                pe.dia_semana,
                pe.ordem,
                pe.series,
                pe.reps,
                pe.carga_sugerida_kg,
                pe.descanso_segundos,
                e.nome AS exercicio_nome,
                g.nome AS grupo_nome,
                e.video_caminho
         FROM plano_exercicios pe
         JOIN exercicios e ON pe.exercicio_id = e.id
         JOIN grupos_musculares g ON e.grupo_muscular_id = g.id
         WHERE pe.plano_id = ?
         ORDER BY
           FIELD(pe.dia_semana,'Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'),
           pe.ordem ASC,
           e.nome ASC`,
        [plano_id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  }

  removerExercicioDoPlano(plano_exercicio_id) {
    return new Promise((resolve, reject) => {
      ligacao.query(
        `DELETE FROM plano_exercicios WHERE id = ?`,
        [plano_exercicio_id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.affectedRows);
        }
      );
    });
  }
}

export default OperadorPlanoExercicios;
