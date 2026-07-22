# Especificações de Design e Marca - SemeIA

## 1. Visão Geral do Projeto
**Nome do Aplicativo:** SemeIA (anteriormente *ColheAí*)
**Público-Alvo:** Produtores rurais, famílias e cooperativas da agricultura familiar na região Amazônica.
**Missão:** Democratizar o acesso ao conhecimento técnico, boas práticas de manejo e oportunidades justas de comercialização, conectando o saber tradicional amazônico à inteligência artificial.
**Tom de Voz:** Acolhedor, claro, direto, empático e regionalizado. O aplicativo atua como um assistente lado a lado com o produtor.

---

## 2. Identidade Visual (Brand Kit)

### 2.1. O Logotipo
O logotipo do SemeIA deve transparecer o ciclo orgânico da natureza unido à rede de conhecimento da IA.
* **Símbolo:** Uma composição circular contendo agricultores (com chapéus rurais) integrados a raízes ou galhos que se transformam sutilmente em nós de conexão digital (circuitos/redes).
* **Variações:** 
  * *Completa:* Símbolo + Tipografia "SemeIA" ao lado ou abaixo.
  * *Ícone de App:* Apenas o símbolo centralizado em um quadrado com bordas arredondadas, sobre fundo Verde Floresta.

### 2.2. Paleta de Cores (Cores da Amazônia)
A paleta foi selecionada para refletir a bioeconomia, a terra e a floresta, garantindo alto contraste sob a luz do sol (fundamental para uso no campo).

| Cor | Hexadecimal | RGB | Aplicação UI/UX |
| :--- | :--- | :--- | :--- |
| **Verde Floresta** | `#1B4332` | `27, 67, 50` | Fundo do Header, texto principal, navegação base. |
| **Verde Folha** | `#52B788` | `82, 183, 136` | Botões primários, links, ícones de progresso e plantio. |
| **Terra Roxa** | `#7F4F24` | `127, 79, 36` | Destaques secundários, bordas de cards, ícones de solo. |
| **Amarelo Sol** | `#FFD166` | `255, 209, 102` | Alertas informativos, avaliações, clima e ícones de destaque. |
| **Off-White** | `#F8F9FA` | `248, 249, 250` | Cor de fundo geral das telas, minimizando cansaço visual. |
| **Branco Puro** | `#FFFFFF` | `255, 255, 255` | Fundo de Cards flutuantes e modais. |

### 2.3. Tipografia
Para garantir que o aplicativo seja lido por pessoas de variados níveis de alfabetização e em telas de baixa resolução:
* **Fonte Primária (Títulos/Headers):** `Nunito` (Geométrica, amigável, bordas suaves).
* **Fonte Secundária (Corpo de Texto):** `Open Sans` ou `Roboto` (Legibilidade pura).
* **Tamanho Base:** Mínimo de `16px` para corpo de texto. Títulos em `22px` a `28px`.

---

## 3. Especificação de Ativos (Assets)

### 3.1. Cabeçalho do README (GitHub/Docs)
A imagem de cabeçalho (Header) do repositório deve ser uma ilustração ampla que conte a jornada do usuário:
* **Cenário:** Uma paisagem amazônica exuberante (castanheiras, açaizeiros, rios ao fundo).
* **Ação:** De um lado, produtores plantando e manejando a terra. No centro, uma representação digital (um tablet/celular gigante ou um holograma sutil) conectando os produtores aos dados. Do outro lado, uma feira ou barraca de comercialização estruturada.

### 3.2. Conjunto de Ícones
Os ícones da interface devem ser espessos (bold), preenchidos ou outline com traço grosso, fáceis de tocar.
1. **Capacitação Técnica:** Um livro aberto de onde brota uma muda estilizada, ou um agricultor com um ícone sutil de "conhecimento/cérebro" iluminado.
2. **Comunidade:** Três figuras humanas com chapéu de palha, unidas por laços ou nós de rede, simbolizando cooperativismo.
3. **Plantio & Manejo:** Mãos segurando terra de onde nasce uma planta, com setas ou pontos digitais ao redor indicando monitoramento.
4. **Mercado & Preços:** Um cesto de palha com frutas amazônicas e um pequeno gráfico em barra ascendente.
5. **Assistente IA (Chat/Voz):** Um ícone de microfone grande e amigável, envolto por folhas, indicando a interação fácil por voz com a inteligência artificial.

---

## 4. Diretrizes de UX/UI (Interface e Experiência)

### 4.1. Acessibilidade em Primeiro Lugar
* **Interface "Voice-First":** Como muitos usuários podem ter dificuldade de digitação, o botão de "Falar com a SemeIA" (Microfone) deve estar fixo e flutuante em todas as telas (FAB - Floating Action Button).
* **Estado Offline:** A Amazônia possui desafios de conectividade. O app deve ter cache robusto. Quando offline, o topo da tela deve mostrar um banner sutil Amarelo Sol: *"Você está offline. Algumas dicas ainda estão disponíveis."*
* **Área de Toque (Touch Targets):** Botões devem ter pelo menos `48x48 dp` para facilitar o uso por mãos calejadas ou sujas de terra.

### 4.2. Estrutura da Tela Inicial (Home)
* **Saudação:** "Bom dia, João! Hoje tem previsão de chuva forte à tarde."
* **Card Principal:** Dica do dia gerada por IA focada na cultura do usuário (ex: *Manejo da Vassoura-de-Bruxa no Cacau*).
* **Grid de Navegação:** 4 botões grandes com os ícones principais (Mercado, Minha Lavoura, Comunidade, Capacitação).

---

## 5. Variáveis CSS e Design Tokens (Para Desenvolvedores)

```css
:root {
  /* Paleta de Cores SemeIA */
  --semeia-forest: #1B4332;
  --semeia-leaf: #52B788;
  --semeia-earth: #7F4F24;
  --semeia-sun: #FFD166;
  --semeia-bg: #F8F9FA;
  --semeia-card: #FFFFFF;
  --semeia-text-dark: #12291F;
  --semeia-text-light: #6C757D;

  /* Fontes */
  --font-title: 'Nunito', sans-serif;
  --font-body: 'Open Sans', sans-serif;

  /* Espaçamento e UI */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-fab: 50%;
  --shadow-card: 0 4px 12px rgba(27, 67, 50, 0.08);
}
```
