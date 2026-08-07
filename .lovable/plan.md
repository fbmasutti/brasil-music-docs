# Rider Técnico: mapa em aba própria, grade profissional e ícones novos

## 1. Rider com abas (Rider | Mapa de Palco)

O modal do rider passa a ter duas abas no topo:

- **Rider**: nome, formação, channel list e os detalhes avançados (mesa, P.A., monitores, luz, backline, hospitality).
- **Mapa de Palco**: paleta de elementos, grade e a lista de rótulos.

A aba do mapa mostra um contador ("7 elementos") para o usuário saber que existe conteúdo lá, e a lista de riders salvos ganha um botão direto "Mapa" que abre o modal já nessa aba. Assim o mapa deixa de depender de rolagem.

## 2. Grade maior e escala real dos objetos

- Grade passa de 5x3 para **9 colunas x 6 linhas**, com rolagem horizontal no celular e proporção de palco mantida.
- Cada elemento passa a ter um **porte físico** que define quantas células ele ocupa:
  - Pequeno (1 célula): DI, tomada/ponto de energia, microfone/voz, pedalboard, pandeiro.
  - Médio (2 células): monitor, cubo de guitarra, cajón, teclado, sax, trombone, violino.
  - Grande (4 células, 2x2): bateria, praticável, P.A./subwoofer, cubo de baixo, console.
- Arrastar continua igual (segura e solta), agora respeitando a área ocupada; se não couber, o elemento não é solto e um aviso curto aparece.
- Linhas de referência: "Fundo do palco" e "Plateia" seguem marcados, e a grade ganha marcação de meio de palco para alinhar bateria/voz principal, como no mapa de referência enviado.

## 3. PDF Retrato / Paisagem

- Na exportação do rider, escolha de **Retrato** (padrão) ou **Paisagem**.
- Em paisagem, o mapa aproveita a largura toda da folha — necessário para formações complexas na grade 9x6.
- O desenho exportado usa exatamente os mesmos ícones e proporções da tela.

## 4. Ícones

- Substituir por versões baseadas nos arquivos enviados: **violino, trombone, sax**.
- **Guitarra e baixo**: usar o desenho completo (corpo + cabeçote), não só o cabeçote.
- **Novos**: cajón, pedalboard (dois pedais, para usar junto da guitarra), **monitor esquerdo** e **monitor direito** (o "monitor/retorno" atual é redesenhado como cunha vista de cima, com versão L e R).
- Todos padronizados no mesmo traço/paleta dos ícones atuais, legíveis em tela escura e no papel branco.

## 5. Textos dos presets mais profissionais

Remover especificidades regionais dos presets: "Monitor mesa de samba" e "Mesa de samba central" passam a "Console / Mesa de Som" e "Praticável central", mantendo linguagem genérica e profissional em todos os presets.

## 6. Outros ajustes pedidos

- **Show (evento)**: ao fechar o formulário com alterações pendentes, aparece confirmação com **Salvar**, "Descartar" e "Continuar editando" — sem perder o que foi digitado.
- **Portfólio / Clipping**: campo de **link em primeiro lugar**, com preenchimento automático de título, imagem e data a partir do link (YouTube, Instagram, notícias) antes dos demais campos.
- **Repertório**: campo de **link externo sobe para o topo** do formulário, junto do título.
- **BrandKit**: fica para uma próxima rodada, como você indicou.

## Notas técnicas

- `src/components/StagePlot.tsx`: `COLS=9`/`ROWS=6`, novo campo `size: "sm" | "md" | "lg"` por tipo com `span` em células, colisão por área ocupada, e `StagePlotPrintable` parametrizado por orientação (retrato/paisagem) para a captura via html-to-image.
- `src/routes/_authenticated/riders.tsx`: `Tabs` no `DialogContent`, estado de aba inicial, seletor de orientação no fluxo de exportação, `downloadPdf` com a nova opção.
- `src/lib/pdf.ts`: `jsPDF` aceita `orientation` em `PdfDoc`; largura/altura de página e do bloco `image` calculadas a partir da orientação.
- Novos SVGs em `public/stage-icons/` (cajon, pedalboard, monitor-esquerdo, monitor-direito) e substituição de violino, trombone, sax, guitarra, baixo.
- `src/lib/rider-presets.ts`: ajuste de rótulos e textos.
- `src/components/EventFormDialog.tsx`: guarda de fechamento com estado "sujo".
- `src/routes/_authenticated/portfolio.tsx` e `repertorio.tsx`: reordenação dos campos e uso do helper de oEmbed já existente (`src/lib/oembed.ts`).
