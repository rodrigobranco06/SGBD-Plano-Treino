// app.js

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

import OperacoesUsers from "./operadorUsers.js";
import Utilizador from "./Modelos/utilizador.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5001;
const APP = express();
const OPUSERS = new OperacoesUsers();

// Para ler JSON e dados de forms
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));

APP.use(express.static(path.join(__dirname, "public")));

// Página inicial
APP.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// REGISTAR
APP.post("/registar", async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({ mensagem: "Preenche todos os campos." });
    }

    // Ver se já existe utilizador com esse email
    const existente = await OPUSERS.obterUtilizadorPorEmail(email);
    if (existente) {
      return res.status(400).json({ mensagem: "Email já registado." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const novoUser = new Utilizador(
      null,
      nome,
      email,
      password_hash,
      "atleta",
      null
    );

    await OPUSERS.registarUtilizador(novoUser);

    return res.status(201).json({ mensagem: "Registo efetuado com sucesso." });
  } catch (err) {
    console.error("Erro na rota /registar:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// LOGIN
APP.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensagem: "Preenche email e password." });
    }

    const utilizador = await OPUSERS.obterUtilizadorPorEmail(email);

    if (!utilizador) {
      return res
        .status(401)
        .json({ mensagem: "Email ou password incorretos." });
    }

    const passwordOk = await bcrypt.compare(
      password,
      utilizador.password_hash
    );

    if (!passwordOk) {
      return res
        .status(401)
        .json({ mensagem: "Email ou password incorretos." });
    }

    // Aqui no futuro podes usar sessões ou JWT.
    // Por agora, só dizemos que correu bem.
    return res.json({
      mensagem: "Login bem-sucedido.",
      utilizador: {
        id: utilizador.id,
        nome: utilizador.nome,
        role: utilizador.role,
      },
    });
  } catch (err) {
    console.error("Erro na rota /login:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

APP.listen(PORT, () => {
  console.log("Servidor a correr na porta: " + PORT);
});
