# Threat Modeling Backend Deployment (Windows Guide)

Este documento descreve como realizar o deploy do **Backend** no **Windows** (apesar de ser altamente recomendado o uso de Linux).  
⚠️ **Atenção:** este guia contém workarounds para problemas comuns no Windows. O ideal é sempre priorizar Linux para evitar erros de compatibilidade.

---

## 1. Pré-requisitos do Backend

### Dependências necessárias

Instale ou atualize os seguintes itens:

- [Python 3.11+](https://www.python.org/downloads/)
- [Git](https://git-scm.com/downloads)
- [JSON / NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
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

## 2. Arrumando o código

Suba o env do python como descrito no README do BackEnd. *ATENÇÃO:* Se o "python3" não estiver funcionando, use apenas "Python" que funcione (mas para isso, o seu python deve ser a versão 3.12 pra cima)

ative ele com o .bat, pois vc está no windows

Crie a pasta "requirements.txt" na raiz do projeto e dê "pip install -r requirements.txt"

---

## 3. Fazendo deploy do BackEnd

Certifique-se que está na us-east-1

Certifique-se que o Docker está "Engine Running"

Crie um usuario no IAM com as seguintes permissões: AdministratorAccess
                                                    AmazonEC2ContainerRegistryFullAccess
                                                    AmazonECS_FullAccess
                                                    AmazonElasticContainerRegistryPublicFullAccess
                                                    AmazonElasticContainerRegistryPublicPowerUser
                                                    AmazonElasticContainerRegistryPublicReadOnly
                                                    EC2InstanceProfileForImageBuilderECRContainerBuilds
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
Deve-se observar, é claro, que as politicas acima foram usadas de maneira irresponsável e não se deve fazer isso em ambiente produtivo ou de stage. Verificar quais politicas podem ser substituidas.
(O Administrador acess foi usado para driplar a necessidade da politica de permissão para escrever e ler no cloudformation que não foi achada por mim)

execute o "aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws", se der algum erro, 99% ser por causa de permissão, olhar a linha abaixo.

Caso o problema for algo relacionado ao docker não conseguir puxar as credenciais da AWS (Error saving credentials: error storing credentials - err: exit status 1, out: `not implemented`), vá para o arquivo "config.json" dentro do .docker e troque 'credsStore : "desktop"' por 'credsStore" : "ecr-login"' e entre no powershell com PERMISSÃO DE ADMINISTRADOR e use "choco install amazon-ecr-credential-helper". Salve tudo e execute dnv. Caso der errado, entre novamente no "config.json" e *apague* a linha do credsStore. Execute o comando novamente (foi assim que funcionou cmg, puro exploit sem sentido). Talvez não funcione com você, sendo assim, boa sorte!

o "cdk synth" não funciona se não indicar o caminho certinho, como: "cd Área de Trabalho\Threat-Modeling\threat_modelling_backend" e lá dentro manda o  'cdk synth --app "python Threat-Modeling/threat_modelling_backend/app.py"'

Se der um erro tipo "ModuleNotFoundError: No module named 'aws_cdk'", provavelmente quer dizer que o env do python não está rodando (vc tem que estar dentro dele e com os requirements lá dentro): 
(
    appdata==2.2.1
    click==8.1.8
    colorama==0.4.6
    colored==2.3.0
    to-requirements.txt==2.0.11
)

Provavelmente vai dar algum erro do genero: "Cannot find asset at C:\Users\SeuNome\Área de Trabalho\Threat Moddeling\backend\genai_core". Esse erro ocorre pois ele está puxando um grupo de arquivos, como por exemplo: "__innit__.py", outros arquivos .py e o requirements.txt, que não está nessa pasta, e sim em uma outra pasta com o mesmo nome que está dentro de "\genai_core", algo com  "\backend\genai_core\genai_core". A solução que eu achei foi dar um CTRL+X no conteudo do segundo "genai_core" e colar no primeiro "genai_core".

Agora, provavelmente vai dar outro erro similares ao de cima, só que em outra pasta chamada "graphql_api.py". Ele está procurando coisa em lugar errado. Entre nele e procure pela função "shared_layer = lambda_py.PythonLayerVersion" e corrija o caminho (entry) para 'entry="Threat-Modeling/threat_modelling_backend/backend/api/shared"', ; Pode trocar a linha inteira e cuidado para a identação não ficar errada.

Descrevi acima os erros que deram comigo, se foi tudo tranquilo contigo, pode prosseguir com "aws sts get-caller-identity" para pegar as informações da sua conta AWS e dê "cdk bootstrap aws://123456789012/us-east-1". *OBSERVE:* o 123456789 é o numero da sua conta que vc vai pegar com o "get-caller-identity"

Para dar "cdk deploy --all --require-approval=never", você deve estar em 'Threat-Modeling', ou seja, da um cd Área de Trabalho\Threat Moddeling\Threat-Modeling ou algo do genero e execute assim 'cdk deploy --all --require-approval=never --app "python Threat-Modeling/threat_modelling_backend/app.py"'

Se tudo der certo, vc deve montar o .env com os valores passados, *MAS ATENÇÃO*, como você pode ver pelo example.env, o prompt (por algum motivo) não vai de dar todos os values de output e a documentação nem escalarece se deve ser usado apenas os valores ou chaves + valores. Entre no cloudformation da sua conta AWS e pegue todos os values e chaves na mão lá. Sugiro armazenar num bloquinho de notas e colocar lá no example, mas fique de olho, pq provavelmente isso vai causar problemas. 

---

## 4. Mandar os samples pra s3

Não tende colocar os samples na mão, provavelmente vai dar problema. Use o código disponibilizado no README ou o que deixarei aqui abaixo:

1- Vá até a \threat_modelling_backend, com o 'cd'

2- Rode no bash: aws s3 cp samples/example_architecture.png s3://backendstack-threatmodeldatabucketd3863f79-roxfdt85dhnx/genai_core_examples/diagram_describer/
                 aws s3 cp samples/example_architecture.png.description s3://backendstack-threatmodeldatabucketd3863f79-roxfdt85dhnx/genai_core_examples/diagram_describer/

Ele já vai fazer o caminho bonitinho na s3 para armazenar os samples.

Os samples utilizados são os do projeto, mas é recomendado botar um monte para ele aprender melhor e mais rapido.

---

## 5. Verificar permissões do BEDROCK

Provavelmente o CDK já criou os lambda com permissão pra acessar o Bedrock e os modelos Claude, mas sempre bom dar uma verificada adicional:

1- Entre na sua conta AWS e vá para os Lambda
2- Clique na função  "BackendStack-ThreatModelGenerateAll[...]"
3- Vá em "configurations" e após isso "permissions"
4- Clique em "Execution roles > Resources" ou "Resumo de recursos > Por recurso" e procure por "Amazon Bedrock"

Agora, entre no menu do Bedrock e desça a barra lateral esquerda lá pra baixo e selecione "Model acess" ou "Acesso aos modelos".

Clique no botão amarelo para selecionar umas licenças e pegue a do:

    Anthropic Claude 3 – Haiku

    Anthropic Claude 3 – Sonnet

    Anthropic Claude 3.5 – Sonnet

De "Confirmar" e espere uns 30 minutos

Faça uma reza e vá para o FrondEnd

---

## 6. Prerequisitos do FrontEnd

