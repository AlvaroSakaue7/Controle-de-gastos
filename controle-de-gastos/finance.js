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

// Permite usar o mesmo arquivo no navegador e nos testes (Node).
if (typeof module !== "undefined") {
  module.exports = { CATEGORIAS, formatarMoeda, filtrarPorMes, resumir, despesasPorCategoria, validar, paraCSV };
}
