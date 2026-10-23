const test = require("node:test");
const assert = require("node:assert/strict");
const { filtrarPorMes, resumir, despesasPorCategoria, validar, paraCSV, lerCSV, ultimosMeses } = require("./finance.js");

const dados = [
  { data: "2026-10-05", descricao: "Salário", tipo: "receita", categoria: "Salário", valor: 3000 },
  { data: "2026-10-07", descricao: "Mercado", tipo: "despesa", categoria: "Alimentação", valor: 450.5 },
  { data: "2026-10-10", descricao: "Ônibus", tipo: "despesa", categoria: "Transporte", valor: 120 },
  { data: "2026-09-30", descricao: "Cinema", tipo: "despesa", categoria: "Lazer", valor: 40 },
];

test("filtrarPorMes mantém só o mês pedido", () => {
  assert.equal(filtrarPorMes(dados, "2026-10").length, 3);
});

test("resumir calcula receitas, despesas e saldo", () => {
  assert.deepEqual(resumir(filtrarPorMes(dados, "2026-10")), {
    receitas: 3000,
    despesas: 570.5,
    saldo: 2429.5,
  });
});

test("resumir evita erro de ponto flutuante", () => {
  const r = resumir([
    { tipo: "despesa", valor: 0.1 },
    { tipo: "despesa", valor: 0.2 },
  ]);
  assert.equal(r.despesas, 0.3);
});

test("despesasPorCategoria ordena da maior para a menor", () => {
  const r = despesasPorCategoria(dados);
  assert.equal(r[0].categoria, "Alimentação");
  assert.equal(r.length, 3);
});

test("validar aceita dados corretos e recusa valor inválido", () => {
  const ok = { tipo: "despesa", descricao: "Café", valor: 8, categoria: "Alimentação", data: "2026-10-22" };
  assert.equal(validar(ok), null);
  assert.match(validar({ ...ok, valor: -1 }), /valor/i);
  assert.match(validar({ ...ok, descricao: "  " }), /descrição/i);
});

test("paraCSV escapa aspas e ponto e vírgula", () => {
  const csv = paraCSV([
    { data: "2026-10-01", descricao: 'Mercado "X"; frutas', tipo: "despesa", categoria: "Alimentação", valor: 12.5 },
  ]);
  assert.ok(csv.includes('"Mercado ""X""; frutas"'));
  assert.ok(csv.endsWith(";12,5"));
});

test("lerCSV recupera o que paraCSV exportou", () => {
  const { validas, ignoradas } = lerCSV("\uFEFF" + paraCSV(dados));
  assert.equal(ignoradas, 0);
  assert.deepEqual(validas, dados);
});

test("lerCSV preserva aspas e ponto e vírgula na descrição", () => {
  const original = [{ data: "2026-10-01", descricao: 'Mercado "X"; frutas', tipo: "despesa", categoria: "Alimentação", valor: 12.5 }];
  assert.deepEqual(lerCSV(paraCSV(original)).validas, original);
});

test("lerCSV ignora linhas inválidas e conta quantas foram", () => {
  const csv = "data;descricao;tipo;categoria;valor\n2026-10-01;Café;despesa;Alimentação;8\nlixo;;;;\n2026-10-02;Teste;despesa;Inexistente;5";
  const { validas, ignoradas } = lerCSV(csv);
  assert.equal(validas.length, 1);
  assert.equal(ignoradas, 2);
});

test("ultimosMeses devolve 6 meses terminando no mês pedido", () => {
  const r = ultimosMeses(dados, "2026-10", 6);
  assert.equal(r.length, 6);
  assert.equal(r[0].mes, "2026-05");
  assert.deepEqual(r[5], { mes: "2026-10", receitas: 3000, despesas: 570.5 });
  assert.equal(r[4].despesas, 40);
});

test("ultimosMeses atravessa a virada de ano", () => {
  const r = ultimosMeses([], "2026-02", 6);
  assert.equal(r[0].mes, "2025-09");
  assert.equal(r[5].mes, "2026-02");
});
