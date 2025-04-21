Sugestão para ambiente de deploy:

Crar uma EC2 t3.micro ou small para deployment. Utilizar uma IAM Role na EC2 com permissões de acesso ao S3 e deploy para Cloudformation, ou temporariamente (https://docs.aws.amazon.com/prescriptive-guidance/latest/least-privilege-cloudformation/permissions-use-cloudformation.html)

Informações importantes:

 - Ordem de deploy: primeiro criarmos a stack de Backend (Threat_Modelling_Backend) e na sequênci a de Frontend (Threat_Modelling_Frontend)

 Sobre a Stack de Backend:
 
 - Faça update dos repositórios antes de executar as instalaçoes: sudo apt-get update
 - Instale as  dependencias, pacotes, awscli, aws cdk e conceda permissao para a Stack criar um container (Detalhes em https://stackoverflow.com/questions/48957195/how-to-fix-docker-got-permission-denied-issue)
 - Ativar env do Python (passos descritos no README.MD da Stack de Backend)
 - Criar pastas genai_core_examples/diagram_describer/ dentro do DataBucket e fazer upload dos Samples.
 - Os outputs da BAckendStack do Clouformation serão importantes para o FrontEnd.
 - Caso queira customizar a maneira que o Backend processa as informações para gerar os inputs, os detalhes de prompt estão localizados em backend/genai_core/genai_core/threads_generator.py


Sobre a Stack de FrontEnd

 - Instalar pacotes, dependencias (podemos rodar na mesma maquina)
 - Instalar node https://github.com/nodesource/distributions, curl
 - Criar o arquivo ENV como orientado no README.MD com os valores de output do CloudFormation
    OBS: Os nomes dos outputs a serem utilizados estão na coluna Value
 - IDentifique o Pool do Cognito criado pela Stack de Backend e crie usuarios no UserPool para poder autenticar no Front End
 - Siga os passos de Deployment detalhados no ReadME.MD. Lembre-se de que alguns comandos, como npm install, devem ser executados dentro de diretórios específicos (Detalhado no readme.md, mas fácil de passar batido).
 - Se algum comando falhar, valide permissões e se o diretório está correto.



