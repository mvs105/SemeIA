# SemeIA - Contexto e diretivas do projeto

## 1. Finalidade deste arquivo

Este arquivo orienta qualquer pessoa ou agente de IA que trabalhe no projeto SemeIA. Antes de propor arquitetura, escrever codigo ou alterar o escopo, leia este documento e os materiais da pasta `../informacoes/`.

O projeto esta em fase inicial de prototipacao para um hackathon Build with Gemma. As decisoes devem favorecer uma demonstracao funcional, compreensivel e confiavel, sem tentar construir uma plataforma completa.

## 2. Identidade do projeto

- Nome oficial: **SemeIA**.
- Nome anterior: ColheAi. O nome anterior deve ser tratado apenas como referencia historica e nao deve aparecer na nova interface.
- Tema: agricultura familiar, comercializacao local e seguranca alimentar na Amazonia.
- Publico principal do MVP: agricultores familiares com conectividade limitada e diferentes niveis de letramento digital.
- Publicos secundarios: associacoes, cooperativas, consumidores e compradores institucionais.

## 3. Problema

Produtores familiares de comunidades amazonicas podem ter dificuldade para divulgar sua producao, reunir volume suficiente para atender compradores, coordenar entregas e utilizar sistemas digitais que dependem de internet constante ou formularios complexos.

Pequenas ofertas ficam pulverizadas. Um produtor pode possuir poucos quilos de um alimento, enquanto escolas, cooperativas e outros compradores precisam de lotes maiores, previsiveis e organizados.

## 4. Proposta de valor

O SemeIA e um assistente comunitario offline-first que ajuda agricultores familiares a registrar sua producao em linguagem natural, organizar ofertas e formar lotes coletivos que possam ser encontrados por compradores quando houver conectividade.

O diferencial do prototipo e a combinacao de:

1. registro simples em linguagem natural;
2. interpretacao da oferta pelo Gemma;
3. confirmacao humana antes da gravacao;
4. armazenamento local e operacao sem internet;
5. agrupamento de pequenas ofertas em lotes coletivos.

## 5. Demonstracao principal

O fluxo prioritario do hackathon deve permitir a seguinte demonstracao:

1. A conexao com a internet e desativada.
2. O produtor informa: "Tenho 30 quilos de macaxeira para entregar ate sexta na comunidade Val Paraíso".
3. O Gemma, quando o servico local estiver disponivel, interpreta a mensagem e devolve campos estruturados.
4. O aplicativo apresenta os campos para confirmacao e correcao.
5. A oferta e salva no aparelho.
6. A tela de ofertas continua funcionando sem internet.
7. Ofertas compativeis sao reunidas em um lote coletivo.
8. Quando houver um servico de sincronizacao, o aplicativo informa claramente se o registro esta apenas no aparelho ou sincronizado.

Nao alegar que a inferencia ocorre dentro de qualquer celular enquanto isso nao estiver implementado e comprovado. No primeiro prototipo, os dados funcionam offline no navegador e o Gemma pode ser executado localmente em um computador.

## 6. Escopo do MVP

### Incluido

- perfil local simplificado do produtor;
- registro de oferta por texto em linguagem natural;
- integracao com Gemma para extrair dados estruturados;
- formulario de confirmacao e correcao;
- persistencia local das ofertas;
- listagem, edicao e exclusao de ofertas locais;
- estado visivel de sincronizacao;
- agrupamento deterministico de ofertas compativeis;
- visualizacao simples de lotes para o perfil comprador;
- interface responsiva e instalavel como PWA;
- funcionamento das operacoes essenciais sem internet.

### Opcional, somente depois do fluxo principal funcionar

- captura de voz;
- sincronizacao entre dispositivos;
- autenticacao;
- geolocalizacao;
- notificacoes;
- painel separado para compradores;
- inferencia do Gemma diretamente no navegador ou celular.

### Fora do MVP

- pagamentos;
- roteamento completo de barcos ou caminhoes;
- integracao real com PNAE, PAA ou portais governamentais;
- renovacao automatica de documentos;
- emissao de certificacao organica;
- rastreabilidade completa por QR Code;
- mapas offline completos;
- treinamento ou fine-tuning do modelo;
- recomendacoes agronomicas de alto risco;
- diagnostico de pragas ou doencas;
- marketplace completo em producao.

## 7. Stack aprovada

### Frontend

- HTML semantico;
- CSS;
- JavaScript moderno, sem TypeScript nesta fase;
- Vite com template Vanilla;
- PWA por meio de `vite-plugin-pwa`/Workbox;
- IndexedDB por meio de Dexie.js.

### Backend

- Java;
- Spring Boot;
- API REST com JSON;
- integracao local com Ollama para executar um modelo Gemma pequeno;
- validacao rigorosa da resposta do modelo antes de devolve-la ao frontend.

### Decisoes de simplicidade

- Nao introduzir React, Angular, Vue, TypeScript, Tailwind ou microsservicos sem uma necessidade demonstrada e aprovada.
- Nao adicionar banco remoto antes de o fluxo local estar funcional.
- Nao exigir login para validar o primeiro fluxo.
- Nao usar Python na aplicacao principal. Python pode ser usado separadamente para experimentos, avaliacao de prompts ou preparacao de dados.
- Manter a integracao de IA atras de uma interface propria, permitindo trocar a implementacao local por uma futura implementacao no dispositivo.

## 8. Arquitetura inicial

```text
PWA (HTML/CSS/JavaScript)
  |-- Interface acessivel
  |-- Casos de uso
  |-- Repositorio local
  |-- IndexedDB/Dexie
  |-- Service Worker
  |
  `-- Cliente da API REST
        |
        `-- Spring Boot
              |-- Validacao de entrada e saida
              |-- Adaptador de IA
              `-- Ollama + Gemma local
```

O frontend deve continuar utilizavel quando o backend estiver indisponivel. A indisponibilidade da IA nao pode impedir o cadastro manual de uma oferta.

## 9. Papel correto do Gemma

O Gemma deve ser usado para interpretar linguagem natural e transformar a mensagem do produtor em uma proposta de dados estruturados. A resposta da IA nunca deve ser persistida ou publicada sem confirmacao do usuario.

Exemplo de entrada:

```text
Tenho 30 quilos de macaxeira para entregar ate sexta na comunidade Val Paraíso.
```

Formato esperado da resposta:

```json
{
  "produto": "macaxeira",
  "quantidade": 30,
  "unidade": "kg",
  "localidade": "Comunidade Val Paraíso",
  "disponivelAte": "data ISO ou null",
  "observacoes": null
}
```

Regras:

- Tratar a resposta do modelo como nao confiavel.
- Extrair e validar JSON no backend.
- Rejeitar quantidade negativa ou igual a zero.
- Trabalhar inicialmente com uma lista pequena de unidades aceitas.
- Converter datas relativas apenas quando houver uma data de referencia explicita.
- Quando um campo estiver ausente ou ambiguo, retornar `null` e pedir confirmacao ao usuario.
- Nao deixar o modelo calcular somas de lotes, precos ou regras de negocio.
- Formacao de lotes deve usar codigo deterministico e testavel.
- Nunca inventar certificacoes, origem, disponibilidade ou caracteristicas do produto.

## 10. Modelo de dominio inicial

### Produtor

- `id`
- `nome`
- `comunidade`
- `contato` opcional

### Oferta

- `id`
- `produtorId`
- `produto`
- `quantidade`
- `unidade`
- `localidade`
- `disponivelAte` opcional
- `observacoes` opcional
- `status`: rascunho, disponivel ou encerrada
- `syncStatus`: local, pendente ou sincronizada
- `criadaEm`
- `atualizadaEm`

### Lote coletivo

No MVP, o lote pode ser calculado a partir das ofertas e nao precisa ser uma entidade persistida. Agrupar somente ofertas:

- com o mesmo produto normalizado;
- com unidades compativeis;
- com status disponivel;
- dentro de um periodo e localidade definidos pelas regras do prototipo.

## 11. Requisitos nao funcionais iniciais

Estes requisitos ainda devem ser refinados e transformados em criterios mensuraveis:

- **Offline-first:** cadastro manual, consulta e edicao devem funcionar sem internet.
- **Tolerancia a falhas:** indisponibilidade do backend ou do Gemma nao deve causar perda do texto digitado.
- **Desempenho:** telas locais devem responder rapidamente em um celular intermediario.
- **Acessibilidade:** alvos de toque grandes, contraste adequado, rotulos claros e navegacao por teclado.
- **Simplicidade:** evitar termos tecnicos e formularios extensos.
- **Transparencia:** informar quando um dado foi sugerido pela IA e quando esta salvo apenas localmente.
- **Privacidade:** coletar somente os dados necessarios e evitar exposicao precisa da localizacao residencial.
- **Confiabilidade:** regras de quantidade e formacao de lotes devem ser deterministicas e testadas.
- **Compatibilidade:** priorizar navegadores Chromium recentes e layout responsivo para celular.
- **Manutenibilidade:** separar interface, regras de negocio, persistencia e integracao com IA.

## 12. Diretrizes de experiencia do usuario

- Interface e mensagens em portugues brasileiro.
- Usar frases curtas e linguagem cotidiana.
- Apresentar uma tarefa principal por tela.
- Sempre oferecer cadastro manual quando a IA falhar.
- Mostrar exemplos de como descrever uma oferta.
- Pedir confirmacao antes de salvar dados interpretados pela IA.
- Exibir claramente os estados: processando, salvo no aparelho, aguardando conexao, sincronizado e erro.
- Evitar depender somente de cores para comunicar estado.
- Nao presumir conectividade, GPS, camera ou microfone disponiveis.

## 13. Diretrizes de implementacao

- Entregar primeiro uma fatia vertical pequena e executavel.
- Comecar pelo fluxo manual com armazenamento local; depois conectar a IA.
- Manter commits e alteracoes pequenos e com uma finalidade clara.
- Nao adicionar dependencia sem explicar a necessidade.
- Fixar versoes de dependencias e nunca usar `latest` em codigo versionado.
- Manter segredos e configuracoes locais fora do repositorio.
- Fornecer `.env.example` quando surgirem variaveis de ambiente.
- Nao armazenar o modelo Gemma, arquivos grandes ou dados pessoais no Git.
- Usar dados ficticios na demonstracao e nos testes.
- Codigo pode usar identificadores em ingles; interface, documentacao de produto e mensagens ao usuario devem permanecer em portugues.
- Tratar datas, quantidades e unidades explicitamente; nao depender de formatacao implicita do navegador.
- Validar dados tanto no frontend quanto no backend.

## 14. Qualidade e verificacao

Antes de considerar o MVP pronto, verificar pelo menos:

1. O aplicativo abre e apresenta os dados previamente salvos sem internet.
2. Uma oferta pode ser criada manualmente com o backend desligado.
3. O texto digitado nao e perdido quando a chamada ao Gemma falha.
4. A resposta do Gemma passa por confirmacao humana.
5. JSON invalido ou incompleto do modelo nao quebra a interface.
6. Quantidades invalidas nao sao aceitas.
7. Ofertas compativeis formam um lote com soma correta.
8. Ofertas incompatíveis nao sao agrupadas.
9. O usuario consegue distinguir dados locais de dados sincronizados.
10. O fluxo principal funciona em largura de tela de celular.

Testes prioritarios:

- testes unitarios das regras de normalizacao e agrupamento;
- testes do parser/validador da resposta do Gemma;
- testes do repositorio IndexedDB;
- um teste de ponta a ponta do fluxo principal;
- teste manual com a rede desativada.

## 15. Materiais de contexto

Consultar a pasta `../informacoes/`, especialmente:

- `contexto.md`;
- `nuvem-de-ideia - estruturado.txt`;
- `nuvem-de-ideia.txt`;
- `semeIA-brainstorm03.jpg`;
- o artigo sobre agricultura familiar, feiras organicas e mercados digitais.

O artigo oferece sustentacao para o uso de canais digitais por agricultores familiares, mas seu estudo principal foi realizado no Parana com uma amostra pequena. Nao apresenta, sozinho, validacao suficiente para todas as comunidades amazonicas. Diferenciar sempre evidencia existente, hipotese de produto e decisao de prototipo.

## 16. Ordem recomendada do trabalho

1. Escrever a visao do produto e os limites do MVP.
2. Definir personas provisórias e hipoteses que exigem validacao.
3. Criar historias de usuario com criterios de aceitacao.
4. Tornar os requisitos nao funcionais mensuraveis.
5. Definir o contrato JSON entre frontend e backend.
6. Prototipar o fluxo principal sem IA real.
7. Implementar persistencia offline.
8. Integrar Spring Boot, Ollama e Gemma.
9. Implementar agrupamento deterministico de ofertas.
10. Testar o roteiro completo da demonstracao.

## 17. Criterio de decisao

Quando houver duvida entre duas implementacoes, escolher a que:

1. reduz o risco da demonstracao;
2. aproveita HTML, CSS, JavaScript e Java ja conhecidos pela equipe;
3. preserva o funcionamento offline dos dados;
4. torna visivel a contribuicao real do Gemma;
5. pode ser testada objetivamente;
6. evita promessas ainda nao comprovadas.

