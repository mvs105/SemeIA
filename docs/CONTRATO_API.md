# Contrato JSON entre frontend e backend

## Objetivo e limites

O backend do MVP oferece somente a interpretação de uma descrição de oferta. Ele não salva ofertas, não forma lotes e não sincroniza aparelhos. Essas responsabilidades permanecem no frontend local e em código determinístico.

```text
POST /api/v1/interpretacoes
Content-Type: application/json
Accept: application/json
```

O frontend trata a API como opcional. Falha, timeout ou resposta inválida sempre conduz ao preenchimento manual sem apagar o texto digitado nem os campos existentes.

## Requisição

```json
{
  "texto": "Tenho 30 quilos de macaxeira para entregar até sexta na comunidade Val Paraíso.",
  "dataReferencia": "2026-07-22"
}
```

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `texto` | string | sim | Após remover espaços nas extremidades, entre 3 e 500 caracteres. |
| `dataReferencia` | string | sim | Data civil ISO 8601 no formato `AAAA-MM-DD`. É a única referência usada para converter datas relativas. |

Regras adicionais:

- o idioma do MVP é português brasileiro;
- o frontend envia a data civil local atual explicitamente;
- o backend não usa silenciosamente a data ou o fuso do servidor para resolver “sexta”, “amanhã” e expressões semelhantes;
- propriedades desconhecidas na requisição são rejeitadas;
- o texto integral não deve ser escrito em logs.

## Resposta de sucesso

Status `200 OK`:

```json
{
  "produto": "macaxeira",
  "quantidade": 30,
  "unidade": "kg",
  "localidade": "Comunidade Val Paraíso",
  "disponivelAte": "2026-07-24",
  "observacoes": null
}
```

| Campo | Tipo | Regras de saída |
| --- | --- | --- |
| `produto` | string ou `null` | Entre 1 e 80 caracteres quando identificado; sem inventar variedade, origem ou certificação. |
| `quantidade` | number ou `null` | Maior que zero e menor ou igual a 1.000.000; no máximo três casas decimais. |
| `unidade` | string ou `null` | Um dos valores canônicos: `kg`, `g`, `unidade`, `caixa`. |
| `localidade` | string ou `null` | Entre 1 e 120 caracteres; comunidade ou ponto de entrega informado, nunca localização inferida. |
| `disponivelAte` | string ou `null` | Data civil ISO 8601 `AAAA-MM-DD`; datas relativas usam exclusivamente `dataReferencia`. |
| `observacoes` | string ou `null` | Até 300 caracteres; somente informação presente no texto e não representada nos demais campos. |

Todos os seis campos aparecem na resposta HTTP, mesmo quando o modelo não os forneceu e o valor validado é `null`. A resposta não inclui confiança, identificador ou estado de sincronização. Um `200` significa apenas que a estrutura passou pela validação; não significa que o conteúdo seja verdadeiro. A confirmação humana continua obrigatória.

Exemplo com informação ausente:

```json
{
  "produto": "banana",
  "quantidade": null,
  "unidade": null,
  "localidade": null,
  "disponivelAte": null,
  "observacoes": null
}
```

## Normalização de unidades

O adaptador pode reconhecer variações escritas, mas só devolve valores canônicos:

| Entrada reconhecida | Saída |
| --- | --- |
| `quilo`, `quilos`, `kilograma`, `kilogramas`, `kg` | `kg` |
| `grama`, `gramas`, `g` | `g` |
| `unidade`, `unidades` | `unidade` |
| `caixa`, `caixas` | `caixa` |

Somente `kg` e `g` são compatíveis para conversão entre si. Conversão e soma pertencem à regra determinística de lotes, não ao modelo nem a esta rota.

## Erros

Todos os erros usam o mesmo formato e não expõem exceção, prompt ou resposta bruta do modelo:

```json
{
  "codigo": "ENTRADA_INVALIDA",
  "mensagem": "A descrição deve ter entre 3 e 500 caracteres."
}
```

| Status | Código | Quando usar | Comportamento esperado no frontend |
| --- | --- | --- | --- |
| `400` | `JSON_INVALIDO` | Corpo ausente, JSON malformado, campo desconhecido ou tipo incompatível. | Preservar texto e permitir preenchimento manual. |
| `422` | `ENTRADA_INVALIDA` | Campo sintaticamente legível viola as regras da requisição. | Explicar a correção sem apagar dados. |
| `502` | `RESPOSTA_IA_INVALIDA` | Ollama respondeu, mas o conteúdo do modelo não passou pelo parser ou validador. | Informar que não foi possível interpretar e manter o fluxo manual. |
| `503` | `IA_INDISPONIVEL` | Ollama ou modelo não está acessível. | Informar indisponibilidade temporária e manter o fluxo manual. |
| `504` | `TEMPO_IA_ESGOTADO` | A inferência ultrapassou o limite do backend. | Encerrar a espera e manter o fluxo manual. |
| `500` | `ERRO_INTERNO` | Falha interna não prevista, sem detalhes sensíveis. | Exibir mensagem genérica e manter o fluxo manual. |

O frontend impõe timeout de 10 segundos. O backend usa 8 segundos por padrão, configuráveis por `OLLAMA_TIMEOUT`, e cancela a espera quando o cliente HTTP permite.

## Contrato interno com o Gemma

O adaptador solicita somente um objeto JSON com os seis campos da resposta. O parser:

1. aceita o objeto puro e tolera apenas uma cerca Markdown que envolva exatamente esse objeto;
2. rejeita texto adicional, raiz que não seja objeto e propriedades desconhecidas;
3. verifica tipos, limites, unidades e validade real da data;
4. converte campos ausentes ou vazios para `null`;
5. nunca corrige quantidade inválida nem completa conteúdo por conta própria;
6. devolve `RESPOSTA_IA_INVALIDA` se o resultado continuar inválido.

O texto da pessoa é delimitado no prompt e tratado como dado, não como instrução. Isso reduz risco de injeção de prompt, mas não substitui validação e confirmação.

## Modelo local após confirmação

Somente depois da confirmação, o frontend cria uma `Oferta` no IndexedDB:

```json
{
  "id": "uuid-gerado-no-navegador",
  "produtorId": "produtor-local",
  "produto": "macaxeira",
  "quantidade": 30,
  "unidade": "kg",
  "localidade": "Comunidade Val Paraíso",
  "disponivelAte": "2026-07-24",
  "observacoes": null,
  "status": "disponivel",
  "syncStatus": "local",
  "criadaEm": "2026-07-22T18:30:00.000Z",
  "atualizadaEm": "2026-07-22T18:30:00.000Z"
}
```

Sem serviço de sincronização, `syncStatus` só pode receber `local`. Os valores futuros `pendente` e `sincronizada` não aparecem na interface atual.

## Casos mínimos de teste

- frase completa do roteiro e conversão de data relativa a partir da data enviada;
- produto sem quantidade ou unidade, com campos nulos;
- quantidade zero, negativa, acima de 1.000.000 e com mais de três casas decimais;
- unidade aceita e unidade desconhecida;
- data inexistente, como `2026-02-30`;
- JSON do modelo com texto extra, propriedade desconhecida e tipo incorreto;
- indisponibilidade, timeout e resposta não JSON do Ollama;
- garantia de que nenhuma resposta da rota cria uma oferta.
