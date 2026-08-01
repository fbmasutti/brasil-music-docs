## StageDocs — Melhorias de fluxo e geração de documentos

### 1. Criação rápida de Contratante (inline)
- Novo componente `QuickAddClientDialog` (slide-over/dialog) com campos mínimos: Nome, CPF/CNPJ, E-mail, Telefone.
- Botão "+ Novo Contratante" ao lado do select de contratante em:
  - Central de Documentos (`documentos.tsx`)
  - Agenda de shows (`eventos.index.tsx`)
- Ao salvar, insere em `clients`, invalida a query e seleciona automaticamente o novo id — o formulário aberto não é resetado (estado do formulário fica intacto porque o dialog é um componente irmão controlado).

### 2. Rider: Assistente de Configuração + Mapa de Palco visual
- **Presets** (arquivo novo `src/lib/rider-presets.ts`): "Voz + Violão", "Trio Acústico", "Banda Completa com Bateria", "Samba/Pagode". Cada preset traz uma channel list pronta e um conjunto de elementos de palco posicionados.
- Botão "Assistente de Configuração" no módulo Riders abre seleção de preset e preenche a channel list (editável depois) e o stage plot.
- **Mapa de palco visual**: novo componente `StagePlot` renderizando uma grade de palco com ícones SVG (microfone, amplificador, bateria, monitor/retorno, teclado, tomada/AC, praticável). Elementos podem ser adicionados, reposicionados por drag-and-drop em grade e removidos; posições salvas no campo `stage_plot` (jsonb já existente em `technical_riders`).
- O PDF do rider ganha uma seção "Mapa de palco" desenhada com formas/labels no jsPDF, alinhada às posições da grade.

### 3. Motor de texto flexível no PDF
- Novo helper em `src/lib/documents.ts`: montagem de frases condicionais (ex.: `phrase([...])` que descarta segmentos vazios e limpa vírgulas/espaços duplicados).
- Regras aplicadas:
  - `kv`: linhas com valor vazio são omitidas em vez de imprimir "—".
  - Cláusulas e parágrafos: quando CNPJ/CPF, endereço, PIX ou datas faltarem, o segmento correspondente ("inscrito no CNPJ nº …", "até <data>", "via PIX …") é removido, mantendo a frase gramaticalmente correta.
  - Nenhum "____________" ou "—" gerado automaticamente; só permanece onde é campo de assinatura manual.
- Aplicado a todos os templates (contrato, anuência, RPA, cessão, split sheet, declarações) e ao rider.

### 4. Workflows prioritários no Dashboard
- Bloco destacado "Ações rápidas" no topo do painel com dois cartões:
  1. **Gerador de Contrato de Show** → abre a Central de Documentos já com o template de contrato selecionado (via search param) e cláusulas padrão de cancelamento/W.O. e responsabilidade de ECAD pré-preenchidas.
  2. **Gerador de Roteiro ECAD** → nova tela/rota dedicada que lista shows realizados, monta o roteiro de execução a partir da setlist e exporta **PDF e CSV** no formato de envio às associações (UBC/ABRAMUS/SBACEM), com colunas: obra, autores, %, ISRC/ISWC, duração, local, data, horário.
- Marcar o evento como `ecad_sent` diretamente da tela do roteiro.

### 5. Auth e RLS (auditoria)
- Login/cadastro por e-mail+senha e Google OAuth já estão implementados via Cloud Auth; verificar o botão Google e o retorno de sessão.
- Auditoria: confirmar que todas as tabelas têm política ligada a `auth.uid()` e que os inserts sempre gravam `user_id` do usuário autenticado (hooks de escrita centralizados em `src/lib/queries.ts`).
- Corrigir qualquer insert que não preencha `user_id`.

### Detalhes técnicos
- Arquivos novos: `src/components/QuickAddClientDialog.tsx`, `src/components/StagePlot.tsx`, `src/lib/rider-presets.ts`, `src/lib/ecad-export.ts`, rota `src/routes/_authenticated/ecad.tsx`.
- Arquivos alterados: `documentos.tsx`, `eventos.index.tsx`, `riders.tsx`, `dashboard.tsx`, `lib/documents.ts`, `lib/pdf.ts` (bloco de mapa de palco + omissão de valores vazios), `components/layout/AppLayout.tsx` (item de menu ECAD).
- Sem mudanças de schema: `stage_plot`/`channel_list` (jsonb) e `events.ecad_sent` já existem.
