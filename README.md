# Threat Modeling Backend Deployment (Windows Guide)

Este documento descreve como realizar o deploy do **Backend** no **Windows** (apesar de ser altamente recomendado o uso de Linux).  
⚠️ **Atenção:** este guia contém workarounds para problemas comuns no Windows. O ideal é sempre priorizar Linux para evitar erros de compatibilidade.

---

## 1. Pré-requisitos do Backend

### Dependências necessárias

Instale ou atualize os seguintes itens:

- [Python 3.11+](https://www.python.org/downloads/)
- [Git](https://git-scm.com/downloads)
- JSON / NPM
- [Chocolatey](https://chocolatey.org/install) → útil para contornar problemas do Windows com Docker
- [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

### Configurações iniciais

1. Adicione o **Python** ao PATH:  
   `Painel de Controle > Sistema > Configurações Avançadas > Variáveis de Ambiente > Path > Editar > OK`.
2. Sincronize o repositório no GitLab.
3. Configure e entre no Docker Desktop com sua conta.  
   - Ative o microambiente Linux pelo **PowerShell** com privilégios de administrador.  
4. Instale o **Chocolatey** também pelo PowerShell.

---

## 2. Preparando o código

1. Suba o ambiente do Python (como descrito no README do backend).  
   - Se `python3` não funcionar, use `python`.  
   - Versão recomendada: **3.12+**.
2. Ative o ambiente pelo script `.bat` (Windows).
3. Crie um arquivo `requirements.txt` na raiz do projeto e rode:

```shell
pip install -r requirements.txt
