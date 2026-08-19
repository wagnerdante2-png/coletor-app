# Coletor Operacional — MVP

Aplicação mobile-first para celulares Android e coletores de dados, preparada para integração futura com aplicações web e APIs corporativas.

## Módulos iniciais

- Inventário
- Recebimento de mercadorias
- Embarque de cargas
- Auditoria de preços
- Auditoria de validades
- Auditoria operacional
- Estrutura visual preparada para inclusão de novos módulos

## Leitura de códigos

O MVP possui uma central de leitura universal com três formas de entrada:

1. Câmera traseira do aparelho, usando `BarcodeDetector` quando disponível.
2. Coletores Android/leitores físicos configurados em modo teclado (keyboard wedge).
3. Digitação manual para testes e contingência.

A leitura aceita códigos **numéricos e alfanuméricos**, preservando letras, números e caracteres transmitidos pelo scanner. Isso permite trabalhar não apenas com EAN/UPC, mas também com códigos internos, SKU, seriais, etiquetas logísticas e identificadores como `ABC12345`, `CX-04-A17` ou conteúdos alfanuméricos presentes em QR Code.

Formatos previstos na interface: EAN-8, EAN-13, UPC-A, UPC-E, Code 39, Code 93, Code 128, ITF, Codabar, QR Code, Data Matrix, Aztec e PDF417. Code 39, Code 93, Code 128, QR Code, Data Matrix, Aztec e PDF417 podem transportar conteúdo alfanumérico conforme o padrão e o equipamento utilizado.

> Para produção, a camada de scanner deverá ganhar um adaptador nativo/fallback dedicado para garantir suporte consistente entre fabricantes de coletores.

## Arquitetura do MVP

- React + TypeScript + Vite
- Interface responsiva focada em telas de 320 a 480 px
- PWA instalável
- Capacitor preparado para empacotamento Android
- Dados demonstrativos locais, sem backend neste estágio
- Módulos desacoplados visualmente para facilitar expansão futura

## Executar no Codespaces

Se o Codespace já estava aberto antes das alterações feitas pela API do GitHub, primeiro sincronize a cópia local:

```bash
git pull --rebase origin main
npm install
npm run dev
```

O Vite abrirá na porta `5173`.

### Erro `ENOENT: no such file or directory, open .../package.json`

Esse erro significa que o `package.json` ainda não chegou à cópia local do Codespace. O arquivo existe na branch `main`; execute o `git pull --rebase origin main` antes do `npm install`.

## Gerar base Android

Após instalar as dependências:

```bash
npm run android:add
npm run android:sync
npm run android:open
```

A pasta Android é gerada pelo Capacitor. O login, autenticação, backend e integrações corporativas ficam propositalmente fora deste primeiro MVP.
