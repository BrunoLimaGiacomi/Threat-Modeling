# Organizando e Preparando o Código (Back-End)

---

### 1. Configuração do Ambiente Python

Primeiro, prepare o ambiente Python para o back-end, seguindo as instruções do **`README`**.

* Crie o ambiente virtual (venv). Se o comando `python3` não funcionar, tente apenas `python`.
* Ative o ambiente usando o arquivo `.bat` no Windows.
* Crie o arquivo `requirements.txt` na raiz do projeto e instale as dependências com o comando `pip install -r requirements.txt`.

> **Observação:** As versões do Python 3.12 ou superior são preferenciais para evitar problemas.

---

### 2. Preparação para o Deploy (AWS)

Antes de fazer o deploy, garanta que sua conta AWS está configurada corretamente.

* **Região:** Verifique se sua região está configurada para **`us-east-1`**.
* **Docker:** Certifique-se de que o Docker está em execução (`Engine Running`).
* **Usuário IAM:** Crie um usuário com as permissões listadas abaixo.
    * `AdministratorAccess`
    * `AmazonEC2ContainerRegistryFullAccess`
    * `AmazonECS_FullAccess`
    * `AmazonElasticContainerRegistryPublicFullAccess`
    * `AmazonElasticContainerRegistryPublicPowerUser`
    * `AmazonElasticContainerRegistryPublicReadOnly`
    * `EC2InstanceProfileForImageBuilderECRContainerBuilds`
    * Uma política personalizada para acesso ao ECR:
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
> **Atenção:** As políticas acima concedem permissões amplas. Em um ambiente de produção, é crucial aplicar o **princípio do mínimo privilégio** para garantir a segurança. A política `AdministratorAccess` foi usada neste guia para contornar problemas de permissão, mas deve ser substituída por políticas mais específicas.

---

### 3. Deploy do Back-End com AWS CDK

Siga os passos abaixo para fazer o deploy do back-end usando o CDK.

#### **3.1 Configuração e Autenticação do Docker**

Execute o comando para fazer login no Docker com suas credenciais da AWS:

```bash
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
