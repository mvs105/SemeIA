# Requisitos não funcionais mensuráveis

Este documento transforma as diretrizes do MVP em critérios que podem ser verificados. Os números são metas do protótipo de hackathon, não garantias de produção, e devem ser revistos depois de testes com pessoas e aparelhos reais.

## Ambiente de referência

- navegador: versão estável recente do Chrome ou Chromium;
- larguras móveis: 320, 360, 390 e 430 pixels;
- massa local: 100 ofertas fictícias, das quais pelo menos 20 formam lotes;
- rede: perfis `Offline` e `Fast 3G` das ferramentas do navegador;
- API local: disponível em `localhost` durante o teste de IA e desligada durante os testes offline;
- dados: somente dados fictícios, sem nomes, contatos ou endereços residenciais reais.

As medições automatizadas devem registrar navegador, versão, sistema operacional e configuração usada. Um teste manual em celular intermediário continua obrigatório antes da apresentação.

## RNF-01 — Operações essenciais offline

Depois de um primeiro carregamento online que instale o service worker, o aplicativo deve, com a rede e a API desligadas:

1. abrir novamente sem tela de erro;
2. listar as ofertas já gravadas no IndexedDB;
3. criar, editar e excluir uma oferta;
4. preservar as alterações após fechar e reabrir a aba;
5. calcular os lotes a partir dos dados locais.

**Critério de aprovação:** os cinco passos passam no roteiro manual em duas execuções consecutivas. A interface não pode afirmar que funciona antes do primeiro carregamento e da instalação do cache.

## RNF-02 — Tolerância à falha da IA

Se a API demorar mais que 10 segundos, estiver indisponível ou devolver uma resposta inválida:

- o texto original permanece visível e editável;
- nenhum campo já preenchido é apagado;
- a espera termina com mensagem em português e ação para continuar manualmente;
- nenhuma oferta parcial é gravada automaticamente;
- uma nova tentativa pode ser feita por ação explícita.

**Critério de aprovação:** testes automatizados cobrem timeout, falha de rede, HTTP 503 e JSON inválido; todos preservam integralmente o texto digitado.

## RNF-03 — Desempenho local

Com a massa de referência e após o carregamento inicial:

- abrir a lista local, salvar uma oferta e recalcular os lotes deve apresentar o resultado em até 1 segundo em pelo menos 95% de 20 repetições;
- uma ação do usuário deve mostrar resposta visual, como estado de carregamento, em até 100 milissegundos;
- os recursos essenciais do primeiro carregamento comprimido devem totalizar no máximo 500 KB, sem contar fontes do sistema e ferramentas de desenvolvimento.

**Critério de aprovação:** script de medição ou relatório reproduzível registra os resultados, e o roteiro é repetido ao menos uma vez no celular usado na demonstração.

## RNF-04 — Acessibilidade

- atender aos critérios aplicáveis de nível AA da WCAG 2.2 nas telas do fluxo principal;
- manter contraste mínimo de 4,5:1 para texto comum e 3:1 para texto grande e componentes gráficos essenciais;
- fornecer nome acessível e rótulo visível a todos os campos e controles;
- permitir concluir o fluxo principal somente com teclado, com foco visível e ordem coerente;
- usar alvos de toque de pelo menos 44 por 44 pixels nas ações principais;
- associar mensagens de erro ao campo e anunciá-las por tecnologia assistiva;
- nunca comunicar status somente por cor.

**Critério de aprovação:** zero erro crítico ou sério no axe sobre as telas do fluxo principal, mais inspeção manual de teclado, zoom de 200% e leitor de tela.

## RNF-05 — Simplicidade e compreensão

- cada tela possui uma ação principal claramente identificada;
- rótulos e mensagens voltados à pessoa usuária ficam em português brasileiro e evitam termos como JSON, endpoint e IndexedDB;
- o formulário manual apresenta no máximo seis campos da oferta, além das ações;
- a tela de texto inclui um exemplo próximo do roteiro da demonstração.

**Critério de aprovação:** pelo menos 4 de 5 participantes representativos concluem o cadastro manual sem ajuda em até 3 minutos. Dificuldades e termos incompreendidos são registrados para revisão.

## RNF-06 — Transparência sobre IA e sincronização

- antes de salvar, campos preenchidos pela IA exibem “Sugestão da IA — confira antes de salvar”;
- salvar exige ação explícita da pessoa;
- toda oferta exibe um rótulo textual de estado;
- enquanto não existir serviço de sincronização, novas ofertas exibem apenas “Salva neste aparelho” e usam `syncStatus: "local"`;
- a interface não exibe “sincronizada” nem “aguardando conexão” sem uma implementação real que sustente esses estados;
- indisponibilidade da IA não é descrita como indisponibilidade do armazenamento local.

**Critério de aprovação:** 5 de 5 participantes percebem que devem confirmar a sugestão, e pelo menos 4 de 5 identificam que a oferta está somente no aparelho.

## RNF-07 — Privacidade e minimização

- não solicitar GPS, câmera, microfone, documento, endereço residencial preciso ou credencial no fluxo principal;
- contato do produtor é opcional e permanece local no MVP;
- enviar à API de IA somente o texto da oferta e, quando necessário, uma data de referência explícita;
- não registrar em logs o texto integral da oferta nem dados do perfil;
- exemplos, testes e demonstrações usam dados fictícios;
- nenhuma telemetria ou serviço de terceiros é incluído sem decisão documentada.

**Critério de aprovação:** inspeção das permissões do navegador, tráfego de rede e logs confirma que nenhum dado além do contrato documentado foi transmitido.

## RNF-08 — Confiabilidade das regras

- quantidade zero, negativa, não numérica ou acima do limite definido deve ser rejeitada;
- normalização, conversão de unidades e agrupamento são funções determinísticas, sem chamada ao modelo;
- a mesma coleção de ofertas sempre produz os mesmos lotes, independentemente da ordem de entrada;
- falha ao ler ou gravar no IndexedDB produz mensagem explícita e não informa sucesso;
- resposta da IA nunca é persistida antes da confirmação humana.

**Critério de aprovação:** 100% dos testes unitários de valores-limite, compatibilidade e invariância de ordem passam; o fluxo de confirmação possui teste de ponta a ponta.

## RNF-09 — Compatibilidade e responsividade

- priorizar a versão estável atual e as duas versões estáveis anteriores de navegadores Chromium;
- não apresentar rolagem horizontal nas larguras móveis de referência com zoom de 100%;
- manter conteúdo e ações utilizáveis com zoom de 200%;
- exibir uma orientação clara caso APIs obrigatórias, como IndexedDB, não estejam disponíveis.

**Critério de aprovação:** matriz manual registra os resultados nas larguras e versões disponíveis antes da entrega.

## RNF-10 — Manutenibilidade

- separar interface, casos de uso, regras de domínio, persistência e cliente HTTP em módulos distintos;
- regras de agrupamento não importam DOM, Dexie ou cliente HTTP;
- acesso ao Gemma ocorre atrás de uma interface do backend, sem dependência de Ollama nos controladores REST;
- versões de produção são fixadas pelo arquivo de lock do frontend e pelo gerenciador do backend;
- nenhuma dependência nova é aceita sem necessidade e alternativa consideradas no registro da alteração.

**Critério de aprovação:** testes de domínio executam sem navegador, banco ou Ollama; build e testes partem de uma instalação limpa usando os arquivos versionados.

## Evidências mínimas antes da demonstração

- saída dos testes do frontend e do backend;
- resultado do build de produção;
- roteiro manual offline preenchido;
- captura da tela em largura móvel;
- registro do modelo Gemma e da configuração do Ollama usados;
- lista explícita de limitações encontradas.
