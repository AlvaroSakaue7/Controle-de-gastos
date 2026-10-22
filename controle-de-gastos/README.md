# Controle de Gastos

Aplicação web para controlar receitas e despesas por mês, feita com **HTML, CSS e JavaScript puro**. Mostra o saldo, um gráfico de despesas por categoria e permite exportar os lançamentos em CSV. Os dados ficam salvos no navegador.

**Demo:** `https://SEU-USUARIO.github.io/controle-de-gastos/` *(troque depois de publicar)*

![Tela do app](docs/screenshot.png) *(adicione um print em `docs/screenshot.png`)*

## Funcionalidades

- Lançamento de receitas e despesas com descrição, valor, categoria e data
- Navegação por mês, com saldo, total de receitas e total de despesas
- Gráfico de barras por categoria, ordenado da maior despesa para a menor
- Exportação do mês em CSV (abre direto no Excel em português)
- Validação dos dados e mensagens de erro claras
- Persistência com `localStorage`
- Layout responsivo e acessível (foco visível, rótulos para leitores de tela)

## Como rodar

```bash
git clone https://github.com/SEU-USUARIO/controle-de-gastos.git
cd controle-de-gastos
```

Abra o `index.html` no navegador. Não há nada para instalar.

## Testes

As regras de negócio ficam em `finance.js`, separadas da interface, e têm testes automatizados com o executor nativo do Node (precisa do Node 18 ou mais novo):

```bash
npm test
```

O workflow em `.github/workflows/test.yml` roda os testes a cada push e pull request.

## Estrutura

```
controle-de-gastos/
├── index.html          # estrutura da página
├── style.css           # visual
├── finance.js          # regras: resumo, filtro, validação, CSV
├── app.js              # interface: DOM, eventos, armazenamento
├── finance.test.js     # testes das regras
├── package.json
└── .github/workflows/  # integração contínua
```

## Decisões de projeto

- **Lógica separada da interface:** `finance.js` não toca no DOM, por isso é testável em Node.
- **Valores arredondados a cada soma:** evita erros como `0.1 + 0.2 = 0.30000000000000004`.
- **`textContent` em vez de `innerHTML`:** impede injeção de HTML pelos textos digitados.

## Ideias para evoluir

- [ ] Editar lançamentos
- [ ] Meta de gasto por categoria, com alerta
- [ ] Importar CSV
- [ ] Tema escuro
- [ ] Gráfico de evolução do saldo ao longo dos meses

## Licença

MIT. Veja [LICENSE](LICENSE).
