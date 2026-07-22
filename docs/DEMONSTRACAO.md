# Roteiro da demonstração

## Preparação

1. Abra a versão de produção uma vez com a rede disponível.
2. Inicie a API Java, o Ollama e o modelo Gemma configurado.
3. Na tela inicial, use **Preparar demonstração** para carregar uma oferta fictícia compatível.
4. Confirme que nenhuma informação real foi usada.

## Fluxo principal

1. Abra **Nova oferta**.
2. Desative a internet. O indicador deve mostrar **Sem internet — dados locais disponíveis**.
3. Digite: “Tenho 30 quilos de macaxeira para entregar até sexta na comunidade Val Paraíso”.
4. Se o serviço local continuar acessível, escolha **Interpretar com Gemma**; caso contrário, preencha manualmente. Explique que o Gemma está no computador, não no celular.
5. Confira e, se necessário, corrija os campos sugeridos.
6. Marque a confirmação e salve.
7. Abra **Minhas ofertas** e mostre o estado **Salva neste aparelho**.
8. Abra **Lotes coletivos** e mostre a soma com a oferta fictícia previamente carregada.

## Casos de falha

- Desligue a API, tente interpretar e confirme que o texto continua na tela.
- Informe quantidade zero e confirme que o salvamento é bloqueado.
- Altere a comunidade ou unidade para demonstrar que ofertas incompatíveis não se agrupam.
- Recarregue sem rede e confirme que os dados locais reaparecem.

## Checklist antes de apresentar

- [ ] Interface abre após um primeiro carregamento com rede desativada.
- [ ] Cadastro manual funciona sem backend.
- [ ] Falha da IA não apaga o texto.
- [ ] Sugestão exige revisão e confirmação.
- [ ] JSON inválido não quebra a interface.
- [ ] Quantidade inválida é recusada.
- [ ] Lote compatível soma corretamente.
- [ ] Oferta incompatível fica separada.
- [ ] Estado local é compreensível sem depender de cor.
- [ ] Fluxo funciona em 320 px de largura.

