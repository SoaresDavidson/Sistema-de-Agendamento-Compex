# Protótipo do Sistema de Agendamento

Este diretório contém o protótipo de interface do Sistema de Agendamento para Clínica. Ele foi criado para servir como referência visual e apoiar a validação de ideias, funcionalidades, fluxos de navegação, regras de negócio e decisões de experiência do usuário.

> [!IMPORTANT]
> Este protótipo **não representa a implementação final do sistema**. Os dados exibidos são simulados, não há integração com backend ou banco de dados e as alterações realizadas durante a navegação podem não persistir após o recarregamento da página.

## Origem e finalidade

O material foi gerado com o **OpenDesign** exclusivamente para fins de prototipação e validação. Seu objetivo é facilitar a discussão e o refinamento da solução antes e durante o desenvolvimento da aplicação definitiva.

O protótipo pode ser utilizado para:

- visualizar a proposta de identidade e organização da interface;
- validar telas, componentes e estados da aplicação;
- percorrer os principais fluxos de uso;
- avaliar funcionalidades e regras de negócio planejadas;
- identificar ajustes antes da implementação final.

## Como visualizar

### Versão navegável em HTML

Abra o arquivo [`index.html`](./index.html) no navegador. Ele funciona como a página inicial e oferece acesso às diferentes telas e fluxos do protótipo.

Também é possível iniciar um servidor local. No terminal, a partir da raiz do repositório, execute:

```bash
cd prototype
python3 -m http.server 8000
```

Em seguida, acesse [http://localhost:8000](http://localhost:8000) no navegador. Para encerrar o servidor, pressione `Ctrl+C` no terminal.

### Versão em PDF

Para uma visualização estática das telas, abra o arquivo [`prototipo-agendamento-clinica.pdf`](./prototipo-agendamento-clinica.pdf).

O PDF é útil para uma consulta rápida ou apresentação, enquanto a versão HTML permite navegar entre as telas e experimentar os fluxos previstos.

## Materiais complementares

Além das telas do protótipo, este diretório contém documentos que registram os requisitos, os fluxos, a modelagem de dados e as principais decisões de design adotadas durante a concepção da solução.

