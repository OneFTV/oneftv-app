# AILayoff.live — UI/UX Design Review

**Reviewer:** Web UI Designer
**Data:** Fevereiro 28, 2026
**URL:** https://ailayoffs.live
**Versão:** Prototype v0.2

---

## Resumo Geral

O site tem uma proposta de valor clara e um visual dark-mode moderno. A hierarquia de informação é boa — começa com KPIs de impacto, desce para tabela de empresas, mapa global, timeline, gráficos e notícias. No entanto, há vários problemas funcionais, de UX e oportunidades de melhoria significativas.

---

## BUGS / Coisas Quebradas

### 1. Links do Footer Quebrados (7 de 10)
Os seguintes links apontam para `#` e não levam a lugar nenhum:
- **Contact** → `#`
- **Careers** → `#`
- **Advertise** → `#`
- **Sponsorships** → `#`
- **Enterprise API** → `#`
- **Newsletter Premium** → `#`
- **Data Licensing** → `#`

**Recomendação:** Remover completamente ou marcar como "Coming Soon" (como já fazem com Methodology/Sources/API/About/Blog/Press Kit). Ter links que simplesmente voltam ao topo da página é uma experiência ruim e parece bugado.

### 2. News Cards Não São Clicáveis
Os 6 cards de notícias na seção "Latest News" **não possuem nenhum link**. São `<div>` puras sem `<a>` tag. O usuário espera poder clicar para ler a notícia completa.

**Recomendação:** Envolver cada card em um `<a>` que aponte para a fonte original (Bloomberg, Financial Times, etc.) ou criar páginas individuais de artigo.

### 3. Inconsistência "55 Companies" vs "59 Companies"
O badge no header da seção diz **"55 COMPANIES"**, mas o botão "Show All" diz **"59 companies"**. Esses números precisam ser consistentes.

### 4. Erro Gramatical no Footer — "1 companies"
Em "Jobs Lost by Country", vários países mostram **"1 companies"** ao invés de "1 company" (ex: United Kingdom, Ireland, Sweden, China, Israel). Falta tratamento de plural/singular.

---

## Problemas de UX / Design

### 5. Sem Navegação (Header/Navbar)
O site **não possui nenhuma barra de navegação**. É uma single page longa sem forma de pular para seções específicas. Não há como voltar ao topo facilmente (exceto scroll manual).

**Recomendação:** Adicionar uma navbar sticky com links de âncora para as seções: Tracker, Companies, Global Impact, Timeline, Charts, News.

### 6. Sem Botão "Back to Top"
Página muito longa sem facilidade de retorno.

### 7. Ticker Bar (Marquee de Empresas) Sem Interatividade
A barra rolante no meio da página (Amazon -27,000 / Intel -24,000 / Meta -21,000...) não é clicável. Seria útil poder clicar e ir direto para a empresa na tabela ou para a fonte.

### 8. Newsletter Form Sem Feedback
O formulário de email para newsletter não mostra nenhuma mensagem de sucesso/erro ao submeter. Não há validação visual de email inválido.

### 9. Tabela de Companies Sem Ordenação/Filtro
A tabela com 59 empresas não tem opções de:
- Ordenar por coluna (Jobs Cut, Date, Sector)
- Filtrar por setor
- Buscar por nome de empresa

**Recomendação:** Adicionar sort, filter e search para melhorar a usabilidade da tabela.

### 10. Gráfico "Monthly Tech Layoffs" Sem Labels de Barra
O gráfico de barras de layoffs mensais (2024-2025) não mostra o valor exato de cada barra. Falta tooltip on hover ou labels diretos.

### 11. Donut Chart "Top Sectors" Sem Porcentagens
O gráfico de donut mostra setores por cor mas não exibe valores ou porcentagens, tornando difícil comparar o tamanho relativo de cada fatia.

---

## Problemas de Responsividade (Mobile)

### 12. Tabela de Companies Truncada no Mobile
No mobile (375px), a tabela perde as colunas **Date** e **Source** completamente, e a coluna **AI Role** fica truncada com "...". Dados críticos ficam inacessíveis.

**Recomendação:** Usar card layout no mobile ao invés de tabela, ou implementar scroll horizontal com indicador visual.

### 13. Legenda do Donut Chart Cortada no Mobile
A legenda do gráfico "Top Sectors Affected by AI" é cortada — "Finance & Accounting" aparece como "Finance" apenas.

### 14. Bubble Chart "Global Impact" Perde Contexto
Os círculos sobrepostos no desktop ficam sem a visualização de proporção no mobile (viram cards simples), mas a seção de bubbles desaparece.

---

## Oportunidades de Melhoria

### 15. Adicionar Meta Tags OG / Twitter Cards
Para que o site tenha uma boa aparência ao ser compartilhado em redes sociais e gerar tráfego orgânico.

### 16. SEO — Falta de Conteúdo Textual
A página é muito visual (números, gráficos) mas tem pouco texto para indexação. Considerar adicionar parágrafos explicativos entre as seções.

### 17. Acessibilidade (a11y)
- Os gráficos (bar chart, donut chart, line chart) provavelmente não possuem `aria-label` ou texto alternativo
- As cores dos setores na tabela (Telecom = verde, Tech = azul) dependem apenas de cor, sem outro indicador visual
- Contraste do texto cinza claro sobre fundo escuro pode ser insuficiente em alguns elementos menores

### 18. Favicon e Branding
Verificar se há favicon personalizado. O título da aba é bom ("AILayoff.live — Real-Time AI Job Displacement Tracker").

### 19. Animações e Microinterações
Os cards de KPI no topo poderiam ter animação de contagem (count-up) ao carregar a página. Os gráficos poderiam ter transições suaves ao entrar na viewport.

### 20. "Coming Soon" Overload no Footer
São **6 itens** marcados como "Coming Soon" no footer (Methodology, Sources, API Access, Download Data, Submit a Report, About, Blog, Press Kit). Isso passa a impressão de que o produto está muito incompleto. Considerar remover itens que não serão implementados em breve.

### 21. Sem Dark/Light Mode Toggle
O site é exclusivamente dark mode. Alguns usuários preferem light mode, especialmente para leitura de dados/tabelas.

### 22. Performance — Página Única Muito Longa
Todo o conteúdo está em uma única página. Considerar lazy loading para gráficos e seções abaixo do fold.

---

## Prioridades Sugeridas

| Prioridade | Item | Impacto |
|------------|------|---------|
| **P0 - Crítico** | Links do footer quebrados (#1) | Parece bugado |
| **P0 - Crítico** | News cards não clicáveis (#2) | Frustra o usuário |
| **P0 - Crítico** | Erro "1 companies" (#4) | Parece amador |
| **P1 - Alto** | Adicionar navbar (#5) | Navegabilidade |
| **P1 - Alto** | Tabela mobile truncada (#12) | Usabilidade mobile |
| **P1 - Alto** | Inconsistência 55 vs 59 (#3) | Credibilidade |
| **P2 - Médio** | Sort/Filter na tabela (#9) | Power users |
| **P2 - Médio** | Tooltips nos gráficos (#10, #11) | Legibilidade |
| **P2 - Médio** | Newsletter feedback (#8) | UX do form |
| **P3 - Baixo** | Animações (#19) | Polish |
| **P3 - Baixo** | Light mode (#21) | Preferência |
| **P3 - Baixo** | Limpar "Coming Soon" (#20) | Percepção |
