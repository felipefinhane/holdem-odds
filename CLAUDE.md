# Holdem Odds

App para celular, usado **ao vivo na mesa de poker**: o usuário marca as cartas e o app mostra equity, recomendação de jogada e pot odds. Funcionalidades, fórmulas e estrutura de pastas estão no `README.md`; comandos em `package.json` (pnpm).

O usuário conversa em português. Toda interface, comentário de código e mensagem de commit em **pt-BR** (commits no formato `feat:` / `fix:` / `docs:` / `chore:`).

## Arquitetura

- `src/lib/` é o motor: TypeScript puro, sem React, testado com Vitest. Toda mudança de regra de cálculo vem com teste.
- `src/components/` e `App.tsx` são a interface. Mobile-first, largura máxima 430px, alvos de toque ≥ 44px.
- A simulação roda num Web Worker (`equity.worker.ts`). O estado salvo vai para o `localStorage` via `useStoredState`, sempre com validador, porque formatos antigos salvos voltam ao padrão.

## Decisões de cálculo (e por quê)

- **Pot odds conta todos os adversários.** A equity é simulada com os N adversários indo até o river, então cada um também coloca a aposta no pote: `pote + aposta × N + seu call`. Contar só um adversário mandava foldar JJ pagando 1 BB contra 3 ou mais.
- **Pote vazio antes do flop vale os blinds** (SB + BB). O campo mostra isso no placeholder.
- **Adversários têm mãos aleatórias.** A equity é otimista; o aviso disso aparece no rodapé do app e no README. Não remova.
- **A recomendação (`advice.ts`) é uma heurística didática, não GTO.** Ela compara a equity com a parte justa (`1 ÷ jogadores`). O usuário sabe disso.
- **Apostas sugeridas viram fichas reais** (`table.ts`): são arredondadas para a menor ficha, limitadas ao stack (virando all-in) e montadas com o menor número de fichas, por programação dinâmica, porque o método guloso falha com valores arbitrários.

## Privacidade (modo esconder)

O celular fica em cima da mesa, à vista dos outros jogadores. Regras que o usuário validou:

- **Esconder é sempre um toque.** Mostrar usa o gesto configurado: um toque, toque duplo ou segurar 500 ms. Depois de mostrar, **fica aberto**.
- O usuário **rejeitou "segurar para espiar"** (mostrar só enquanto o dedo está pressionado), porque impede rolar a tela e digitar apostas.
- O esconder automático conta inatividade: qualquer toque, rolagem ou digitação recomeça a contagem. Também esconde quando a tela apaga (`visibilitychange`).
- Com tudo escondido, os espaços **vazios** da mão do usuário continuam tocáveis (não revelam nada); cartas já escolhidas aparecem viradas.

## Design

- O visual "Felt Pro" foi criado no **Google Stitch**. Os tokens ficam em `src/index.css` (`@theme`); as fontes são Space Grotesk (títulos e números) e Hanken Grotesk (texto); o baralho é de 4 cores.
- O usuário manda os designs como zip exportado do Stitch. O Stitch **duplica telas a cada prompt**: identifique a versão mais recente pelo conteúdo e confirme com o usuário se houver dúvida. Extraia o zip numa pasta temporária, nunca no projeto.
- Ficaram de fora, de propósito, coisas que o Stitch inventou: barra inferior (Ranges/Histórico/EV Analytics), avatar de perfil, "Modo 6-Max", botão "Confirmar carta" (o seletor confirma sozinho no segundo toque, porque é mais rápido) e "Confirmar ALL-IN".
- Os ícones vêm do `lucide-react`, e não da fonte Material Symbols do Stitch, que pesa centenas de KB.

## Verificação visual

Rode `pnpm build && pnpm preview` e use um navegador headless com tela de celular (390×844, `isMobile`). Não há Playwright no projeto: use `playwright-core` de `~/src/simplepoker/node_modules` com `executablePath: '/usr/bin/chromium'`. Pegadinhas:

- O seletor de cartas abre sozinho ao carregar a página (feche ou escolha as cartas primeiro).
- Rótulos em maiúsculas via CSS: `innerText` devolve maiúsculas, então compare sem diferenciar maiúsculas de minúsculas.
- O cabeçalho é fixo: em screenshots `fullPage` ele aparece no meio da imagem.
- Para testar timers (toque duplo, esconder automático), use `page.clock.install()` e `runFor`.

## Deploy

Cada push na `main` publica automaticamente na Vercel (integração com o GitHub `felipefinhane/holdem-odds`). A URL é **https://holdem-odds-opal.vercel.app**; `holdem-odds.vercel.app` pertence a outra pessoa. Para confirmar que uma versão está no ar, procure um texto novo dentro do bundle JS publicado.

## Pendências

- O zip `stitch_texas_holdem_odds_calculator.zip` está na raiz, fora do git. O usuário ainda não decidiu se apaga ou se guarda as telas em `docs/design`.
- Ideias oferecidas e ainda não pedidas: faixa de mãos do adversário (equity mais realista) e recomendação mais agressiva antes do flop com pares altos.
