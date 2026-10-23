// Interface: lê/escreve o DOM e usa as funções de finance.js.
const CHAVE = "controle-de-gastos:v1";
const $ = (seletor) => document.querySelector(seletor);

let transacoes = carregar();
let mes = hoje().slice(0, 7);
let editandoId = null;
let categoriaFiltro = null; // categoria escolhida no gráfico de rosca

function novoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------- Tema ---------- */

const CHAVE_TEMA = "controle-de-gastos:tema";

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  $("#tema").textContent = tema === "escuro" ? "Tema claro" : "Tema escuro";
  $("#tema").setAttribute("aria-pressed", String(tema === "escuro"));
  try { localStorage.setItem(CHAVE_TEMA, tema); } catch { /* ignora */ }
}

function temaInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    if (salvo) return salvo;
  } catch { /* ignora */ }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

function hoje() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function carregar() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE));
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(transacoes)); } catch { /* segue em memória */ }
}

function formatarData(iso) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

const NS = "http://www.w3.org/2000/svg";
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const corDe = (categoria) => `var(--c${Math.max(0, CATEGORIAS.indexOf(categoria))})`;

function svg(tag, atributos = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [nome, valor] of Object.entries(atributos)) el.setAttribute(nome, valor);
  return el;
}

function textoSvg(conteudo, atributos) {
  const el = svg("text", atributos);
  el.textContent = conteudo;
  return el;
}

function ativarComTeclado(el, acao) {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); acao(); }
  });
}

function alternarFiltro(categoria) {
  categoriaFiltro = categoriaFiltro === categoria ? null : categoria;
  render();
}

// Gráfico de rosca: passe o mouse para ver o valor, clique para filtrar a tabela.
function renderRosca(categorias) {
  const area = $("#rosca");
  if (categorias.length === 0) {
    const p = document.createElement("p");
    p.className = "vazio";
    p.textContent = "Sem despesas neste mês.";
    area.replaceChildren(p);
    return;
  }

  const total = categorias.reduce((soma, c) => soma + c.total, 0);
  const raio = 70;
  const volta = 2 * Math.PI * raio;
  const rotulo = textoSvg("Despesas", { x: 100, y: 97, class: "centro-rotulo" });
  const valor = textoSvg(formatarMoeda(total), { x: 100, y: 115, class: "centro-valor" });
  const mostrar = (item) => {
    rotulo.textContent = item ? item.categoria : "Despesas";
    valor.textContent = formatarMoeda(item ? item.total : total);
  };

  const grafico = svg("svg", { viewBox: "0 0 200 200", class: "rosca", role: "group", "aria-label": "Despesas por categoria" });
  const legenda = document.createElement("ul");
  legenda.className = "legenda";
  let acumulado = 0;

  for (const item of categorias) {
    const fatia = (item.total / total) * volta;
    const percentual = Math.round((item.total / total) * 100);
    const ativo = categoriaFiltro === item.categoria;

    const arco = svg("circle", {
      cx: 100, cy: 100, r: raio,
      "stroke-dasharray": `${fatia} ${volta - fatia}`,
      "stroke-dashoffset": -acumulado,
      transform: "rotate(-90 100 100)",
      tabindex: 0,
      role: "button",
      "aria-label": `${item.categoria}: ${formatarMoeda(item.total)} (${percentual}%). Ativar para filtrar a tabela.`,
    });
    arco.style.stroke = corDe(item.categoria);
    arco.classList.toggle("ativo", ativo);
    arco.classList.toggle("apagado", Boolean(categoriaFiltro) && !ativo);
    acumulado += fatia;

    const botao = document.createElement("button");
    botao.type = "button";
    botao.setAttribute("aria-pressed", String(ativo));
    const cor = document.createElement("i");
    cor.style.background = corDe(item.categoria);
    const nome = document.createElement("span");
    nome.textContent = item.categoria;
    const valorTexto = document.createElement("span");
    valorTexto.textContent = formatarMoeda(item.total);
    const pct = document.createElement("span");
    pct.className = "pct";
    pct.textContent = `${percentual}%`;
    botao.append(cor, nome, valorTexto, pct);
    const li = document.createElement("li");
    li.append(botao);
    legenda.append(li);

    for (const alvo of [arco, botao]) {
      alvo.addEventListener("mouseenter", () => mostrar(item));
      alvo.addEventListener("focus", () => mostrar(item));
      alvo.addEventListener("mouseleave", () => mostrar(null));
      alvo.addEventListener("blur", () => mostrar(null));
      alvo.addEventListener("click", () => alternarFiltro(item.categoria));
    }
    ativarComTeclado(arco, () => alternarFiltro(item.categoria));
    grafico.append(arco);
  }

  grafico.append(rotulo, valor);
  const caixa = document.createElement("div");
  caixa.className = "rosca-area";
  caixa.append(grafico, legenda);
  area.replaceChildren(caixa);
}

// Barras dos últimos 6 meses: clique em um mês para abri-lo.
function renderBarras() {
  const dados = ultimosMeses(transacoes, mes, 6);
  const maior = Math.max(1, ...dados.flatMap((d) => [d.receitas, d.despesas]));
  const largura = 600, altura = 220, topo = 16, base = 190, esquerda = 48;
  const faixa = (largura - esquerda) / dados.length;
  const barra = Math.min(26, faixa * 0.28);
  const alturaDe = (v) => (v / maior) * (base - topo);

  const grafico = svg("svg", { viewBox: `0 0 ${largura} ${altura}`, class: "barras", role: "group", "aria-label": "Receitas e despesas dos últimos 6 meses" });

  for (const fracao of [0, 0.5, 1]) {
    const y = base - fracao * (base - topo);
    grafico.append(
      svg("line", { class: "grade", x1: esquerda, x2: largura, y1: y, y2: y }),
      textoSvg(formatarCompacto(maior * fracao), { x: esquerda - 6, y: y + 3, "text-anchor": "end" })
    );
  }

  dados.forEach((d, i) => {
    const x = esquerda + i * faixa;
    const centro = x + faixa / 2;
    const [ano, numero] = d.mes.split("-");
    const nome = `${MESES[Number(numero) - 1]}/${ano.slice(2)}`;
    const descricao = `${nome}: receitas ${formatarMoeda(d.receitas)}, despesas ${formatarMoeda(d.despesas)}`;

    const grupo = svg("g", {
      class: d.mes === mes ? "mes-grupo atual" : "mes-grupo",
      tabindex: 0,
      role: "button",
      "aria-label": `${descricao}. Ativar para abrir este mês.`,
    });
    const dica = svg("title");
    dica.textContent = descricao; // tooltip nativo ao passar o mouse
    grupo.append(
      dica,
      svg("rect", { class: "fundo-mes", x: x + 4, y: 0, width: faixa - 8, height: altura, rx: 4 }),
      svg("rect", { class: "rec", x: centro - barra - 2, y: base - alturaDe(d.receitas), width: barra, height: alturaDe(d.receitas), rx: 2 }),
      svg("rect", { class: "desp", x: centro + 2, y: base - alturaDe(d.despesas), width: barra, height: alturaDe(d.despesas), rx: 2 }),
      textoSvg(nome, { x: centro, y: base + 18, "text-anchor": "middle" })
    );

    const abrir = () => {
      mes = d.mes;
      categoriaFiltro = null;
      $("#mes").value = mes;
      render();
    };
    grupo.addEventListener("click", abrir);
    ativarComTeclado(grupo, abrir);
    grafico.append(grupo);
  });

  $("#barras").replaceChildren(grafico);
}

function criarLinha(t) {
  const tr = document.createElement("tr");
  const celula = (texto, classe) => {
    const td = document.createElement("td");
    td.textContent = texto;
    if (classe) td.className = classe;
    return td;
  };
  const sinal = t.tipo === "receita" ? "+ " : "− ";
  tr.append(
    celula(formatarData(t.data)),
    celula(t.descricao),
    celula(t.categoria),
    celula(sinal + formatarMoeda(t.valor), `valor ${t.tipo}`)
  );
  const acao = document.createElement("td");
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = "Excluir";
  botao.setAttribute("aria-label", `Excluir: ${t.descricao}`);
  botao.addEventListener("click", () => {
    transacoes = transacoes.filter((x) => x.id !== t.id);
    render();
  });
  const editar = document.createElement("button");
  editar.type = "button";
  editar.textContent = "Editar";
  editar.setAttribute("aria-label", `Editar: ${t.descricao}`);
  editar.addEventListener("click", () => iniciarEdicao(t));
  acao.append(editar, botao);
  tr.append(acao);
  return tr;
}

function render() {
  const doMes = filtrarPorMes(transacoes, mes).sort((a, b) => b.data.localeCompare(a.data));
  const { receitas, despesas, saldo } = resumir(doMes);

  $("#saldo").textContent = formatarMoeda(saldo);
  $("#saldo").className = saldo < 0 ? "neg" : "pos";
  $("#receitas").textContent = formatarMoeda(receitas);
  $("#despesas").textContent = formatarMoeda(despesas);

  const categorias = despesasPorCategoria(doMes);
  if (categoriaFiltro && !categorias.some((c) => c.categoria === categoriaFiltro)) categoriaFiltro = null;
  const tabela = categoriaFiltro
    ? doMes.filter((t) => t.tipo === "despesa" && t.categoria === categoriaFiltro)
    : doMes;

  renderRosca(categorias);
  renderBarras();
  $("#corpo").replaceChildren(...tabela.map(criarLinha));
  $("#vazio").hidden = tabela.length > 0;
  $("#limpar-filtro").hidden = !categoriaFiltro;
  $("#limpar-filtro").textContent = categoriaFiltro ? `Filtrando por ${categoriaFiltro} ✕` : "";
  $("#exportar").disabled = doMes.length === 0;
  salvar();
}

/* ---------- Edição ---------- */

function iniciarEdicao(t) {
  editandoId = t.id;
  $("#tipo").value = t.tipo;
  $("#descricao").value = t.descricao;
  $("#valor").value = t.valor;
  $("#categoria").value = t.categoria;
  $("#data").value = t.data;
  $("#titulo-form").textContent = "Editar lançamento";
  $("#salvar").textContent = "Salvar alteração";
  $("#cancelar").hidden = false;
  $("#erro").textContent = "";
  $("#form").scrollIntoView({ behavior: "smooth", block: "center" });
  $("#descricao").focus();
}

function sairDaEdicao() {
  editandoId = null;
  $("#titulo-form").textContent = "Novo lançamento";
  $("#salvar").textContent = "Adicionar";
  $("#cancelar").hidden = true;
  $("#descricao").value = "";
  $("#valor").value = "";
}

/* ---------- Eventos ---------- */

$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  const dados = {
    tipo: $("#tipo").value,
    descricao: $("#descricao").value,
    valor: parseFloat($("#valor").value),
    categoria: $("#categoria").value,
    data: $("#data").value,
  };
  const erro = validar(dados);
  $("#erro").textContent = erro || "";
  if (erro) return;

  const limpo = { ...dados, descricao: dados.descricao.trim() };
  if (editandoId) {
    transacoes = transacoes.map((t) => (t.id === editandoId ? { ...t, ...limpo } : t));
  } else {
    transacoes.push({ ...limpo, id: novoId() });
  }
  mes = dados.data.slice(0, 7); // mostra o mês do lançamento salvo
  $("#mes").value = mes;
  sairDaEdicao();
  $("#descricao").focus();
  render();
});

$("#mes").addEventListener("change", (e) => {
  if (e.target.value) { mes = e.target.value; categoriaFiltro = null; render(); }
});

$("#exportar").addEventListener("click", () => {
  const csv = paraCSV(filtrarPorMes(transacoes, mes));
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `gastos-${mes}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

$("#cancelar").addEventListener("click", sairDaEdicao);

$("#limpar-filtro").addEventListener("click", () => { categoriaFiltro = null; render(); });

$("#tema").addEventListener("click", () => {
  aplicarTema(document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro");
});

$("#importar").addEventListener("click", () => $("#arquivo").click());

$("#arquivo").addEventListener("change", async (e) => {
  const arquivo = e.target.files[0];
  e.target.value = "";
  if (!arquivo) return;
  const { validas, ignoradas } = lerCSV(await arquivo.text());
  const repetido = (a, b) =>
    a.data === b.data && a.descricao === b.descricao && a.tipo === b.tipo &&
    a.categoria === b.categoria && a.valor === b.valor;
  const novas = validas.filter((v) => !transacoes.some((t) => repetido(t, v)));
  transacoes.push(...novas.map((v) => ({ ...v, id: novoId() })));
  if (novas.length > 0) {
    mes = novas[0].data.slice(0, 7);
    $("#mes").value = mes;
  }
  $("#status").textContent =
    `${novas.length} importado(s), ${validas.length - novas.length} repetido(s), ${ignoradas} linha(s) inválida(s).`;
  render();
});

/* ---------- Início ---------- */

aplicarTema(temaInicial());

$("#categoria").replaceChildren(...CATEGORIAS.map((c) => new Option(c, c)));
$("#mes").value = mes;
$("#data").value = hoje();
render();
