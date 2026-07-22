# Visão do produto e limites do MVP

## Visão

Para agricultores familiares amazônicos que precisam divulgar pequenas quantidades mesmo com conectividade limitada, o **SemeIA** é um assistente comunitário offline-first que transforma uma descrição cotidiana em uma oferta revisável e reúne ofertas compatíveis em lotes coletivos. Diferentemente de um marketplace centralizado, o fluxo essencial continua no aparelho e deixa claro o que foi sugerido pela IA e o que ainda não foi sincronizado.

## Resultado esperado no hackathon

Demonstrar, em menos de quatro minutos, que uma pessoa consegue registrar uma oferta sem internet, revisá-la, salvá-la localmente e enxergar sua contribuição para um lote coletivo. Com o serviço local disponível, o Gemma reduz o esforço de preencher campos; sem ele, o cadastro manual continua íntegro.

## Evidência, hipótese e decisão

| Tipo | Afirmação |
| --- | --- |
| Evidência existente | O artigo fornecido relata benefícios de WhatsApp e mercados digitais, além de barreiras de internet, energia e capacitação. O estudo entrevistou três agricultores ligados a uma feira orgânica em Pato Branco, Paraná. |
| Hipótese de produto | Agricultores de comunidades amazônicas perceberão valor em registrar ofertas por texto e em compor lotes com vizinhos. |
| Hipótese de uso | Linguagem curta, alvos de toque grandes e funcionamento local reduzem abandono por conectividade e letramento digital. |
| Decisão de protótipo | Priorizar registro, confirmação, armazenamento local e agrupamento; não construir pagamentos, mapas, logística completa ou integrações governamentais. |

## Personas provisórias

### Rosa, produtora familiar

- Cultiva macaxeira, banana e cheiro-verde em pequena escala.
- Usa um celular compartilhado e encontra sinal em momentos específicos.
- Precisa registrar rapidamente o que tem, sem navegar por formulários longos.
- **Hipóteses a validar:** vocabulário preferido, unidades usadas, confiança em sugestões da IA, compartilhamento do aparelho e necessidade real de voz.

### João, articulador de associação

- Consolida mensagens de vários produtores e conversa com compradores.
- Precisa saber o volume combinado, o local e o período de disponibilidade.
- **Hipóteses a validar:** regras reais de compatibilidade, frequência de atualização e responsabilidade pela confirmação do lote.

### Ana, compradora institucional

- Busca volume previsível e dados claros sobre origem comunitária.
- Precisa comparar lotes, sem receber promessas de certificação não comprovadas.
- **Hipóteses a validar:** campos mínimos, frequência de consulta e requisitos documentais fora do MVP.

## Escopo

### Incluído

- perfil local simples;
- oferta por texto ou formulário;
- sugestão via Gemma com confirmação humana;
- persistência e CRUD no IndexedDB;
- indicação de estado local;
- lote coletivo calculado por regra determinística;
- PWA móvel e cache do aplicativo;
- API Java local com validação de entrada e saída.

### Depois do fluxo principal

- voz, sincronização real, autenticação, notificações e painel dedicado de compradores.

### Fora do MVP

- pagamentos, roteamento, integrações PAA/PNAE, documentos, certificação, rastreabilidade completa, diagnóstico agronômico e marketplace de produção.

## Métricas de validação do protótipo

- 4 de 5 participantes concluem um cadastro manual sem ajuda em até 3 minutos.
- 4 de 5 identificam corretamente que a oferta está somente no aparelho.
- 5 de 5 percebem que os campos da IA precisam ser confirmados.
- Nenhum texto é perdido nos testes de falha do serviço local.
- Soma de lotes permanece correta em 100% dos casos automatizados de compatibilidade.

