# Guia de Deploy do Backend no Windows

> **Atenção:** O repositório ECR (Elastic Container Registry) criado por este processo é **público**.

## 1. Pré-requisitos do Backend

Dê prioridade de fazer no linux, no windows pode dar alguns problemas que serão abordados abaixo (pois fiz no windows)

1- Faça o update das seguintes extensões ou o download delas: 

- [Python 3.11 or higher](https://www.python.org/downloads/)
- [Git](https://git-scm.com/downloads)
- JSON e NPN [instructions for installing](https://nodejs.org/pt)
- [Chocolatey - O Chocolatey será util para driplar alguns problemas de compatibilidade do windows com o docker](https://chocolatey.org/)
- Docker - [instructions for installing](https://docs.docker.com/engine/install/)
- AWS CLI - [instructions for installing](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS CDK - [instructions for installing](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

Deixe o python no path pelo seguinte caminho: Painel de Controle > Sistema > Configurações Avançadas > Variáveis de Ambiente > Path > Editar > dar ok em tudo

Sincronize com o gitlab e conecte com o repositorio

Faça download do Docker desktop e entre com uma conta. Não se esqueça de dar as permissões para ele e atualizar na mão o comando que ele vai de dar para habilitar o microambiente linux no seu windows para subir os containers (faça tudo isso no powershell)

O Chocolatey tbm precisa ser feito pelo powershell

---

2- Clone o repositório do projeto a partir do GitLab.

---

3 Faça o download do Docker Desktop, crie uma conta e siga as instruções de instalação. Será necessário conceder permissões e executar um comando no PowerShell para habilitar o subsistema Windows para Linux (WSL 2), que é essencial para rodar os contêineres.

## 2. Preparando o Ambiente e o Código

1. Crie e ative o ambiente virtual do Python, conforme descrito no arquivo `README.md` do backend.
    > **Nota:** Se o comando `python3` não for reconhecido, utilize `python`. No Windows, ative o ambiente virtual executando o script `.bat` correspondente (ex: `venv\Scripts\activate.bat`).

2. Instale as dependências do projeto com o pip:
   ```bash
   pip install -r requirements.txt
   ```

## 3. Deploy do Backend na AWS

- **Região da AWS:** Certifique-se de que seu ambiente AWS CLI está configurado para a região `us-east-1`.
- **Docker:** Verifique se o Docker Desktop está em execução (status "Engine Running").

### 3.1. Configuração do Usuário IAM

Crie um usuário no IAM com as seguintes permissões.

**Políticas Gerenciadas pela AWS:**
- `AdministratorAccess`
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonECS_FullAccess`
- `AmazonElasticContainerRegistryPublicFullAccess`
- `AmazonElasticContainerRegistryPublicPowerUser`
- `AmazonElasticContainerRegistryPublicReadOnly`
- `EC2InstanceProfileForImageBuilderECRContainerBuilds`

**Política Inline:**
Adicione a seguinte política inline para permitir a autenticação no ECR Public:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr-public:GetAuthorizationToken",
                "sts:GetServiceBearerToken"
            ],
            "Resource": "*"
        }
    ]
}
```
> **AVISO DE SEGURANÇA:** As permissões acima, especialmente `AdministratorAccess`, são excessivamente permissivas e não devem ser usadas em ambientes de produção ou stage. A política `AdministratorAccess` foi usada aqui para simplificar o processo, evitando a necessidade de identificar permissões específicas para o CloudFormation. Em um ambiente real, siga o princípio do menor privilégio.

### 3.2. Autenticação e Deploy

1. **Autentique o Docker no ECR Public:**
   Execute o comando abaixo no seu terminal. Se ocorrerem erros, provavelmente estão relacionados a permissões do IAM ou à configuração do Docker.
   ```bash
   aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
   ```

2. **Solução de Problemas: Erro de Credenciais do Docker**
   Se você encontrar o erro `Error saving credentials: error storing credentials - err: exit status 1, out: 'not implemented'`, siga os passos abaixo:
    1. Abra o arquivo `config.json` localizado no diretório `.docker` do seu usuário (ex: `C:\Users\SeuNome\.docker\config.json`).
    2. Altere a linha `"credsStore": "desktop"` para `"credsStore": "ecr-login"`.
    3. Abra o PowerShell **com permissões de administrador** e instale o helper de credenciais da AWS:
       ```powershell
       choco install amazon-ecr-credential-helper
       ```
    4. Tente executar o comando `docker login` novamente.
    5. Se o erro persistir, edite o arquivo `config.json` mais uma vez e **apague** a linha `"credsStore": "ecr-login"` por completo. Salve o arquivo e tente o login novamente.

3. **Sintetize o Stack do CDK:**
   Navegue até o diretório raiz do projeto e execute o `cdk synth`, especificando o caminho para o `app.py`.
   ```bash
   # Exemplo de navegação
   cd "C:\Users\SeuNome\Área de Trabalho\Threat-Modeling"
   
   # Comando synth
   cdk synth --app "python threat_modelling_backend/app.py"
   ```

### 3.3. Correção de Erros Comuns de Deploy

- **`ModuleNotFoundError: No module named 'aws_cdk'`**: Este erro indica que o ambiente virtual do Python não está ativo ou as dependências não foram instaladas corretamente. Certifique-se de que o ambiente está ativado e que você executou `pip install -r requirements.txt`.

- **`Cannot find asset at ...\backend\genai_core`**: Este erro geralmente ocorre quando a estrutura de diretórios esperada pelo CDK não corresponde à do projeto. No caso encontrado, havia um aninhamento de pastas (ex: `backend/genai_core/genai_core`). A solução foi mover o conteúdo da pasta mais interna (`genai_core`) para a pasta pai de mesmo nome.

- **Erro de caminho em `graphql_api.py`**: Um erro similar pode ocorrer neste arquivo, onde uma camada Lambda (`shared_layer`) aponta para um diretório incorreto.
  - **Arquivo:** `threat_modelling_backend/backend/api/graphql_api.py`
  - **Função:** `shared_layer = lambda_py.PythonLayerVersion`
  - **Correção:** Ajuste o parâmetro `entry` para o caminho correto, por exemplo: `entry="threat_modelling_backend/backend/api/shared"`.

### 3.4. Bootstrap e Deploy Final

1. **Obtenha o ID da sua conta AWS:**
   ```bash
   aws sts get-caller-identity
   ```

2. **Execute o `cdk bootstrap`:**
   Substitua `123456789012` pelo ID da sua conta obtido no passo anterior.
   ```bash
   cdk bootstrap aws://123456789012/us-east-1
   ```

3. **Execute o `cdk deploy`:**
   A partir do diretório raiz do projeto, execute o deploy.
   ```bash
   cdk deploy --all --require-approval=never --app "python threat_modelling_backend/app.py"
   ```

4. **Configure o arquivo `.env`:**
   Após o deploy, o CDK exibirá alguns dos valores de output necessários para o arquivo `.env` do frontend. No entanto, nem todos os valores podem ser exibidos.
   É recomendado acessar o serviço **CloudFormation** no Console da AWS, encontrar o stack que foi criado (ex: `BackendStack`) e, na aba **"Outputs"**, copiar todas as chaves e valores para o seu arquivo `.env`.

## 4. Enviando Arquivos de Exemplo para o S3

Não tente enviar os arquivos de exemplo manualmente pelo console, pois pode causar problemas. Use a AWS CLI.

O bucket S3 criado pelo CDK terá um nome com um sufixo gerado aleatoriamente (ex: `backendstack-threatmodeldatabucketd3863f79-roxfdt85dhnx`). Você pode encontrar o nome exato nos outputs do CloudFormation.

Navegue até a pasta `threat_modelling_backend` e execute os comandos abaixo, substituindo `<NOME_DO_SEU_BUCKET>` pelo nome correto.
```bash
aws s3 cp samples/example_architecture.png s3://<NOME_DO_SEU_BUCKET>/genai_core_examples/diagram_describer/
aws s3 cp samples/example_architecture.png.description s3://<NOME_DO_SEU_BUCKET>/genai_core_examples/diagram_describer/
```
> É recomendado adicionar mais exemplos para melhorar a performance do modelo de IA.

## 5. Verificando Acesso ao Amazon Bedrock

Embora o CDK deva configurar as permissões necessárias, é uma boa prática verificar se a função Lambda tem acesso ao Amazon Bedrock.

1. No console da AWS, navegue até o serviço **Lambda**.
2. Encontre e clique na função `BackendStack-ThreatModelGenerateAll[...]`.
3. Vá para a aba **Configuration** e depois para **Permissions**.
4. Verifique na seção **Resource summary** se **Amazon Bedrock** está listado.

Agora, habilite o acesso aos modelos necessários:

1. No console da AWS, navegue até o serviço **Amazon Bedrock**.
2. No menu de navegação à esquerda, na parte inferior, clique em **Model access**.
3. Clique em **Manage model access** e habilite o acesso para os seguintes modelos da Anthropic:
    - `Claude 3 Haiku`
    - `Claude 3 Sonnet`
    - `Claude 3.5 Sonnet`
4. Confirme as alterações. A ativação do acesso pode levar alguns minutos. Após a confirmação, você pode prosseguir para a configuração do frontend.


# Guia de Deploy do Frontend no Windows


## Pré-requisitos do FrontEnd
