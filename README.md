# SemeIA

O SemeIA é um protótipo offline-first para ajudar agricultores familiares a registrar ofertas e reunir pequenas quantidades em lotes coletivos. O navegador guarda os dados no próprio aparelho; um serviço Java local pode usar Gemma via Ollama para sugerir o preenchimento de uma oferta.

> A IA apenas sugere campos. A pessoa sempre revisa e confirma antes de salvar.

## O que já funciona

- perfil local simplificado;
- cadastro manual e interpretação opcional de texto;
- confirmação e correção antes da gravação;
- criação, edição e exclusão de ofertas no IndexedDB;
- indicação explícita de que os dados estão somente no aparelho;
- lotes calculados por produto, unidade compatível, comunidade e semana;
- PWA responsiva e preparada para cache offline após o primeiro carregamento;
- API Spring Boot com validação rigorosa e adaptador local para Ollama/Gemma;
- testes das regras de domínio, persistência local, fluxo principal e parser da IA.

Consulte a [visão e os limites](docs/PRODUTO.md), as [histórias de usuário](docs/HISTORIAS.md), os [requisitos mensuráveis](docs/REQUISITOS_NAO_FUNCIONAIS.md), o [contrato JSON](docs/CONTRATO_API.md) e o [roteiro da demonstração](docs/DEMONSTRACAO.md).

## Estrutura

```text
frontend/  PWA Vanilla com Vite, Dexie e Workbox
server.js  Servidor Express em Node.js com endpoints da API (/api/v1/interpretacoes) e suporte a Gemini / Ollama / regras
server/    Interpretador de linguagem natural com fallback resiliente
docs/      visão, hipóteses, histórias, contrato e roteiro da demonstração
```

## Executar a aplicação

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

A aplicação (frontend PWA + backend Node.js) roda na mesma porta (3000) e disponibiliza a API `/api/v1/interpretacoes`.

## Executar a interpretação de texto

A API REST local suporta 3 camadas de interpretação resiliente:
1. **Gemini API** (se `GEMINI_API_KEY` estiver configurado no `.env`);
2. **Ollama / Gemma local** (se `OLLAMA_BASE_URL` estiver configurado);
3. **Fallback baseado em regras** (funciona localmente sem serviços externos).

Se todos os serviços de IA estiverem indisponíveis ou offline, o cadastro manual de ofertas continua 100% funcional.

## Verificações

```bash
cd frontend
npm test
npm run build

cd ../backend
mvn test
```

O roteiro humano, inclusive o teste com a rede desativada, está em [docs/DEMONSTRACAO.md](docs/DEMONSTRACAO.md).

## Limites da demonstração

- Os dados offline ficam no navegador, não em todos os celulares automaticamente.
- O Gemma roda no computador onde o Ollama está instalado; inferência no celular ainda não foi comprovada.
- Não existe sincronização entre dispositivos neste protótipo. Por isso, novas ofertas aparecem como “salvas neste aparelho”.
- Personas e necessidades amazônicas descritas aqui são hipóteses de produto a validar em campo.
- O teste manual completo com rede desativada e a inferência com uma instalação real do Ollama ainda precisam ser registrados no ambiente da demonstração.
