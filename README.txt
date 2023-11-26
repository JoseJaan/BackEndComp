Autor: José Acerbi Almeida Neto

Tema: Sistema para aluguel de veículos

Desenvolvido utilizando NodeJs, JavaScript e MongoDB

==================================================

Descrição:
    A aplicação utiliza 4 schemas, sendo eles: User, Cars, Rents e History.
    Todos os schemas são utilizados para garantir um funcionamento mais dinâmico e com mais possibilidades.

==================================================
Detalhamento dos schemas:

Cars:
    Define a estrutura de um veículo, contendo os seguintes campos:
        name, slug, brand, available, price, type, description, licensePlate, kilometers, featuredImage e images.
        O campo "slug" recebe o "name" do veículo após um processo de "Slugify", enquanto "brand" passa pelo mesmo processo 
            para padronizar a escrita das brands.
        Cada carro possui uma "licensePlate" única, que deve ser escrita no seguinte formato: 
            (LM = Letra Maíscula, NI = Número inteiro entre 0 e 9)
            LM LM LM NI LM NI NI
            (Escrever sem espaços)
        O campo "kilometers", do tipo Number, é atualizado toda vez após o encerramento de um aluguel, com o usuário
            adicionando quantos kilometros foram percorridos.
        A Boolean "available" é "true" enquanto o carro não está alugado.

User:
    Define a estrutura do usuário, contendo os seguintes campos:
        name, email, password, passwordResetToken, passwordResetTokenExpiration, createdAt, isAdmin.
        Cada usuário possui um email único.
        A Boolean "isAdmin" será verdadeira caso o email inserido seja igual a algum email existente dentro do próprio
            Schema do User, em uma função "pre save".
        A senha do usuário é criptografada também em uma função "pre save", utilizando o bcrypt.

Rents:
    Define a estrutura de um aluguel, contendo os seguintes campos:
        userName, userEmail, userId, carName, createdAt, endAt, licensePlate, carPrice, rentPrice.
        O campo "rentPrice" é calculado multiplicando o "carPrice" pela quantidade de dias que o carro estará alugado.
        Caso o aluguel dure menos de 1 dia, o valor do aluguel é o próprio preço do aluguel do carro.

History:
    Define a estrutura do históricos de alugueis, contendo os seguintes campos:
        userName, userEmail, userId, carName, createdAt, endedAt, licensePlate, carPrice, rentPrice, kilometersDrive.

==================================================
Detalhamento das rotas:



        

    



