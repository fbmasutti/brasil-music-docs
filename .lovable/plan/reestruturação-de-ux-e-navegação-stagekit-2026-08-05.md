# Reestruturação de UX e navegação — StageKit

## 1. Wizard inicial (/comecar) enxuto

Hoje o wizard tem 4 passos (perfil, formação, equipe, primeiro show). Passa a ter **2 passos**, só com o que é permanente do artista:

1. **Quem você é** — nome artístico, CPF/CNPJ, cidade/UF, WhatsApp. (único obrigatório: nome artístico)
2. **Identidade visual (Brand Kit)** — escolha de preset de cores + upload de logo/foto (ambos opcionais, com um preset já pré-selecionado).

Sai do wizard: formação, equipe e primeiro show. Nada mais bloqueia o uso do app — o toolkit fica liberado sem contratante nem evento cadastrado.

Ao concluir, a tela final deixa de ser um "parabéns" genérico e passa a ser um **painel de ferramentas**: Gerar contrato, Rider & Mapa de Palco, Gerador de Posts, Importar do WhatsApp.

## 2. Dashboard focado em toolkit

- Novo bloco **"Ferramentas do dia a dia"** no topo (acima da agenda): Gerar Contrato · Rider & Mapa de Palco · Gerador de Posts · Importar do WhatsApp · Recibo/RPA · Roteiro ECAD.
- "Primeiros passos" reduz para 2 itens (perfil + identidade visual), aparecendo só enquanto incompleto, e deixa de competir visualmente com as ferramentas.
- A grade de QuickCards atual (6 cartões redundantes) é substituída por uma faixa compacta de links secundários, para o painel não repetir o menu.

## 3. Menu reorganizado

Renomeações: "Formações & Presets" → **Formações**; "Gerador de Cards" → **Gerador de Posts**.

Nova estrutura da sidebar:

```text
Dashboard
Importar do WhatsApp
Agenda de Shows
Financeiro & Cachês
Documentos                (submenu)
  ├ Contratos & Recibos
  ├ Rider & Mapa de Palco
  └ ECAD & Direitos Autorais
Divulgação                (submenu)
  ├ Gerador de Posts
  ├ Marca & Brand Kit
  └ Comprovação & Portfólio
Cadastros                 (submenu, recolhido)
  ├ Formações
  ├ Equipe
  ├ Contratantes
  └ Dados do Artista
```

Cada grupo abre/fecha, abre sozinho quando a rota ativa está dentro dele, e o estado fica salvo no navegador (como já acontece hoje com "Ferramentas Avançadas").

## 4. Fricção zero nos fluxos

**Rider & Mapa de Palco (prioridade alta)**

- Entrada por presets: escolher "Voz + Violão", "Trio", "Banda Completa" ou "Samba/Pagode" já cria um rider pronto, com nome automático, e gera PDF em um clique — sem passar por formulário.
- Único campo obrigatório vira o nome (com sugestão automática). Som, luz, backline, hospitality e rooming list vão para um bloco recolhido "Detalhes avançados (opcional)".
- Editar um rider existente passa a ser possível na própria tela (hoje só cria e remove).

**Reserva financeira / Fundo de manutenção**

- Substituir o formulário atual por uma linha única: valor + botão "Guardar". Motivo e vínculo com evento ficam opcionais atrás de um toggle.
- Botões de atalho de percentual (5% / 10% do cachê) e um card único com saldo atual + histórico enxuto.

**Regra geral de formulários**

- Todo formulário de cadastro (contratante, integrante, obra, formação, evento) mostra apenas o mínimo para salvar; o resto vai para "+ Adicionar dados avançados (opcional)".
- Nenhuma ação é bloqueada por campo secundário vazio; o PDF já omite dados ausentes com elegância.

## Detalhes técnicos

- `src/components/layout/AppLayout.tsx`: nav vira lista de grupos (`NavGroup[]`) com `Collapsible` por grupo e persistência por chave em `localStorage`.
- `src/routes/_authenticated/comecar.tsx`: reduzido a 2 passos; passo Brand Kit reaproveita presets de `src/lib/brand-presets.ts` e o upload de `src/lib/storage.ts`.
- `src/routes/_authenticated/dashboard.tsx`: novo componente `ToolStrip`; `gettingStarted` reduzido; QuickCards compactados.
- `src/routes/_authenticated/riders.tsx`: criação por preset em 1 clique, campos avançados em `Collapsible`, suporte a edição (`useUpdate`).
- `src/routes/_authenticated/financeiro.tsx`: bloco de reserva reescrito como entrada rápida.
- Sem mudanças de banco de dados — o schema atual já suporta tudo.
