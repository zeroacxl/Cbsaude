# CBSaúde Cooperados

Sistema web (arquivo único `index.html`) para organização de cooperados da CBSaúde, com:

- **Login por funcionário** (usuário/senha) com permissões granulares (criar, editar, excluir, ver resumo, importar, gerenciar usuários).
- **Cadastro de cooperados**: dados pessoais, plano (Alfa/Bravo/Delta), cônjuge e dependentes.
- **Pesquisa** por nome ou CPF (titular, cônjuge e dependentes).
- **Resumo Individual** (com geração de PDF) e **Resumo Geral** (totais de titulares, dependentes, cônjuges, vidas e valor mensal).
- **Importação por JSON** e **exportação completa (Baixar JSON)**.

## Tempo na cooperativa e fase de carência

- Cada cooperado tem os campos **Data de Associação** e **Data de Saída/Desligamento (opcional)**.
- O sistema calcula automaticamente o **tempo na cooperativa** (anos, meses e dias) a partir da data de associação.
  - Cooperado ativo: tempo contado **até hoje**.
  - Cooperado desligado: tempo **permanecido** entre a entrada e a saída (ex.: entrou em 10/05/2022 e saiu em 12/03/2026 → "3 anos, 10 meses e 2 dias").
- **Fase de carência de 1 ano** (constante `CARENCIA_ANOS` no código):
  - Resumo Individual e busca exibem a situação: "Em carência (fase de 1 ano) até DD/MM/AAAA" ou "Carência de 1 ano concluída em DD/MM/AAAA".
  - O Resumo Geral possui o card **"Em Carência (1 ano)"** com a quantidade de cooperados ativos que ainda não completaram 1 ano de associação.
- O PDF do resumo individual também inclui essas informações.

## Infraestrutura

- **Hospedagem:** Render (o `index.html` estático é servido diretamente).
- **Banco de dados:** Firebase Firestore (coleções `associados` e `funcionarios`), via SDK v10 (ESM, carregado de CDN).
- **PDF:** jsPDF + html2canvas (CDN).

Nenhuma mudança de infraestrutura é necessária para as correções/recursos: o app continua 100% compatível com o Render e com o Firestore existente. O novo campo `dataDesligamento` é aditivo — registros antigos funcionam normalmente (sem o campo, o tempo é contado até hoje).
