# Controle de Gastos

Aplicação web para controlar receitas e despesas por mês, feita com **HTML, CSS e JavaScript puro**. Mostra o saldo, um gráfico de despesas por categoria e permite exportar os lançamentos em CSV. Os dados ficam salvos no navegador.

**Demo:** `https://AlvaroSakaue7.github.io/Controle-de-gastos/` *(troque depois de publicar)*

## Funcionalidades

- Lançamento de receitas e despesas com descrição, valor, categoria e data
- Edição de lançamentos (o formulário é reaproveitado)
- Navegação por mês, com saldo, total de receitas e total de despesas
- Gráfico de rosca das despesas por categoria: passe o mouse para ver o valor e clique para filtrar a tabela
- Gráfico de barras com receitas e despesas dos últimos 6 meses: clique em um mês para abri-lo
- Gráficos feitos em SVG puro, sem bibliotecas
- Exportação do mês em CSV (abre direto no Excel em português)
- Importação de CSV, ignorando linhas inválidas e lançamentos repetidos
- Tema claro e escuro (segue o sistema na primeira visita e lembra a sua escolha)
- Validação dos dados e mensagens de erro claras
- Persistência com `localStorage`
- Layout responsivo e acessível (foco visível, rótulos para leitores de tela)

## Como rodar

```bash
git clone https://github.com/AlvaroSakaue7/Controle-de-gastos.git
cd Controle-de-gastos
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

- [x] Editar lançamentos
- [ ] Meta de gasto por categoria, com alerta
- [x] Importar CSV
- [x] Tema escuro
- [x] Gráfico dos últimos meses
- [ ] Gráfico de evolução do saldo dia a dia

## Licença

MIT. Veja [LICENSE](LICENSE).
