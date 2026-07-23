# SemeIA

O SemeIA ajuda agricultores familiares a registrar ofertas e reunir pequenas quantidades em lotes coletivos. O navegador guarda os dados no próprio aparelho; o servidor Node.js usa o Gemma local via Ollama para sugerir o preenchimento de uma oferta.

> A IA apenas sugere campos. A pessoa sempre revisa e confirma antes de salvar.

## O que já funciona

- perfil local simplificado;
- cadastro manual e interpretação opcional de texto;
- confirmação e correção antes da gravação;
- criação, edição e exclusão de ofertas no IndexedDB;
- indicação explícita de que os dados estão somente no aparelho;
- lotes calculados por produto, unidade compatível, comunidade e semana;
- PWA responsiva e preparada para cache offline após o primeiro carregamento;
- API Node.js/Express com validação rigorosa e adaptador local para Ollama/Gemma;
- testes das regras de domínio, persistência local, fluxo principal e parser da IA.

## Estrutura

```text
frontend/          PWA Vanilla com Vite, Dexie, Workbox e identidade visual oficial
server.js          Servidor Express e endpoints da API (/api/v1/interpretacoes)
server/             Interpretador local com Ollama/Gemma
```

## Executar a aplicação

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

A aplicação (frontend PWA + backend Node.js) roda na mesma porta (3000) e disponibiliza a API `/api/v1/interpretacoes`.

## Executar a interpretação com Gemma

O projeto usa somente o modelo local `gemma2:2b` por meio do Ollama. Com o Ollama iniciado e esse modelo instalado, execute normalmente `npm run dev`. Por padrão, o servidor acessa `http://127.0.0.1:11434`.

As variáveis `OLLAMA_BASE_URL`, `OLLAMA_MODEL` e `OLLAMA_TIMEOUT` permitem substituir os valores padrão no ambiente do processo. Se o Ollama ou o Gemma estiver indisponível, a interface informa o erro e mantém o texto para preenchimento manual; não existe interpretação simulada.

### Onde e como o Gemma é aplicado

1. O botão **Extrair com Gemma** chama `interpretText()` em `frontend/src/main.js`.
2. `frontend/src/services/interpretation.js` envia o texto e a data de referência para `POST /api/v1/interpretacoes`.
3. A rota em `server.js` valida a entrada e chama exclusivamente `interpretWithOllama()`.
4. `server/interpreter.js` monta o prompt e envia uma requisição para `http://127.0.0.1:11434/api/generate`, selecionando `gemma2:2b`, sem streaming e exigindo JSON.
5. O Gemma extrai `produto`, `quantidade`, `unidade`, `localidade`, `disponivelAte` e `observacoes`. O backend valida todos os campos e resolve expressões simples de calendário de forma determinística.
6. O frontend valida novamente a resposta e apenas preenche o formulário. A oferta só é gravada depois da revisão e confirmação da pessoa.

Os arquivos do modelo não ficam neste repositório. O Ollama os mantém no computador, normalmente em `C:\Users\<usuário>\.ollama\models` no Windows.

## Verificações

```bash
npm test
npm run build
```

## Limites atuais

- Os dados offline ficam no navegador, não em todos os celulares automaticamente.
- O Gemma roda no computador onde o Ollama está instalado; inferência no celular ainda não foi comprovada.
- Não existe sincronização entre dispositivos neste protótipo. Por isso, novas ofertas aparecem como “salvas neste aparelho”.
- Personas e necessidades amazônicas descritas aqui são hipóteses de produto a validar em campo.
- A inferência depende do Ollama e do modelo Gemma instalados no computador que executa o servidor.
