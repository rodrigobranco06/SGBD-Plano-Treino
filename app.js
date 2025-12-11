// app.js

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import multer from "multer";


import OperacoesUsers from "./operadorUsers.js";
import Utilizador from "./Modelos/utilizador.js";
import OperadorGruposMusculares from "./operadorGruposMusculares.js";
import OperadorExercicios from "./operadorExercicios.js";

// MULTER CONFIG
const storageVideos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/videosExercicios/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nomeFinal = "video_" + Date.now() + ext;
    cb(null, nomeFinal);
  },
});

function fileFilter(req, file, cb) {
  const tiposPermitidos = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (tiposPermitidos.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas ficheiros de vídeo são permitidos."));
  }
}

const uploadVideo = multer({
  storage: storageVideos,
  fileFilter,
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5001;
const APP = express();
const OPUSERS = new OperacoesUsers();
const OPGRUPOS = new OperadorGruposMusculares();
const OPEXERCICIOS = new OperadorExercicios();



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


// ==========================
// GRUPOS MUSCULARES - API
// ==========================

// Criar grupo muscular
APP.post("/api/grupos-musculares", async (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome || nome.trim() === "") {
      return res.status(400).json({ mensagem: "O nome é obrigatório." });
    }

    const nomeLimpo = nome.trim();

    const id = await OPGRUPOS.criarGrupo(nomeLimpo);
    return res
      .status(201)
      .json({ mensagem: "Grupo muscular criado com sucesso.", id });
  } catch (err) {
    console.error("Erro em POST /api/grupos-musculares:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// Listar grupos musculares
APP.get("/api/grupos-musculares", async (req, res) => {
  try {
    const grupos = await OPGRUPOS.listarGrupos();
    return res.json(grupos);
  } catch (err) {
    console.error("Erro em GET /api/grupos-musculares:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// Apagar grupo muscular
APP.delete("/api/grupos-musculares/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const apagados = await OPGRUPOS.apagarGrupo(id);

    if (apagados === 0) {
      return res.status(404).json({ mensagem: "Grupo não encontrado." });
    }

    return res.json({ mensagem: "Grupo muscular apagado com sucesso." });
  } catch (err) {
    console.error("Erro em DELETE /api/grupos-musculares/:id:", err);

    // Se no futuro falhar por causa de FK com exercícios, podes tratar por err.code
    return res.status(500).json({ mensagem: "Não foi possível apagar o grupo." });
  }
});

// ==========================
// EXERCÍCIOS - API
// ==========================

// Criar exercício
APP.post(
  "/api/exercicios",
  uploadVideo.single("video"),   // <--- Nome do campo vindo do formulário
  async (req, res) => {
    try {
      const { nome, grupo_muscular_id, descricao } = req.body;

      if (!nome || !nome.trim() || !grupo_muscular_id) {
        return res
          .status(400)
          .json({ mensagem: "Nome e grupo muscular são obrigatórios." });
      }

      // Se tiver vídeo, o caminho fica:
      let video_caminho = null;
      if (req.file) {
        video_caminho = "/uploads/videosExercicios/" + req.file.filename;
      }

      const id = await OPEXERCICIOS.criarExercicio({
        nome: nome.trim(),
        grupo_muscular_id,
        descricao: descricao?.trim() || null,
        video_caminho,
      });

      return res.status(201).json({
        mensagem: "Exercício criado com sucesso.",
        id,
      });
    } catch (err) {
      console.error("Erro ao criar exercício:", err);
      return res.status(500).json({ mensagem: "Erro no servidor." });
    }
  }
);


// Listar exercícios ativos
APP.get("/api/exercicios", async (req, res) => {
  try {
    const exercicios = await OPEXERCICIOS.listarExerciciosAtivos();
    return res.json(exercicios);
  } catch (err) {
    console.error("Erro em GET /api/exercicios:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// Desativar exercício
APP.delete("/api/exercicios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const alterados = await OPEXERCICIOS.desativarExercicio(id);

    if (alterados === 0) {
      return res.status(404).json({ mensagem: "Exercício não encontrado." });
    }

    return res.json({ mensagem: "Exercício desativado com sucesso." });
  } catch (err) {
    console.error("Erro em DELETE /api/exercicios/:id:", err);
    return res
      .status(500)
      .json({ mensagem: "Não foi possível desativar o exercício." });
  }
});
