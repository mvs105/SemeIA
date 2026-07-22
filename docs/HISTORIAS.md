# Histórias de usuário e critérios de aceitação

## US-01 — Registrar manualmente sem conexão

Como produtora, quero preencher uma oferta sem internet para não esperar por sinal.

- Produto, quantidade, unidade e localidade são obrigatórios.
- Quantidade deve ser maior que zero.
- A oferta aparece na lista após salvar.
- O estado exibido é “Salva neste aparelho”.
- Nenhuma chamada ao serviço de IA é necessária.

## US-02 — Descrever uma oferta

Como produtora, quero escrever como falo para receber uma proposta de preenchimento.

- A tela mostra um exemplo de frase.
- O texto é enviado apenas após ação explícita.
- Durante a espera, a tela mostra “Interpretando com Gemma”.
- Se houver sucesso, os campos sugeridos ficam editáveis e recebem o aviso “Sugestão da IA — confira antes de salvar”.
- Salvar continua exigindo confirmação explícita.

## US-03 — Continuar quando a IA falhar

Como produtora, quero continuar manualmente quando o serviço estiver indisponível.

- O texto digitado permanece intacto.
- A mensagem explica que o preenchimento manual continua disponível.
- Campos já preenchidos não são apagados.

## US-04 — Gerenciar ofertas locais

Como produtora, quero consultar, editar e excluir ofertas guardadas neste aparelho.

- A lista funciona com o serviço Java desligado.
- Editar reaproveita os dados atuais e atualiza a data de alteração.
- Excluir pede confirmação.
- A interface diferencia disponível e encerrada.

## US-05 — Enxergar lotes coletivos

Como articulador, quero ver ofertas compatíveis somadas para avaliar volume coletivo.

- Somente ofertas disponíveis entram no cálculo.
- Produto e localidade são comparados de forma normalizada.
- Quilogramas e gramas são convertidos para quilogramas.
- Datas precisam cair na mesma semana de segunda a domingo.
- Unidades incompatíveis, comunidades diferentes e ofertas encerradas não se misturam.
- A soma é feita por código determinístico.

## US-06 — Preparar uma demonstração

Como apresentador, quero carregar dados fictícios sem misturá-los silenciosamente aos dados reais.

- A ação é explícita e informa que os dados são fictícios.
- Repetir a ação não duplica registros.
- Os dados permitem formar um lote ao adicionar a oferta principal do roteiro.

