CREATE DATABASE IF NOT EXISTS sgbd_treinos;

USE sgbd_treinos;

-- Utilizadores 
CREATE TABLE utilizadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'atleta') NOT NULL DEFAULT 'atleta',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Perfil do atleta
CREATE TABLE perfis_atleta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilizador_id INT NOT NULL,
  data_nascimento DATE NULL,
  genero ENUM('Masculino', 'Feminino', 'Outro') NULL,
  altura_cm INT NULL,
  peso_inicial_kg DECIMAL(5,2) NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Grupos Musculares
CREATE TABLE grupos_musculares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE
);

-- Exercícios
CREATE TABLE exercicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  grupo_muscular_id INT NOT NULL,
  descricao TEXT NULL,
  video_caminho VARCHAR(255) NULL,    
  ativo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (grupo_muscular_id) REFERENCES grupos_musculares(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- Planos de Treino 
CREATE TABLE planos_treino (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilizador_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  objetivo VARCHAR(255) NULL,
  data_inicio DATE NULL,
  data_fim DATE NULL,
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Exercícios incluídos num Plano de Treino
CREATE TABLE plano_exercicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plano_id INT NOT NULL,
  exercicio_id INT NOT NULL,
  dia_semana ENUM('Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo') NULL,
  ordem INT NOT NULL DEFAULT 1,
  series INT NOT NULL,
  reps INT NOT NULL,
  carga_sugerida_kg DECIMAL(5,2) NULL,
  descanso_segundos INT NULL,
  FOREIGN KEY (plano_id) REFERENCES planos_treino(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (exercicio_id) REFERENCES exercicios(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- Registo de sessões de treino
CREATE TABLE registos_treino (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilizador_id INT NOT NULL,
  plano_id INT NULL,
  data_treino DATE NOT NULL,
  notas TEXT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (plano_id) REFERENCES planos_treino(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- Registo dos exercícios realizados em cada sessão
CREATE TABLE registos_exercicio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registo_treino_id INT NOT NULL,
  exercicio_id INT NOT NULL,
  serie INT NOT NULL,
  reps INT NOT NULL,
  carga_kg DECIMAL(5,2) NOT NULL,
  percepcao_esforco TINYINT NULL,
  FOREIGN KEY (registo_treino_id) REFERENCES registos_treino(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (exercicio_id) REFERENCES exercicios(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);
