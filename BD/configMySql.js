// configMySql.js
import mysql from "mysql";

const ligacao = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sgbd_treinos",
  port: 3307
});

ligacao.connect((err) => {
  if (err) {
    console.error("Erro ao ligar ao MySQL:", err);
  } else {
    console.log("Ligação MySQL estabelecida com sucesso.");
  }
});

export default ligacao;
