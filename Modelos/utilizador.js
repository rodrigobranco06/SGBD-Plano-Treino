// Modelos/utilizador.js
class Utilizador {
  constructor(id, nome, email, password_hash, role, criado_em) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.password_hash = password_hash;
    this.role = role;
    this.criado_em = criado_em;
  }
}

export default Utilizador;
