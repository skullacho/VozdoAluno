
const CHAVE = "vozDoAlunoPedidos";

let pedidos = [];

try {
  const dados = JSON.parse(localStorage.getItem(CHAVE));
  pedidos = Array.isArray(dados) ? dados : [];
} catch {
  pedidos = [];
}

const $ = id => document.getElementById(id);

const statusDisponiveis = [
  "Pendente",
  "Em análise",
  "Aprovado",
  "Concluído"
];

function salvar() {
  localStorage.setItem(CHAVE, JSON.stringify(pedidos));
}

function elemento(tag, texto, classe) {
  const el = document.createElement(tag);

  if (texto !== undefined) {
    el.textContent = texto;
  }

  if (classe) {
    el.className = classe;
  }

  return el;
}

function adicionarCampo(container, rotulo, valor) {
  const p = elemento("p");
  const strong = elemento("strong", rotulo + ": ");

  p.appendChild(strong);
  p.appendChild(document.createTextNode(valor || "-"));
  container.appendChild(p);
}

// ========================================
// NAVEGAÇÃO
// ========================================

document.querySelectorAll(".aba-btn").forEach(botao => {
  botao.addEventListener("click", () => {
    document.querySelectorAll(".aba-btn").forEach(b => {
      b.classList.remove("ativo");
    });

    document.querySelectorAll(".aba-conteudo").forEach(aba => {
      aba.classList.remove("ativo");
    });

    botao.classList.add("ativo");
    $(botao.dataset.aba).classList.add("ativo");

    if (botao.dataset.aba === "coordenacao") {
      atualizarPainel();
    }
  });
});

// ========================================
// CADASTRO DE SUGESTÕES
// ========================================

$("formSugestao").addEventListener("submit", event => {
  event.preventDefault();

  const nome = $("nome").value.trim();
  const turma = $("turma").value.trim();
  const categoria = $("categoria").value;
  const titulo = $("titulo").value.trim();
  const descricao = $("descricao").value.trim();

  if (!nome || !turma || !categoria || !titulo || !descricao) {
    alert("Preencha todos os campos!");
    return;
  }

  const protocolo = "VA-" +
    crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 12)
      .toUpperCase();

  const novoPedido = {
    protocolo: protocolo,
    nome: nome,
    turma: turma,
    categoria: categoria,
    titulo: titulo,
    descricao: descricao,
    data: new Date().toLocaleString("pt-BR"),
    status: "Pendente",
    resposta: ""
  };

  pedidos.push(novoPedido);
  salvar();

  $("protocoloGerado").textContent = protocolo;
  $("sucesso").hidden = false;

  $("formSugestao").reset();

  atualizarPainel();
});

// ========================================
// CONSULTAR PEDIDO
// ========================================

$("formConsulta").addEventListener("submit", event => {
  event.preventDefault();

  const protocolo = $("protocoloBusca")
    .value.trim().toUpperCase();

  const pedido = pedidos.find(
    p => p.protocolo === protocolo
  );

  const resultado = $("resultadoConsulta");
  resultado.replaceChildren();

  if (!pedido) {
    resultado.appendChild(
      elemento("p", "Pedido não encontrado.", "vazio")
    );
    return;
  }

  const card = elemento("div", undefined, "pedido");

  card.appendChild(elemento("h3", pedido.titulo));

  adicionarCampo(card, "Protocolo", pedido.protocolo);
  adicionarCampo(card, "Categoria", pedido.categoria);
  adicionarCampo(card, "Descrição", pedido.descricao);
  adicionarCampo(card, "Data", pedido.data);

  const status = elemento("span", pedido.status, "status");
  card.appendChild(status);

  if (pedido.resposta) {
    const resposta = elemento("div", undefined, "resposta");

    resposta.appendChild(
      elemento("strong", "Resposta da coordenação:")
    );

    resposta.appendChild(
      elemento("p", pedido.resposta)
    );

    card.appendChild(resposta);
  }

  resultado.appendChild(card);
});

// ========================================
// DASHBOARD
// ========================================

function atualizarDashboard() {
  $("total").textContent = pedidos.length;

  $("pendentes").textContent = pedidos.filter(
    p => p.status === "Pendente"
  ).length;

  $("analise").textContent = pedidos.filter(
    p => p.status === "Em análise"
  ).length;

  $("concluidos").textContent = pedidos.filter(
    p => p.status === "Concluído"
  ).length;
}

// ========================================
// PAINEL DA COORDENAÇÃO
// ========================================

function atualizarPainel() {
  atualizarDashboard();

  const pesquisa = $("pesquisa").value.toLowerCase().trim();
  const statusFiltro = $("filtroStatus").value;
  const categoriaFiltro = $("filtroCategoria").value;

  const filtrados = pedidos.filter(p => {
    const texto = [
      p.nome,
      p.turma,
      p.titulo,
      p.descricao,
      p.protocolo
    ].join(" ").toLowerCase();

    const buscaOk = texto.includes(pesquisa);

    const statusOk =
      statusFiltro === "Todos" ||
      p.status === statusFiltro;

    const categoriaOk =
      categoriaFiltro === "Todas" ||
      p.categoria === categoriaFiltro;

    return buscaOk && statusOk && categoriaOk;
  });

  const lista = $("listaPedidos");
  lista.replaceChildren();

  if (filtrados.length === 0) {
    lista.appendChild(
      elemento("p", "Nenhuma sugestão encontrada.", "vazio")
    );
    return;
  }

  [...filtrados].reverse().forEach(pedido => {
    const card = elemento("article", undefined, "pedido");

    card.appendChild(elemento("h3", pedido.titulo));

    adicionarCampo(card, "Protocolo", pedido.protocolo);
    adicionarCampo(card, "Aluno", pedido.nome);
    adicionarCampo(card, "Turma", pedido.turma);
    adicionarCampo(card, "Categoria", pedido.categoria);
    adicionarCampo(card, "Descrição", pedido.descricao);
    adicionarCampo(card, "Data", pedido.data);

    card.appendChild(
      elemento("span", pedido.status, "status")
    );

    const controles = elemento(
      "div", undefined, "controles"
    );

    const select = document.createElement("select");

    statusDisponiveis.forEach(s => {
      const option = document.createElement("option");
      option.value = s;
      option.textContent = s;
      select.appendChild(option);
    });

    select.value = pedido.status;

    const textarea = document.createElement("textarea");
    textarea.placeholder = "Escreva uma resposta ao aluno...";
    textarea.value = pedido.resposta || "";

    const botao = elemento(
      "button", "Salvar atualização"
    );

    botao.addEventListener("click", () => {
      pedido.status = select.value;
      pedido.resposta = textarea.value.trim();

      salvar();
      atualizarPainel();

      alert("Pedido atualizado com sucesso!");
    });

    controles.appendChild(select);
    controles.appendChild(textarea);
    controles.appendChild(botao);

    card.appendChild(controles);
    lista.appendChild(card);
  });
}

// ========================================
// FILTROS
// ========================================

$("pesquisa").addEventListener("input", atualizarPainel);

$("filtroStatus").addEventListener(
  "change", atualizarPainel
);

$("filtroCategoria").addEventListener(
  "change", atualizarPainel
);

// ========================================
// INICIALIZAÇÃO
// ========================================

atualizarPainel();
