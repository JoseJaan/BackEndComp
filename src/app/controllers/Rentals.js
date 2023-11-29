import { Router } from 'express';
import Cars from '../schemas/Cars.js';
import User from '../schemas/User.js';
import Rents from '../schemas/Rents.js';
import isAuthenticated from '../middlewares/Auth.js';
import History from '../schemas/History.js';
import isAdmin from '../middlewares/isAdmin.js';

const router = new Router();

//Visualizar alugueis ativos
//Apenas admin
router.get('/get-rents', [isAuthenticated, isAdmin], (req, res) => {
  Rents.find()
    .then((data) => {
      const rents = data.map((rent) => {
        return {
          UserName: rent.userName,
          UserEmail: rent.userEmail,
          CarName: rent.carName,
          LicensePlate: rent.licensePlate,
          CreatedAt: rent.createdAt,
          id: rent._id,
        };
      });
      return res.send(rents);
    })
    .catch((error) => {
      console.error('Error listing rents', error);
      return res.status(500).send({
        error: 'Não foi possível listar os alugueis. Tente novamente.',
      });
    });
});

//Faço uma busca por todos os alugueis que possuem o Id do usuário
//Se nada for encontrado, o tamanho de "data" será 0
//Com "data.length > 0" verifico se algo foi encontrado, se sim, retorno o dado, caso contrário, retorno o erro
router.get('/view-rents', isAuthenticated, (req, res) => {
  const userId = req.uid;

  Rents.find({ userId })
    .then((data) => {
      const rents = data.map((rent) => {
        return {
          id: rent._id,
          rentPrice: rent.rentPrice,
          carName: rent.carName,
          licensePlate: rent.licensePlate,
          createdAt: rent.createdAt,
          endAt: rent.endAt,
        };
      });
      return res.send(rents);
    })
    .catch((error) => {
      console.error('Error listing user rent ', error);
      return res.status(500).send({ error: 'Erro interno do servidor' });
    });
});

//Cadastrar um novo aluguel
/*
Primeiro: verifico se existe um carro com o id recebido no link
Segundo: verifico se o carro está disponível no estoque (available: true)
Terceiro: crio um cadastro de aluguel e atualizo o registro do carro tornando o available false
*/
router.post('/post-rent/:carId', isAuthenticated, (req, res) => {
  const uid = req.uid;

  const { startDayMonth, endDayMonth } = req.body;
  const currentYear = new Date().getFullYear();

  if (!startDayMonth || !endDayMonth) {
    return res
      .status(400)
      .send({ error: 'Pelo menos uma data não foi inserida.' });
  }

  const [startMonth, startDay] = startDayMonth.split('/');
  const [endMonth, endDay] = endDayMonth.split('/');

  const createdAt = new Date(`${currentYear}-${startMonth}-${startDay}`);
  const endAt = new Date(`${currentYear}-${endMonth}-${endDay}`);

  if (
    isNaN(createdAt) ||
    isNaN(endAt) ||
    createdAt < Date.now() ||
    createdAt > endAt ||
    endAt < Date.now()
  ) {
    res.status(400).send({ error: 'Pelo menos uma das datas é inválida' });
  }
  const milliseconds = Math.abs(createdAt - new Date());
  let days = Math.ceil(milliseconds / (1000 * 60 * 60 * 24));

  if (days < 7) {
    User.findById(uid)
      .then((user) => {
        Cars.findByIdAndUpdate(
          { _id: req.params.carId, available: true },
          { $set: { available: false } },
          { new: true },
        )
          .then((car) => {
            if (car) {
              const userName = user.name;
              const userId = user.id;
              const userEmail = user.email;
              const carName = car.name;
              const licensePlate = car.licensePlate;
              const carPrice = car.price;

              let rentPrice = carPrice;
              const milliseconds = Math.abs(endAt - createdAt);
              days = Math.ceil(milliseconds / (1000 * 60 * 60 * 24));

              if (days !== 1) {
                rentPrice = days * carPrice;
              }

              Rents.create({
                userName,
                carName,
                userId,
                userEmail,
                licensePlate,
                carPrice,
                createdAt,
                endAt,
                rentPrice,
              })
                .then((rents) => {
                  return res.status(200).send(rents);
                })
                .catch((error) => {
                  Cars.findByIdAndUpdate(
                    { _id: req.params.carId },
                    { $set: { available: true } },
                    { new: true },
                  )
                    .then(() => {
                      console.error('Error registering new rent', error);
                      return res.status(400).send({
                        message:
                          'Não foi possível cadastrar o aluguel, tente novamente',
                      });
                    })
                    .catch((revertError) => {
                      console.error(
                        'Error reverting available status to true',
                        revertError,
                      );
                      return res.status(500).send({
                        error:
                          'Erro interno do servidor (revertendo available)',
                      });
                    });
                });
            } else {
              return res
                .status(400)
                .send({ error: 'Carro não encontrado ou não disponível' });
            }
          })
          .catch((error) => {
            console.error(
              'Error searching for car while registering new rent',
              error,
            );
            return res.status(500).send({ error: 'Erro interno do servidor' });
          });
      })
      .catch((error) => {
        console.error(
          'Error searching for user while registering new rent',
          error,
        );
        return res.status(500).send({ error: 'Erro interno do servidor' });
      });
  } else {
    return res.status(403).send({
      message:
        'Não é possível cadastrar um aluguel para uma data superior à 7 dias',
    });
  }
});

//Deletar aluguel
//Cadastrados
/*
Primeiro: Procuro o usuário pelo Id do middleware
Segundo: Procuro o aluguel pelo Id do link
Terceiro: Verifico se o id do usuário e o id do user dentro do aluguel são iguais
Quarto: Procuro e atualizo o status available do carro com base na licensePlate que está dentro do aluguel
Quinto: deleto o aluguel
*/
router.delete('/delete-rent/:rentId', isAuthenticated, (req, res) => {
  const uid = req.uid;
  const kilometersDriven = Number(req.body.kilometersDriven);

  User.findById(uid)
    .then((user) => {
      Rents.findById(req.params.rentId)
        .then((rent) => {
          console.log(rent.userId);
          console.log(uid);
          if (rent.userId == uid) {
            const licensePlate = rent.licensePlate;
            Cars.findOneAndUpdate(
              { licensePlate },
              {
                $set: { available: true },
                $inc: { kilometers: kilometersDriven },
              },
              { new: true },
            )
              .then(() => {
                const userName = user.name;
                const userId = user.id;
                const carName = rent.carName;
                const carLicensePlate = licensePlate;
                const createdAt = rent.createdAt;
                const carPrice = rent.carPrice;
                const kilometersDriven = kilometersDriven;
                const rentPrice = rent.rentPrice;
                const userEmail = user.email;

                History.create({
                  userName,
                  userId,
                  carName,
                  carLicensePlate,
                  createdAt,
                  carPrice,
                  kilometersDriven,
                  rentPrice,
                  userEmail,
                })
                  .then(() => {
                    Rents.findByIdAndRemove(req.params.rentId)
                      .then(() => {
                        return res
                          .status(200)
                          .send({ message: 'Aluguel removido com sucesso!' });
                      })
                      .catch((error) => {
                        console.error(
                          'Error removing rent while removing rent from database',
                          error,
                        );
                        return res
                          .status(500)
                          .send({ message: 'Erro ao remover aluguel' });
                      });
                  })
                  .catch((error) => {
                    console.error(
                      'Error creating rent record while removing rent from database',
                      error,
                    );
                    return res
                      .status(400)
                      .send({ message: 'Erro ao remover aluguel' });
                  });
              })
              .catch((error) => {
                console.error(
                  'Error updating car while removing rent from database',
                  error,
                );
                return res
                  .status(400)
                  .send({ message: 'Erro ao remover aluguel' });
              });
          } else {
            return res.status(403).send({
              message: 'Você não tem permissão para remover esse aluguel',
            });
          }
        })
        .catch((error) => {
          console.error(
            'Error searching for rent while removing rent from database',
            error,
          );
          return res.status(500).send({ message: 'Erro ao remover aluguel' });
        });
    })
    .catch((error) => {
      console.error(
        'Error searching for user while removing rent from database',
        error,
      );
      return res.status(500).send({ message: 'Erro ao remover aluguel' });
    });
});

//Atualizar data de finalização do aluguel
//Cadastrados
/*
Procuro o aluguel pelo Id
Verifico se o UserId no aluguel é o mesmo que o do user que está acessando
Valido data inserida e calculo novo preço
Atualizo aluguel
*/
router.put('/update-rent/:rentId', isAuthenticated, (req, res) => {
  const newEndDayMonth = req.body;

  if (!newEndDayMonth) {
    return res.status(400).send({ error: 'Data não inserida.' });
  }

  const [endDay, endMonth] = newEndDayMonth.split('/');
  const currentYear = new Date().getFullYear();

  const endAt = new Date(`${currentYear}-${endMonth}-${endDay}`);

  Rents.findById(req.params.rentId)
    .then((rent) => {
      if (!rent) {
        return res.status(404).send({
          error: 'Aluguel não encontrado',
        });
      }
      if (!endAt) {
        return res.status(400).send({
          error: 'Data não inserida',
        });
      }
      if (rent.userId == req.uid) {
        const CreatedAt = rent.createdAt;
        let rentPrice = rent.carPrice;

        if (endAt > Date.now()) {
          const milliseconds = Math.abs(endAt - CreatedAt);
          const days = Math.ceil(milliseconds / (1000 * 60 * 60 * 24));

          if (days !== 1) {
            rentPrice = days * rent.carPrice;
          }
          Rents.findByIdAndUpdate(
            req.params.rentId,
            { rentPrice, endAt },
            {
              new: true,
            },
          )
            .then((updatedRent) => {
              return res.status(200).send(updatedRent);
            })
            .catch((error) => {
              console.error('Error updating rent while updating rent', error);
              return res.status(500).send({
                error:
                  'Não foi possível atualizar os dados do aluguel. Tente novamente.',
              });
            });
        } else {
          return res.status(400).send({
            error: 'A data inserida é inválida',
          });
        }
      } else {
        return res.status(401).send({
          error: 'Você não possui autorização para alterar esse aluguel',
        });
      }
    })
    .catch((error) => {
      console.error('Error updating rent while searching for rent', error);
      return res.status(500).send({
        error:
          'Não foi possível atualizar os dados do aluguel. Tente novamente.',
      });
    });
});

export default router;
