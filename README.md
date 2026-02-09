# AutoflexFrontend

Este projeto foi gerado utilizando o [Angular CLI](https://github.com/angular/angular-cli) versão **21.1.3**.

O **backend (API)** da aplicação está disponível no repositório:

https://github.com/Thiagosn1/autoflex-api

## Pré-requisitos

Antes de rodar o projeto, é necessário instalar algumas ferramentas no seu ambiente.

---

## 1. Instalando o Node.js

O Angular depende do **Node.js** para funcionar. Abaixo estão as opções de instalação para **Windows** e **Linux**.

### Windows

**Opção 1: Instalador oficial (recomendado)**

1. Acesse: [https://nodejs.org](https://nodejs.org)
2. Baixe a versão **LTS (Long Term Support)**.
3. Execute o instalador (`.msi`) e avance com as opções padrão.

Após a instalação, reinicie o terminal e verifique:

```bash
node -v
npm -v
```

---

### Linux

**Opção 1: Usando o Node Version Manager (NVM) – recomendado**

Permite instalar e gerenciar múltiplas versões do Node.js.

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Reinicie o terminal ou execute:

```bash
source ~/.bashrc
```

Instale a versão LTS do Node.js:

```bash
nvm install --lts
nvm use --lts
```

Verifique a instalação:

```bash
node -v
npm -v
```

**Opção 2: Via gerenciador de pacotes (Ubuntu/Debian)**

```bash
sudo apt update
sudo apt install nodejs npm
```

> Observação: essa opção pode instalar versões mais antigas do Node.js.

---

## 2. Instalando o Angular CLI

Com o Node.js instalado, instale o Angular CLI globalmente:

```bash
npm install -g @angular/cli
```

Verifique a instalação com:

```bash
ng version
```

---

## 3. Instalando as dependências do projeto

Clone o repositório do projeto e, dentro da pasta raiz, execute:

```bash
npm install
```

Esse comando irá baixar todas as dependências necessárias listadas no arquivo `package.json`.

---

## 4. Rodando o projeto em ambiente de desenvolvimento

Após instalar as dependências, inicie o servidor de desenvolvimento com:

```bash
ng serve
```

Quando o servidor estiver em execução, acesse no navegador:

```
http://localhost:4200/
```

A aplicação será recarregada automaticamente sempre que houver alterações nos arquivos fonte.

---

## Code scaffolding

O Angular CLI inclui ferramentas poderosas de geração de código. Para criar um novo componente, execute:

```bash
ng generate component component-name
```

Para ver todas as opções disponíveis (como `components`, `directives` ou `pipes`):

```bash
ng generate --help
```

---

## Build do projeto

Para gerar a versão de produção do projeto, utilize:

```bash
ng build
```

Os arquivos compilados serão gerados na pasta `dist/`, com otimizações de desempenho habilitadas por padrão.

---

## Testes unitários

Para executar os testes unitários utilizando o [Vitest](https://vitest.dev/), use:

```bash
ng test
```

---

## Testes end-to-end

Para executar os testes end-to-end (e2e):

```bash
ng e2e
```

O Angular CLI não inclui um framework de e2e por padrão, sendo necessário configurar um de sua preferência.

---

## Recursos adicionais

Para mais informações sobre o Angular CLI e seus comandos, consulte a documentação oficial:

[https://angular.dev/tools/cli](https://angular.dev/tools/cli)
