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
import OperadorPlanos from "./operadorPlanos.js";
import OperadorPlanoExercicios from "./operadorPlanoExercicios.js";
import OperadorRegistos from "./operadorRegistos.js";
import ligacao from "./BD/configMySql.js";
import OperadorPerfil from "./operadorPerfil.js";

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
const OPPLANOS = new OperadorPlanos();
const OPPLANOEX = new OperadorPlanoExercicios();
const OPREGISTOS = new OperadorRegistos();
const OPPERFIL = new OperadorPerfil();


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

    return res.status(500).json({ mensagem: "Não foi possível apagar o grupo." });
  }
});

// ==========================
// EXERCÍCIOS - API
// ==========================

// Criar exercício
APP.post(
  "/api/exercicios",
  uploadVideo.single("video"),   
  async (req, res) => {
    try {
      const { nome, grupo_muscular_id, descricao } = req.body;

      if (!nome || !nome.trim() || !grupo_muscular_id) {
        return res
          .status(400)
          .json({ mensagem: "Nome e grupo muscular são obrigatórios." });
      }

      // upload video
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
    const { grupoId, nome } = req.query;
    const exercicios = await OPEXERCICIOS.listarExerciciosAtivos({
      grupoId: grupoId || null,
      nome: nome || "",
    });
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

APP.get("/api/exercicios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ex = await OPEXERCICIOS.obterExercicioPorId(id);
    if (!ex) return res.status(404).json({ mensagem: "Exercício não encontrado." });
    return res.json(ex);
  } catch (err) {
    console.error("Erro em GET /api/exercicios/:id:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});


APP.put("/api/exercicios/:id", uploadVideo.single("video"), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, grupo_muscular_id, descricao, remover_video } = req.body;

    if (!nome || !nome.trim() || !grupo_muscular_id) {
      return res
        .status(400)
        .json({ mensagem: "Nome e grupo muscular são obrigatórios." });
    }

    const existente = await OPEXERCICIOS.obterExercicioPorId(id);
    if (!existente) {
      return res.status(404).json({ mensagem: "Exercício não encontrado." });
    }

    // decidir o video_caminho final
    let video_caminho_final = existente.video_caminho;

    // se pediu para remover vídeo
    if (remover_video === "1") {
      video_caminho_final = null;
    }

    // se veio um novo vídeo, substitui
    if (req.file) {
      video_caminho_final = "/uploads/videosExercicios/" + req.file.filename;
    }

    const afetados = await OPEXERCICIOS.atualizarExercicio({
      id,
      nome: nome.trim(),
      grupo_muscular_id: Number(grupo_muscular_id),
      descricao: descricao && descricao.trim() ? descricao.trim() : null,
      video_caminho: video_caminho_final,
    });

    if (afetados === 0) {
      return res.status(400).json({ mensagem: "Não foi possível atualizar." });
    }

    return res.json({ mensagem: "Exercício atualizado com sucesso." });
  } catch (err) {
    console.error("Erro em PUT /api/exercicios/:id:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});


// ==========================
// PLANOS - API
// ==========================

// Criar plano
APP.post("/api/planos", async (req, res) => {
  try {
    const { utilizador_id, nome, objetivo, data_inicio, data_fim } = req.body;

    if (!utilizador_id || !nome || !nome.trim()) {
      return res
        .status(400)
        .json({ mensagem: "utilizador_id e nome são obrigatórios." });
    }

    const id = await OPPLANOS.criarPlano({
      utilizador_id,
      nome: nome.trim(),
      objetivo: objetivo && objetivo.trim() ? objetivo.trim() : null,
      data_inicio: data_inicio || null,
      data_fim: data_fim || null,
    });

    return res.status(201).json({ mensagem: "Plano criado com sucesso.", id });
  } catch (err) {
    console.error("Erro em POST /api/planos:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// Listar planos do utilizador
APP.get("/api/planos/:utilizador_id", async (req, res) => {
  try {
    const { utilizador_id } = req.params;
    const planos = await OPPLANOS.listarPlanosPorUtilizador(utilizador_id);
    return res.json(planos);
  } catch (err) {
    console.error("Erro em GET /api/planos/:utilizador_id:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// Obter detalhe do plano 
APP.get("/api/planos/:plano_id/detalhe/:utilizador_id", async (req, res) => {
  try {
    const { plano_id, utilizador_id } = req.params;
    const plano = await OPPLANOS.obterPlanoPorId(plano_id, utilizador_id);
    if (!plano) return res.status(404).json({ mensagem: "Plano não encontrado." });
    return res.json(plano);
  } catch (err) {
    console.error("Erro em GET /api/planos/:plano_id/detalhe/:utilizador_id:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// Desativar plano
APP.delete("/api/planos/:plano_id/:utilizador_id", async (req, res) => {
  try {
    const { plano_id, utilizador_id } = req.params;
    const afetados = await OPPLANOS.desativarPlano(plano_id, utilizador_id);
    if (afetados === 0) return res.status(404).json({ mensagem: "Plano não encontrado." });
    return res.json({ mensagem: "Plano desativado com sucesso." });
  } catch (err) {
    console.error("Erro em DELETE /api/planos/:plano_id/:utilizador_id:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// Editar plano
APP.put("/api/planos/:plano_id/:utilizador_id", async (req, res) => {
  try {
    const { plano_id, utilizador_id } = req.params;
    const { nome, objetivo, data_inicio, data_fim } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ mensagem: "O nome do plano é obrigatório." });
    }

    const afetados = await OPPLANOS.atualizarPlano({
      plano_id,
      utilizador_id,
      nome: nome.trim(),
      objetivo: objetivo && objetivo.trim() ? objetivo.trim() : null,
      data_inicio: data_inicio || null,
      data_fim: data_fim || null,
    });

    if (afetados === 0) {
      return res.status(404).json({ mensagem: "Plano não encontrado (ou não pertence ao utilizador)." });
    }

    return res.json({ mensagem: "Plano atualizado com sucesso." });
  } catch (err) {
    console.error("Erro em PUT /api/planos/:plano_id/:utilizador_id:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});


// ==========================
// PLANO_EXERCICIOS - API
// ==========================

const DIAS_VALIDOS = new Set(["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"]);

APP.post("/api/plano-exercicios", async (req, res) => {
  try {
    const {
      plano_id,
      exercicio_id,
      dia_semana,
      ordem,
      series,
      reps,
      carga_sugerida_kg,
      descanso_segundos,
    } = req.body;

    if (!plano_id || !exercicio_id || !series || !reps) {
      return res.status(400).json({
        mensagem: "plano_id, exercicio_id, series e reps são obrigatórios.",
      });
    }

    if (dia_semana && !DIAS_VALIDOS.has(dia_semana)) {
      return res.status(400).json({ mensagem: "dia_semana inválido." });
    }

    const id = await OPPLANOEX.adicionarExercicioAoPlano({
      plano_id,
      exercicio_id,
      dia_semana: dia_semana || null,
      ordem: ordem ? Number(ordem) : 1,
      series: Number(series),
      reps: Number(reps),
      carga_sugerida_kg: carga_sugerida_kg ? Number(carga_sugerida_kg) : null,
      descanso_segundos: descanso_segundos ? Number(descanso_segundos) : null,
    });

    return res.status(201).json({ mensagem: "Exercício adicionado ao plano.", id });
  } catch (err) {
    console.error("Erro em POST /api/plano-exercicios:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

APP.get("/api/plano-exercicios/:plano_id", async (req, res) => {
  try {
    const { plano_id } = req.params;
    const itens = await OPPLANOEX.listarExerciciosDoPlano(plano_id);
    return res.json(itens);
  } catch (err) {
    console.error("Erro em GET /api/plano-exercicios/:plano_id:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

APP.delete("/api/plano-exercicios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const afetados = await OPPLANOEX.removerExercicioDoPlano(id);
    if (afetados === 0) return res.status(404).json({ mensagem: "Item não encontrado." });
    return res.json({ mensagem: "Exercício removido do plano." });
  } catch (err) {
    console.error("Erro em DELETE /api/plano-exercicios/:id:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});


// ==========================
// REGISTAR_TREINO - API
// ==========================
APP.post("/api/registar-treino", async (req, res) => {
  try {
    const { utilizador_id, plano_id, notas, exercicios } = req.body;

    // Criar a sessão
    const dataHoje = new Date().toISOString().slice(0, 10);
    const registo_treino_id = await OPREGISTOS.criarSessao(utilizador_id, plano_id, dataHoje, notas);

    // Gravar exercícios e séries
    for (const ex of exercicios) {
      for (const s of ex.series) {
        await OPREGISTOS.gravarSerie(
          registo_treino_id,
          ex.exercicio_id,
          s.numero,
          s.reps,
          s.carga,
          s.percepcao_esforco 
        );
      }
    }

    res.status(201).json({ mensagem: "Treino guardado!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao gravar treino." });
  }
});

// HISTORICO DE TREINOS
APP.get("/api/historico/:utilizador_id", async (req, res) => {
    try {
        const { utilizador_id } = req.params;
        const historico = await OPREGISTOS.listarHistorico(utilizador_id);
        res.json(historico);
    } catch (err) {
        res.status(500).json({ mensagem: "Erro ao carregar histórico." });
    }
});


// Rota para obter estatísticas do utilizador
APP.get("/api/stats/:utilizador_id", (req, res) => {
  const { utilizador_id } = req.params;

  const sqlTreinos = "SELECT COUNT(*) as total FROM registos_treino WHERE utilizador_id = ?";
  const sqlPlanos = "SELECT COUNT(*) as total FROM planos_treino WHERE utilizador_id = ? AND ativo = 1";

  if (!ligacao) {
    console.error("Erro: Objeto 'ligacao' não foi definido.");
    return res.status(500).json({ mensagem: "Erro de configuração na base de dados." });
  }

  ligacao.query(sqlTreinos, [utilizador_id], (errTreinos, resTreinos) => {
    if (errTreinos) {
      console.error("Erro SQL Treinos:", errTreinos);
      return res.status(500).json({ mensagem: "Erro ao contar treinos." });
    }

    ligacao.query(sqlPlanos, [utilizador_id], (errPlanos, resPlanos) => {
      if (errPlanos) {
        console.error("Erro SQL Planos:", errPlanos);
        return res.status(500).json({ mensagem: "Erro ao contar planos." });
      }

      res.json({
        totalTreinos: resTreinos[0]?.total || 0,
        totalPlanos: resPlanos[0]?.total || 0
      });
    });
  });
});

// DETALHES DE UM TREINO
APP.get("/api/treino-detalhe/:registo_id", async (req, res) => {
    try {
        const { registo_id } = req.params;
        const detalhes = await OPREGISTOS.detalharTreino(registo_id);
        res.json(detalhes);
    } catch (err) {
        res.status(500).json({ mensagem: "Erro ao carregar detalhes do treino." });
    }
});

// ==========================
// PERFIL - API
// ==========================

// Obter Perfil
APP.get("/api/perfil/:id", async (req, res) => {
  try {
    const dados = await OPPERFIL.obterPerfil(req.params.id);
    if (!dados) return res.status(404).json({ mensagem: "Utilizador não encontrado" });
    res.json(dados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao carregar perfil" });
  }
});

// Guardar Perfil
APP.put("/api/perfil/:id", async (req, res) => {
  try {
    const { data_nascimento, genero, altura_cm, peso_inicial_kg } = req.body;
    await OPPERFIL.guardarPerfil({
      utilizador_id: req.params.id,
      data_nascimento: data_nascimento || null,
      genero: genero || null,
      altura_cm: altura_cm || null,
      peso_inicial_kg: peso_inicial_kg || null
    });
    res.json({ mensagem: "Dados guardados com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao guardar perfil" });
  }
});

// PÁGINA 404.HTML
APP.use((req, res) => {
    // Define o status como 404 e envia o ficheiro HTML
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});