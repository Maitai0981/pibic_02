Com base nos arquivos fornecidos, preparei um arquivo `README.md` detalhado para o seu projeto **PIBIC Dermatologia**, utilizando a estrutura e as informações contidas nos códigos e arquivos de configuração.

O projeto é um aplicativo móvel desenvolvido em React Native/Expo focado em análise dermatológica de lesões cutâneas.

-----

# PIBIC Dermatologia

O **PIBIC Dermatologia** é um aplicativo móvel desenvolvido em React Native/Expo com o objetivo de auxiliar na análise preliminar de lesões de pele. Ele permite que usuários capturem ou importem imagens para enviá-las a um serviço de *backend* para classificação e geração de laudos detalhados.

## 💻 Tecnologias Utilizadas

O projeto é um aplicativo **multiplataforma (iOS/Android)** construído com:

  * **Framework:** React Native
  * **Ambiente de Desenvolvimento:** Expo
  * **Navegação:** `@react-navigation/bottom-tabs` para a navegação principal
  * **APIs do Dispositivo:** `expo-image-picker`, `expo-file-system`, `expo-image-manipulator`
  * **Backend:** Comunicação com uma API REST para predição, configurada para ser acessada no endereço `http://172.25.153.3:5000/api`.

## ✨ Funcionalidades Principais

  * **Captura e Importação de Imagens:** Permite que o usuário tire fotos diretamente com a câmera ou importe imagens da galeria.
  * **Análise Dermatológica:** Envia a imagem capturada ou selecionada (redimensionada para 224x224 pixels) para a API de predição.
  * **Visualização de Laudos:** Apresenta o resultado da análise em duas abas: "Laudo Simplificado" (com a descrição clínica) e "Laudo Completo" (com resumo, classificação e detalhes da lesão).
  * **Temas Claro/Escuro:** Suporte a alternância entre modos de tema (Light e Dark), com persistência de preferência local.
  * **Download de Laudo:** Funcionalidade para baixar o laudo completo como um arquivo de texto (`.txt`).
  * **Módulo de Contato:** Tela dedicada para envio de mensagens/feedback via `emailjs-com`.

## ⚙️ Instalação e Execução

Para configurar e rodar o projeto localmente, siga os passos abaixo.

### Pré-requisitos

Certifique-se de ter instalado:

  * Node.js (versão compatível com o Expo 53.x)
  * Expo CLI (`npm install -g expo-cli`)
  * Um backend compatível rodando na URL configurada.

### Passos

1.  **Instalar dependências:**

    ```bash
    npm install
    # ou
    # npm run clean (para limpar e reinstalar tudo)
    ```

2.  **Iniciar o Servidor de Desenvolvimento:**

    ```bash
    npm start
    ```

    Isso iniciará o Metro Bundler. Você pode rodar o aplicativo em um emulador Android ou iOS, ou no seu dispositivo via Expo Go (se for um *development build*) ou através de um build nativo.

3.  **Executar em Ambiente Nativo (Android/iOS):**

    ```bash
    # Para Android
    npm run android
    # Para iOS
    npm run ios
    ```

## 🌐 Configuração da API

O aplicativo está configurado para buscar o status (`/health`) e enviar requisições de predição (`/predict`) para o seguinte endereço base, que provavelmente aponta para uma instância local (como WSL ou rede interna) do seu backend:

  * **URL Base da API:** `http://172.25.153.3:5000`
  * **Prefixo:** `/api`

Se o seu servidor backend estiver em um endereço diferente, você deve atualizar a chave `apiBaseUrl` dentro de `expo.extra` no arquivo `app.json`.
