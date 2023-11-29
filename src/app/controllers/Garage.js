import { Router } from 'express';
import Cars from '../schemas/Cars.js';
import isAuthenticated from '../middlewares/Auth.js';
import fs from 'fs';
import isAdmin from '../middlewares/isAdmin.js';
import cloudinary from '../../database/cloudinary.config.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import Rents from '../schemas/Rents.js';

const router = new Router();

//Função para verificar se a licensePlate inserida pelo usuário está dentro do padrão
function verifyLicensePlate(input) {
  const regex = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;

  return regex.test(input);
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cld-sample-5',
    public_id: (req, file) => `featuredImage_${req.params.carId}`,
  },
});

const multerCloudinary = multer({ storage });

//Rota para listar todos os carros
//Qualquer pessoa pode ver, estando logada ou não
//Colocar um "Não disponível" nos carros que nao estiverem disponiveis
//Para crescente: https://rentacar-4y1u.onrender.com/garage/get-cars?order=asc
//Para decrescente: https://rentacar-4y1u.onrender.com/garage/get-cars?order=desc
router.get('/get-cars', (req, res) => {
  const order = req.query.order || 'asc';

  let sortOptions = {};
  if (order == 'asc') {
    sortOptions = { price: 1 };
  } else if (order == 'desc') {
    sortOptions = { price: -1 };
  }

  Cars.find()
    .sort(sortOptions)
    .then((data) => {
      const cars = data.map((car) => {
        return {
          name: car.name,
          type: car.type,
          description: car.description,
          licensePlate: car.licensePlate,
          price: car.price,
          id: car._id,
          featuredImage: car.featuredImage,
        };
      });
      res.send(cars);
    })
    .catch((error) => {
      console.error('Error listing cars', error);
      return res.status(500).send({
        error: 'Erro interno do servidor',
      });
    });
});

//Rota para buscar carro pelo slug
//Qualquer pessoa pode ver, estando logada ou nao
router.get('/:carSlug', (req, res) => {
  Cars.findOne({ slug: req.params.carSlug })
    .then((car) => {
      if (car) {
        return {
          name: car.name,
          type: car.type,
          description: car.description,
          licensePlate: car.licensePlate,
          price: car.price,
          id: car._id,
          featuredImage: car.featuredImage,
        };
      } else {
        return res.status(404).send({ message: 'Nenhum carro encontrado' });
      }
    })
    .catch((error) => {
      console.error('Error listing car', error);
      return res.status(400).send({
        error: 'Não foi possível obter o carro desejado. Tente novamente.',
      });
    });
});

//Rota para buscar todos os carros que possuem os dados digitados
//Usuário pode buscar por brand, type e available
//Qualquer pessoa pode ver, estando logada ou nao
//Pode possuir mais de um filtro: Cars.find({brand: req.body.brand, quantity: req.body.quantity})
router.get('/filter', (req, res) => {
  let searchOptions = {};

  const brand = req.query.brand;
  const type = req.query.type;
  const available = req.query.available || 'true';

  if (brand) {
    const desiredBrands = brand.split(',');
    searchOptions.brand = { $in: desiredBrands };
  }
  if (type) {
    const desiredTypes = type.split(',');
    searchOptions.type = { $in: desiredTypes };
  }
  if (available !== undefined) {
    searchOptions.available = available;
  }

  Cars.find(searchOptions)
    .then((car) => {
      if (car.length > 0) {
        return res.send(car);
      } else {
        return res.status(404).send({ message: 'Nenhum carro encontrado' });
      }
    })
    .catch((error) => {
      console.error('Error listing cars', error);
      return res.status(500).send({
        error: 'Não foi possível obter o carro desejado. Tente novamente.',
      });
    });
});

//Rota para adicionar um novo carro
//Apenas admins
//Verifica se um carro com a mesma placa já existe, caso contrário, cria o carro
//A placa do carro (licensePlate) deve estar formatada seguindo o padrão da função "VerificaCampo",
//  declarada no início do código
//Exemplo de link: https://rentacar-4y1u.onrender.com/garage/get-cars?type=sedan
router.post('/post-car', [isAuthenticated, isAdmin], (req, res) => {
  if (!req.query.type) {
    return res.status(400).send({ error: 'Nenhum modelo inserido' });
  }

  let type = 'Sedan';

  if (req.query.type == 'suv') {
    type = 'SUV';
  } else if (req.query.type == 'utilitario') {
    type = 'Utilitário';
  } else {
    return res.status(400).send({ error: 'Modelo inserido não existente' });
  }

  const {
    name,
    description,
    kilometers,
    licensePlate,
    available,
    brand,
    price,
  } = req.body;
  if (verifyLicensePlate(licensePlate)) {
    Cars.findOne({ licensePlate })
      .then((carData) => {
        if (carData) {
          return res
            .status(400)
            .send({ error: 'Carro com essa placa já existe' });
        } else {
          Cars.create({
            name,
            brand,
            description,
            kilometers,
            licensePlate,
            available,
            type,
            price,
          })
            .then((cars) => {
              return res.status(200).send(cars);
            })
            .catch((error) => {
              console.error('Error registering new car', error);
              return res.status(400).send({
                error:
                  'Não foi possível registrar novo carro. Tente novamente.',
              });
            });
        }
      })
      .catch((error) => {
        console.error('Error recovering cars from database', error);
        return res.status(500).send({ error: 'O cadastro falhou' });
      });
  } else {
    return res.status(403).send({
      message:
        'Não foi possível registrar novo carro. Verifique se a placa está correta.',
    });
  }
});

//Rota para atualizar dados do carro pelo Id
//Apenas Admins
//Verifica a existência do carro
//Se o usuário inserir uma featuredImage, a "featuredImage" antiga será apagada e nova sera adicionada
//Os dados inseridos são armazenados em "updatedData"
//É verificado separadamente se uma imagem foi inserida, para evitar o erro do programa tentar ler algo indefinido
//   caso não tenha nenhuma imagem
//"updatedData" é passada como parametro na atualização
router.put('/update-car/:carId', [isAuthenticated, isAdmin], (req, res) => {
  const {
    name,
    brand,
    description,
    kilometers,
    licensePlate,
    price,
    available,
  } = req.body;

  if (req.query.type) {
    let type = 'Sedan';

    if (req.query.type == 'suv') {
      type = 'SUV';
    } else if (req.query.type == 'utilitario') {
      type = 'Utilitário';
    } else {
      return res.status(400).send({ error: 'Modelo inserido não existente' });
    }
  }

  if (!verifyLicensePlate(licensePlate)) {
    return res.status(403).send({
      message:
        'Não foi possível registrar novo carro. Verifique se a placa está correta.',
    });
  } else {
    Cars.findOne({ licensePlate })
      .then((exist) => {
        if (!exist) {
          Cars.findById(req.params.carId)
            .then((car) => {
              if (!car) {
                return res.status(404).send({
                  error: 'Não foi possível encontrar o carro desejado.',
                });
              } else {
                const updatedData = {
                  name,
                  brand,
                  description,
                  kilometers,
                  licensePlate,
                  type,
                  price,
                  available,
                };

                Cars.findByIdAndUpdate(req.params.carId, updatedData, {
                  new: true,
                })
                  .then((cars) => {
                    return res.status(200).send(cars);
                  })
                  .catch((error) => {
                    console.error('Error updating car', error);
                    return res.status(500).send({
                      error:
                        'Não foi possível atualizar os dados do carro. Tente novamente.',
                    });
                  });
              }
            })
            .catch((error) => {
              console.error(
                'Error searching for car while updating car',
                error,
              );
              return res.status(500).send({
                error:
                  'Não foi possível atualizar os dados do carro. Tente novamente.',
              });
            });
        } else {
          return res.status(403).send({
            message:
              'Não foi possível registrar novo carro. Essa placa já foi cadastrada.',
          });
        }
      })
      .catch((error) => {
        console.error(
          'Error searching for licensePlate while updating car',
          error,
        );
        return res.status(500).send({
          error:
            'Não foi possível atualizar os dados do carro. Tente novamente.',
        });
      });
  }
});

//Rota para deletar carro pelo Id
//Verifica a existência do carro
//Apenas Admin
router.delete('/delete-car/:carId', [isAuthenticated, isAdmin], (req, res) => {
  Cars.findById(req.params.carId)
    .then((car) => {
      const licensePlate = car.licensePlate;
      Rents.findOne({ licensePlate })
        .then((rent) => {
          if (rent) {
            return res.status(400).send({
              message:
                'Impossível remover carro, existe um aluguel ativo com ele',
            });
          } else {
            if (car) {
              Cars.findByIdAndRemove(req.params.carId)
                .then(() => {
                  return res.send({ message: 'Carro removido com sucesso.' });
                })
                .catch((error) => {
                  console.error('Error removing car from database', error);
                  return res
                    .status(500)
                    .send({ message: 'Erro interno do servidor' });
                });
            } else {
              return res.status(404).send({
                error: 'Não foi possível encontrar o carro desejado.',
              });
            }
          }
        })
        .catch((error) => {
          console.error(
            'Error searching for rent while removing car from database',
            error,
          );
          return res.status(500).send({ message: 'Erro interno do servidor' });
        });
    })
    .catch((error) => {
      console.error(
        'Error searching for car while removing car from database',
        error,
      );
      return res.status(500).send({ message: 'Erro interno do servidor' });
    });
});

//Adicionar featuredImage pelo id
router.post(
  '/featured-image/:carId',
  [isAuthenticated, isAdmin, multerCloudinary.single('featuredImage')],
  (req, res) => {
    const { file } = req;

    if (file) {
      Cars.findByIdAndUpdate(
        req.params.carId,
        {
          $set: {
            featuredImage: file.path,
          },
        },
        { new: true },
      )
        .then((car) => {
          if (car) {
            return res.send({ car });
          } else {
            return res.status(404).send({
              error: 'Não foi possível encontrar o carro desejado.',
            });
          }
        })
        .catch((error) => {
          console.error('Error associating image to car', error);
          return res.status(500).send({
            error:
              'Não foi possível cadastrar imagem ao carro. Tente novamente.',
          });
        });
    } else {
      return res.status(400).send({ error: 'Nenhuma imagem enviada' });
    }
  },
);

router.get('/search-car/:carId', [isAuthenticated, isAdmin], (req, res) => {
  Cars.findById(req.params.carId)
    .then((car) => {
      if (!car) {
        return res.status(404).send({ message: 'Carro não encontrado' });
      } else {
        Rents.findOne(car.licensePlate)
          .then((rent) => {
            if (!rent) {
              return res
                .status(200)
                .send({ message: 'Carro não está em nenhum aluguel ativo' });
            } else {
              return {
                userName: rent.userName,
                userEmail: rent.userEmail,
                creatAt: rent.createdAt,
                endAt: rent.endAt,
                id: rent._id,
                rentPrice: rent.rentPrice,
              };
            }
          })
          .catch((error) => {
            console.error(
              'Error searching for rent while searching car in rents',
              error,
            );
            return res
              .status(500)
              .send({ message: 'Erro interno do servidor' });
          });
      }
    })
    .catch((error) => {
      console.error(
        'Error searching for car while searching car in rents',
        error,
      );
      return res.status(500).send({ message: 'Erro interno do servidor' });
    });
});

export default router;
