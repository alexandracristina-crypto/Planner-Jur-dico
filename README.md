# ⚖️ Planner Jurídico — Alexandra

Aplicativo web pessoal de organização de estudos para o curso de Direito, criado sob medida para o 2º período (Afya Unigranrio, campus Duque de Caxias), com o semestre de 27/07/2026 a 14/12/2026 já configurado.

O objetivo é reunir, em um único lugar, tudo o que envolve o dia a dia acadêmico: tarefas diárias, revisões espaçadas, cronograma de aulas, provas, flashcards, leituras e até anotações do escritório onde Alexandra trabalha — sem depender de múltiplos apps ou planilhas separadas.

## 📋 Descrição do projeto

O Planner Jurídico é uma **single-page application (SPA)** que roda inteiramente em um único arquivo HTML, sem necessidade de servidor, backend ou instalação. Todos os dados ficam salvos localmente no navegador do próprio usuário.

O app é dividido em 14 seções, acessíveis por uma barra de navegação inferior fixa (estilo app mobile):

| Seção | Função |
|---|---|
| 🏠 Início | Visão geral: progresso do semestre, sugestões do dia e resumo de disciplinas |
| ✅ Hoje | Checklist de tarefas diárias por data e disciplina |
| 📊 Progresso | Acompanhamento de horas estudadas e questões resolvidas por disciplina |
| 🔄 Revisões | Sistema de revisão espaçada de tópicos estudados |
| 📝 Notas | Bloco de anotações livres |
| 🎯 Metas | Metas pessoais/acadêmicas com marcação de conclusão |
| 📅 Grade | Cronograma semanal de aulas por disciplina |
| 📋 Provas | Datas de avaliações e provas futuras |
| ❌ Erros | Registro de erros cometidos em questões, para revisão futura |
| ⚖️ Termos | Glossário de termos jurídicos |
| 🗓 Faltas | Controle de faltas por disciplina |
| 📌 Juris | Banco pessoal de jurisprudência/ementas relevantes |
| 🏢 Escritório | Anotações e aprendizados do trabalho no escritório de direito previdenciário |
| ⏱ Timer | Pomodoro com ciclos de estudo e log de sessões concluídas |
| 📖 Leituras | Controle de leituras obrigatórias por disciplina, com progresso em % |
| 🃏 Cards | Flashcards com repetição espaçada (SM-2 simplificado) |

As disciplinas cadastradas são: **TGP** (Teoria Geral do Processo), **Direito Constitucional**, **Direito Civil – PG**, **Direito Penal – TGC**, **História do Direito** e **Projeto de Extensão I**, cada uma com sua cor própria para facilitar a identificação visual em todas as telas.

## 🛠️ Tecnologias usadas

- **HTML5** — estrutura da aplicação
- **CSS3** puro — visual, responsividade e animações (sem frameworks externos)
- **JavaScript (Vanilla JS)** — toda a lógica da aplicação, sem bibliotecas ou frameworks
- **Web Storage API (`localStorage`)** — persistência dos dados diretamente no navegador
- **Emoji** como sistema de ícones, sem dependência de bibliotecas de ícones externas

Não há dependências externas, build tools, pacotes ou requisições de rede — o projeto é 100% autocontido em um único arquivo `.html`.

## ⚙️ Instruções de instalação

Não é necessário instalar nada. Por ser um arquivo HTML autônomo, basta ter o arquivo salvo em qualquer computador ou celular:

1. Baixe o arquivo `planner_juridico.html`.
2. Guarde-o em uma pasta de sua preferência (ex: `Documentos/Planner Jurídico`).
3. (Opcional) Para acesso rápido no celular, adicione um atalho do arquivo à tela inicial pelo navegador.

Não há necessidade de conexão com a internet após o primeiro carregamento, nem de servidor, conta ou cadastro.

## ▶️ Como usar

1. Dê duplo clique no arquivo `planner_juridico.html` — ele abrirá automaticamente no navegador padrão (Chrome, Safari, Edge, etc.).
2. Use a barra de navegação inferior para transitar entre as seções.
3. Preencha tarefas, revisões, metas, leituras e demais informações normalmente pelos formulários de cada tela — tudo é salvo automaticamente no navegador (`localStorage`) a cada alteração.
4. Use o botão **🖨️ Imprimir**, no topo, para gerar uma versão impressa/PDF da tela atual.
5. Use a seção **⏱ Timer** para ciclos de estudo com a técnica Pomodoro, e a seção **🃏 Cards** para revisar flashcards com repetição espaçada.

### ⚠️ Atenção sobre os dados

Como os dados são salvos com `localStorage`, eles ficam vinculados ao **navegador e dispositivo** em que o arquivo foi aberto:

- Limpar o cache/dados de navegação do navegador apaga as informações salvas.
- Abrir o arquivo em outro navegador ou computador não traz os dados já preenchidos — cada ambiente tem seu próprio armazenamento local.
- Recomenda-se usar sempre o mesmo navegador e dispositivo para manter a continuidade dos dados, e fazer backups periódicos (por exemplo, copiando o conteúdo da seção Notas) se desejar preservar informações importantes.
