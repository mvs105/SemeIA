![Capa do SemeIA](frontend/public/assets/semeia/capa-readme.png)

# SemeIA

O SemeIA é um assistente comunitário para agricultores familiares da Amazônia. A aplicação transforma descrições cotidianas da produção em ofertas estruturadas e ajuda a reunir pequenas quantidades em lotes coletivos.

> O Gemma sugere os campos; a pessoa sempre revisa e confirma antes de salvar.

## Como funciona

1. O produtor descreve sua oferta em português, como: “Tenho 30 quilos de macaxeira para entregar até sexta na comunidade Val Paraíso”.
2. O `gemma2:2b`, executado localmente pelo Ollama, extrai produto, quantidade, unidade, localidade, prazo e observações.
3. O backend valida a resposta e a interface apresenta os campos para revisão.
4. Após a confirmação, a oferta é armazenada no navegador.
5. Regras determinísticas agrupam ofertas compatíveis em lotes coletivos.

O cadastro e a consulta de ofertas usam IndexedDB e continuam disponíveis sem conexão. A indisponibilidade do Gemma não impede o preenchimento manual.

## Arquitetura

`PWA → API Node.js/Express → Ollama → Gemma 2 2B → validação → revisão humana → IndexedDB`

- **Frontend:** HTML, CSS, JavaScript, Vite e Dexie.
- **Backend:** Node.js e Express.
- **IA:** `gemma2:2b` local, sem API de IA em nuvem.
- **Dados:** perfil e ofertas armazenados no próprio navegador.

O Gemma é aplicado exclusivamente à interpretação da linguagem natural. Validação, datas, persistência e formação de lotes permanecem sob regras convencionais e testáveis.

## Executar localmente

Requisitos: Node.js 20+, Ollama e o modelo `gemma2:2b`.

```bash
ollama pull gemma2:2b
npm install
npm run dev
```

Abra `http://localhost:3000`. O servidor usa por padrão o Ollama em `http://127.0.0.1:11434`.

Configurações opcionais do processo: `OLLAMA_BASE_URL`, `OLLAMA_MODEL` e `OLLAMA_TIMEOUT`.

## Verificar

```bash
npm test
npm run build
```

## Links
- [Notebook no Kaggle](https://www.kaggle.com/code/mvsvincius/semeia-with-gemma)

## Limites do protótipo

- O Gemma roda no computador que executa o Ollama, não dentro do celular.
- Não há sincronização entre dispositivos, autenticação, pagamentos ou logística.
- A demonstração pública apresenta a interface; a execução real do Gemma local é demonstrada no vídeo do projeto.
