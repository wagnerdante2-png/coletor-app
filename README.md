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

Formatos previstos na interface: EAN-8, EAN-13, UPC-A, UPC-E, Code 39, Code 93, Code 128, ITF, Codabar, QR Code, Data Matrix, Aztec e PDF417.

> Para produção, a camada de scanner deverá ganhar um adaptador nativo/fallback dedicado para garantir suporte consistente entre fabricantes de coletores.

## Arquitetura do MVP

- React + TypeScript + Vite
- Interface responsiva focada em telas de 320 a 480 px
- PWA instalável
- Capacitor preparado para empacotamento Android
- Dados demonstrativos locais, sem backend neste estágio
- Módulos desacoplados visualmente para facilitar expansão futura

## Executar no Codespaces

```bash
npm install
npm run dev
```

O Vite abrirá na porta `5173`.

## Gerar base Android

Após instalar as dependências:

```bash
npm run android:add
npm run android:sync
npm run android:open
```

A pasta Android é gerada pelo Capacitor. O login, autenticação, backend e integrações corporativas ficam propositalmente fora deste primeiro MVP.
