# Markdown

## Introdução ao projeto

    -Tema: Sistema para aluguel de veículos

    -Testado com Insomnia

    -Trilha principal: BackEnd

    -Trilha secundária: Infra

    -Deploy realizado no Render, no seguinte link: https://rentacar-4y1u.onrender.com

## Como rodar

    -Como a aplicação não roda localmente, todas as operações são realizadas no seguinte link, com cada rota
    sendo detalhada posteriormente: https://rentacar-4y1u.onrender.com

    -Caso seja desejado, pode-se rodar o npm install para instalar o node_modules

## Tecnologias

    -NodeJs, JavaScript, MongoDB Atlas, Cloudinary

## Descrição:

    -A aplicação utiliza 4 schemas, sendo eles: User, Cars, Rents e History.

    -Todos os schemas foram pensados para garantir um funcionamento mais dinâmico e com mais possibilidades.

    -A aplicação trabalha com 3 tipos de usuários: deslogados, logados e administradores. Cada um possui
    diferentes permissões.

    -Informações de conexão com o MongoDB e Cloudinary foram mantidas dentro de um arquivo .env, para serem utilizadas
        como uma variável de ambiente e não ficarem expostas dentro do código (no GitHub, por ex).
        Todas essas variáveis também foram adicionadas às variáveis de ambiente dentro do Render, para o deploy ser realizado corretamente.

## Detalhamento dos schemas:

    -Cars:
            Define a estrutura de um veículo, contendo os seguintes campos:
        name, slug, brand, available, price, type, description, licensePlate, kilometers, featuredImage e images.

            O campo "slug" recebe o "name" do veículo após um processo de "Slugify", enquanto "brand"
        passa pelo mesmo processo para padronizar a escrita das brands.

            Cada carro possui uma "licensePlate" única, que deve ser escrita no seguinte formato:
        (LM = Letra Maíscula, NI = Número inteiro entre 0 e 9)
        LM LM LM NI LM NI NI
        (Escrever sem espaços)

            O campo "kilometers", do tipo Number, é atualizado toda vez após o encerramento de um aluguel, com o usuário
        adicionando quantos kilometros foram percorridos.
        A Boolean "available" é "true" enquanto o carro não está alugado.

    -User:
            Define a estrutura do usuário, contendo os seguintes campos:
        name, email, password, passwordResetToken, passwordResetTokenExpiration, createdAt, isAdmin.

            Cada usuário possui um email único.

            A Boolean "isAdmin" será verdadeira caso o email inserido seja igual a algum email existente dentro
        do próprio Schema do User (src/app/schemas/User.js), em uma função "pre save".

            A senha do usuário é criptografada também em uma função "pre save", utilizando o bcrypt.

    -Rents:
            Define a estrutura de um aluguel, contendo os seguintes campos:
        userName, userEmail, userId, carName, createdAt, endAt, licensePlate, carPrice, rentPrice.

            O campo "rentPrice" é calculado multiplicando o "carPrice" pela quantidade de dias que o carro estará alugado.

            Caso o aluguel dure menos de 1 dia, o valor do aluguel é o próprio preço do aluguel do carro.

    -History:
            Define a estrutura do históricos de alugueis, contendo os seguintes campos:
        userName, userEmail, userId, carName, createdAt, endedAt, licensePlate, carPrice, rentPrice, kilometersDriven.

## Detalhamento das rotas:

    -Rotas no src/app/controllers/Auth.js

        ->https://rentacar-4y1u.onrender.com/auth/register - POST
            Registra um novo usuário, verificando se já não existe alguma conta com o mesmo email.
            A partir desse momento, é definido se o usuário é um Admin ou não, com base no email inserido.
            A verificação se o email pertence a um administrador ocorre dentro da seguinte pasta: src/app/schemas/User.js
            A senha do usuário é criptografada dentro do schema do usuário

            Formato do Json no ambiente de testes: (No desenvolvimento desse projeto foi utilizado o Insomnia)
            {
                "name": "xxxx",
                "email": "yyyy",
                "password": "zzzz"
            }



        ->https://rentacar-4y1u.onrender.com/auth/login - POST
            Realiza o login do usuário, verificando se a conta existe e se a senha está correta.
            Gera um Token com validade de 3h que serve para autenticar o usuário em futuras operações.
            O Token contém o Id do usuário e a informação se ele é Admin ou não.
            Após token ser expedido, ele deve ser inserido no "Bearer Token" (Considerando o Insomnia).

            Formato do Json no ambiente de testes:
            {
                "email": "yyyy",
                "password": "zzzz"
            }



        ->https://rentacar-4y1u.onrender.com/auth/forgot-password - POST
            Envia um email para o usuário contendo um token que será utilizado para resetar a senha.
            Utiliza o NodeMailer e MailTrap para realizar o envio do email.
            O formato do email está contido no src/resources/mail/auth/forgot-password.html.
            O token possui duração de 3h.

            Detalhamento do envio de emails:
                    Com o Nodemailer e o MailTrap, utilizo o arquivo src/modules/Mailer.js para fazer o envio dos emails
                utilizando o template existante em src/resources/mail/auth/forgot-password.html.
                    Utilizo o arquivo src/config/mail.js para armazenar as informações de conexão com o MailTrap

            Formato do Json no ambiente de testes:
            {
                "email": "yyyy",
            }



        ->https://rentacar-4y1u.onrender.com/auth/reset-password - POST
            Reseta a senha do usuário se for inserido um token válido

            Formato do Json no ambiente de testes:
            {
                "email": "yyyy",
                "token": "aaaa",
                "newPassword": "ssss"
            }



        ->https://rentacar-4y1u.onrender.com/auth/delete-account - DELETE - Apenas logados
            Deleta a conta do usuário.
            Se o usuário possuir um aluguel ativo, não é possivel realizar a remoção.
            É necessário estar logado.


    -Rotas no src/app/controllers/Garage.js

        ->https://rentacar-4y1u.onrender.com/garage/get-cars - GET
            Lista todos os carros existentes no banco de dados
            Pode listar os carros de forma decrescente e crescente por preço da seguinte maneira:
                https://rentacar-4y1u.onrender.com/garage/get-cars?order=asc  ->crescente
                https://rentacar-4y1u.onrender.com/garage/get-cars?order=desc ->decrescente



        ->https://rentacar-4y1u.onrender.com/garage/:carSlug - GET
            Busca pelos veículos que possuem o slug inserido (nome do carro em minúsculo)



        ->https://rentacar-4y1u.onrender.com/garage/filter - GET
            Lista os carros com base nos filtros inseridos pelo usuário
            Possíveis links:
                https://rentacar-4y1u.onrender.com/garage/filter?brand=xxxx&type=yyyy,zzzz&available=true
                    (E todas suas variações após o "?")
                "available" pode assumir "true" ou "false"
                "brand" e "type" podem possuir mais de um filtro



        ->https://rentacar-4y1u.onrender.com/garage/post-cars?type=xxxx - POST - Apenas Admins
            Adiciona um novo carro ao banco de dados
            O "type" do carro deve ser inserido no link, não é possível adicionar um "type" que não esteja já
                especificado dentro do código

            Formato do Json no ambiente de testes:
            {
                "name": "yyy",
                "description": "aaa",
                "kilometers": 0,
                "licensePlate": "xxx",
                "available": true,
                "brand": "ttt",
                "price": 150
            }

            A "licensePlate" deve ser inserida no seguinte formato:
                (LM = Letra Maíscula, NI = Número inteiro entre 0 e 9)
                LM LM LM NI LM NI NI
                (Escrever sem espaços)


        ->https://rentacar-4y1u.onrender.com/garage/update-car/:carId?type=lll - PUT - Apenas Admins
            Atualiza as informações de um carro
            Se um nova "licensePlate" for inserida, é verificada sua validade
            O "type" deve ser inserido no link, da mesma forma como é feita na rota de adicionar um carro

            Formato do Json no ambiente de testes:
            {
                "name": "yyy",
                "description": "aaa",
                "kilometers": 0,
                "licensePlate": "xxx",
                "available": true,
                "brand": "ttt",
                "price": 150
            }


        ->https://rentacar-4y1u.onrender.com/garage/delete-car/:carId - DELETE - Apenas Admins
            Realiza a remoção de um carro
            Não é possível remover o carro caso ele esteja cadastrado em um aluguel ativo


        ->https://rentacar-4y1u.onrender.com/garage/featured-image/:carId - POST - Apenas Admins
            Adiciona uma "featuredImage" ao carro, que é armazenada no Cloudinary
            Para utilizar a rota no Insomnia, deve-se selecionar "Multipart Form", selecionar "value" como "file"
                e escrever "featuredImage" (sem as aspas) no "name"


        ->https://rentacar-4y1u.onrender.com/garage/search-car/:carId - GET - Apenas Admins
            Verifica se o carro buscado está em um aluguel no momento, se positivo, retorna os dados do aluguel

    -Rotas no src/app/controllers/Rentals.js

        ->https://rentacar-4y1u.onrender.com/rentals/get-rents - GET - Apenas Admins
            Lista todos os alugueis ativos


        ->https://rentacar-4y1u.onrender.com/rentals/view-rents - GET - Apenas logados
            Lista todos os alugueis ativos do usuário naquele momento


        ->https://rentacar-4y1u.onrender.com/rentals/post-rent:carId - POST - Apenas logados
            Cria um aluguel
            É verificado se o carro existe e está disponível
            Não é possível criar um aluguel
            O usuário deve inserir a data de início e fim do aluguel, todas as datas tem sua validade verificada
            Não é possível inserir uma data de início maior que 7 dias em relação a data atualizado

            Formato do Json no ambiente de testes:
            {
                "startDayMonth": "DD/MM"
                "endDayMonth": "DD/MM"
            }


        ->https://rentacar-4y1u.onrender.com/rentals/delete-rent:rentId - DELETE - Apenas logados
            Finaliza um aluguel
            Apenas o usuário criador daquele aluguel tem permissão para finaliza-lo
            O usuário insere quantos kilometros ele andou com o carro

            Formato do Json no ambiente de testes:
            {
                "kilometersDriven": 10
            }


        ->https://rentacar-4y1u.onrender.com/rentals/update-rent/:rentId - PUT - Apenas logados
            Atualiza a data final de um aluguel
            Apenas o usuário criador daquele aluguel tem permissão para atualiza-lo
            É possível extender ou diminuir a data de finalização

            Formato do Json no ambiente de testes:
            {
                "newEndDayMonth": "DD/MM"
            }


    -Rotas no src/app/controllers/Records.js

        ->https://rentacar-4y1u.onrender.com/records/view-history - GET - Apenas logados
            Lista todos os alugueis passados do usuário que requisitou a rota


        ->https://rentacar-4y1u.onrender.com/records/all-records - GET - Apenas admins
            Lista todos os alugueis passados, de qualquer pessoa

## Objetos já existentes dentro do banco de dados

    -Usuários:
        Usuário comum:
        {
            "name": "Pedro",
            "email": "pedro@outlook.com",
            "password": "12345"
        }
        Usuário comum:
        {
            "name": "Renato",
            "email": "renato@gmail.com",
            "password": "54321"
        }
        Admin:
        {
            "name": "Joaquim",
            "email": "admin@outlook.com",
            "password": "12345!A"
        }

## Créditos

- José Acerbi Almeida Neto :o
