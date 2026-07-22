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
backend/   API REST Java com Spring Boot e Ollama
docs/      visão, hipóteses, histórias, contrato e roteiro da demonstração
```

## Executar a interface

Requisitos: Node.js 20 ou superior.

```bash
cd frontend
npm install
npm run dev
```

A interface abre em `http://localhost:5173`. Para testar o comportamento instalável e o cache offline, use `npm run build` e `npm run preview`.

## Executar a interpretação com Gemma

Requisitos: Java 17 ou superior, Maven, Ollama e um modelo Gemma pequeno disponível localmente.

1. Use `backend/.env.example` como referência e defina `OLLAMA_MODEL` e as demais variáveis necessárias no ambiente.
2. Inicie o Ollama.
3. Execute:

```bash
cd backend
mvn spring-boot:run
```

A API abre em `http://localhost:8080`. Se ela ou o modelo estiverem indisponíveis, o texto continua na tela e o cadastro manual permanece funcional.

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
