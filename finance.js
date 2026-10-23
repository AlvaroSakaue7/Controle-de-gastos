// Regras de negócio puras (sem DOM): fáceis de testar.
const CATEGORIAS = ["Moradia", "Alimentação", "Transporte", "Lazer", "Saúde", "Salário", "Outros"];

function arredondar(n) {
  return Math.round(n * 100) / 100;
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// mes no formato "AAAA-MM"
function filtrarPorMes(transacoes, mes) {
  return transacoes.filter((t) => t.data.startsWith(mes));
}

function resumir(transacoes) {
  let receitas = 0;
  let despesas = 0;
  for (const t of transacoes) {
    if (t.tipo === "receita") receitas += t.valor;
    else despesas += t.valor;
  }
  return {
    receitas: arredondar(receitas),
    despesas: arredondar(despesas),
    saldo: arredondar(receitas - despesas),
  };
}

function despesasPorCategoria(transacoes) {
  const totais = {};
  for (const t of transacoes) {
    if (t.tipo === "despesa") totais[t.categoria] = (totais[t.categoria] || 0) + t.valor;
  }
  return Object.entries(totais)
    .map(([categoria, total]) => ({ categoria, total: arredondar(total) }))
    .sort((a, b) => b.total - a.total);
}

// Retorna uma mensagem de erro ou null se estiver tudo certo.
function validar({ tipo, descricao, valor, categoria, data }) {
  if (!["receita", "despesa"].includes(tipo)) return "Escolha receita ou despesa.";
  if (!descricao || !descricao.trim()) return "Escreva uma descrição.";
  if (!Number.isFinite(valor) || valor <= 0) return "Informe um valor maior que zero.";
  if (!CATEGORIAS.includes(categoria)) return "Escolha uma categoria.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return "Informe uma data válida.";
  return null;
}

function escaparCSV(valor) {
  const texto = String(valor);
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// Separador ";" e vírgula decimal: abre direto no Excel em português.
function paraCSV(transacoes) {
  const linhas = transacoes.map((t) =>
    [t.data, t.descricao, t.tipo, t.categoria, String(t.valor).replace(".", ",")]
      .map(escaparCSV)
      .join(";")
  );
  return ["data;descricao;tipo;categoria;valor", ...linhas].join("\n");
}

// Compacta números para os eixos dos gráficos (ex.: 3,5 mil).
function formatarCompacto(valor) {
  return valor.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
}

// Receitas e despesas dos últimos N meses, terminando em mesFinal ("AAAA-MM").
function ultimosMeses(transacoes, mesFinal, quantidade = 6) {
  const [ano, mes] = mesFinal.split("-").map(Number);
  const resultado = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    const d = new Date(ano, mes - 1 - i, 1);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const { receitas, despesas } = resumir(filtrarPorMes(transacoes, chave));
    resultado.push({ mes: chave, receitas, despesas });
  }
  return resultado;
}

// Divide uma linha de CSV (separador ";") respeitando aspas.
function dividirLinha(linha) {
  const campos = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') { atual += '"'; i++; }
      else if (c === '"') aspas = false;
      else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === ";") { campos.push(atual); atual = ""; }
    else atual += c;
  }
  campos.push(atual);
  return campos;
}

// Lê o CSV gerado por paraCSV. A primeira linha (cabeçalho) é ignorada.
function lerCSV(texto) {
  const linhas = texto.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  const validas = [];
  let ignoradas = 0;
  for (const linha of linhas.slice(1)) {
    const [data, descricao, tipo, categoria, valor] = dividirLinha(linha);
    const t = { data, descricao, tipo, categoria, valor: parseFloat(String(valor).replace(",", ".")) };
    if (validar(t) === null) validas.push({ ...t, descricao: t.descricao.trim() });
    else ignoradas++;
  }
  return { validas, ignoradas };
}

// Permite usar o mesmo arquivo no navegador e nos testes (Node).
if (typeof module !== "undefined") {
  module.exports = { CATEGORIAS, formatarMoeda, filtrarPorMes, resumir, despesasPorCategoria, validar, paraCSV, lerCSV, ultimosMeses, formatarCompacto };
}
