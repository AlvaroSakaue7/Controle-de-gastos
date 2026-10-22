// Interface: lê/escreve o DOM e usa as funções de finance.js.
const CHAVE = "controle-de-gastos:v1";
const $ = (seletor) => document.querySelector(seletor);

let transacoes = carregar();
let mes = hoje().slice(0, 7);

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

function renderGrafico(categorias) {
  const area = $("#grafico");
  if (categorias.length === 0) {
    const p = document.createElement("p");
    p.className = "vazio";
    p.textContent = "Sem despesas neste mês.";
    area.replaceChildren(p);
    return;
  }
  const maior = categorias[0].total;
  area.replaceChildren(...categorias.map(({ categoria, total }) => {
    const linha = document.createElement("div");
    linha.className = "barra";
    const nome = document.createElement("span");
    nome.textContent = categoria;
    const trilho = document.createElement("div");
    trilho.className = "trilho";
    const preenchimento = document.createElement("i");
    preenchimento.style.width = `${(total / maior) * 100}%`;
    trilho.append(preenchimento);
    const valor = document.createElement("span");
    valor.textContent = formatarMoeda(total);
    linha.append(nome, trilho, valor);
    return linha;
  }));
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
  acao.append(botao);
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

  renderGrafico(despesasPorCategoria(doMes));
  $("#corpo").replaceChildren(...doMes.map(criarLinha));
  $("#vazio").hidden = doMes.length > 0;
  $("#exportar").disabled = doMes.length === 0;
  salvar();
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

  transacoes.push({ ...dados, descricao: dados.descricao.trim(), id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) });
  mes = dados.data.slice(0, 7); // mostra o mês do lançamento recém-criado
  $("#mes").value = mes;
  $("#descricao").value = "";
  $("#valor").value = "";
  $("#descricao").focus();
  render();
});

$("#mes").addEventListener("change", (e) => {
  if (e.target.value) { mes = e.target.value; render(); }
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

/* ---------- Início ---------- */

$("#categoria").replaceChildren(...CATEGORIAS.map((c) => new Option(c, c)));
$("#mes").value = mes;
$("#data").value = hoje();
render();
