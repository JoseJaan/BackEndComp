import { Router } from 'express';
import Cars from '../schemas/Cars.js';
import Slugify from '../../utils/Slugify.js';
import isAuthenticated from '../middlewares/Auth.js';
import Multer from '../middlewares/Multer.js';
import fs from 'fs';
import isAdmin from '../middlewares/isAdmin.js';
import path from 'path';

const router = new Router();

//Função para verificar se a licensePlate inserida pelo usuário está dentro do padrão
function VerifyLicensePlate(input) {
  const regex = /^[A-Za-z]{3}[0-9]{1}[A-Za-z]{1}[0-9]{2}$/;

  return regex.test(input);
}

//Rota para listar todos os carros
//Qualquer pessoa pode ver, estando logada ou não
//Colocar um "Não disponível" nos carros que nao estiverem disponiveis
router.get('/cars', (req, res) => {
  Cars.find()
    .then((data) => {
      const cars = data.map((car) => {
        return {
          name: car.name,
          type: car.type,
          description: car.description,
          licensePlate: car.licensePlate,
          price: car.price,
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
        return res.send(car);
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
router.post('/filter', (req, res) => {
  const { brand, type, available } = req.body;
  const searchOptions = {};

  if (brand !== undefined) {
    searchOptions.brand = brand;
  }
  if (type !== undefined) {
    searchOptions.type = type;
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
router.post('/post-car', [isAuthenticated, isAdmin], (req, res) => {
  const {
    name,
    brand,
    description,
    kilometers,
    licensePlate,
    available,
    type,
    price,
  } = req.body;
  if (VerifyLicensePlate(licensePlate)) {
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
router.put(
  '/update-car/:carId',
  [isAuthenticated, isAdmin, Multer.single('featuredImage')],
  (req, res) => {
    const {
      name,
      brand,
      quantity,
      description,
      kilometers,
      licensePlate,
      type,
      price,
      available,
    } = req.body;
    const { file } = req;
    let slug = undefined;
    if (name) {
      slug = Slugify(name);
    }

    if (VerifyLicensePlate(licensePlate)) {
      Cars.findOne({ licensePlate })
        .then((exist) => {
          if (!exist) {
            Cars.findById(req.params.carId)
              .then((car) => {
                if (!car) {
                  return res.status(404).send({
                    error: 'Não foi possível encontrar o carro desejado.',
                  });
                }
                if (file && car.featuredImage && car.featuredImage.length > 0) {
                  fs.unlinkSync(car.featuredImage);
                }
                const updatedData = {
                  name,
                  slug,
                  brand,
                  quantity,
                  description,
                  kilometers,
                  licensePlate,
                  type,
                  price,
                  available,
                };
                if (file) {
                  updatedData.featuredImage = file.path;
                }
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
              })
              .catch((error) => {
                console.error(
                  'Error deleting featured image while updating car',
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
    } else {
      return res.status(403).send({
        message:
          'Não foi possível registrar novo carro. Verifique se a placa está correta.',
      });
    }
  },
);

//Rota para deletar carro pelo Id
//Verifica a existência do carro
//Apenas Admin
router.delete('/delete-car/:carId', [isAuthenticated, isAdmin], (req, res) => {
  Cars.findById(req.params.carId)
    .then((car) => {
      if (car) {
        if (car.featuredImage && car.featuredImage.length > 0) {
          fs.unlinkSync(car.featuredImage);
        }
        if (car.images && car.images.length > 0) {
          car.images.forEach((image) => {
            fs.unlinkSync(image);
          });
        }
        Cars.findByIdAndRemove(req.params.carId)
          .then(() => {
            return res.send({ message: 'Carro removido com sucesso.' });
          })
          .catch((error) => {
            console.error('Error removing car from database', error);
            return res.status(500).send({ message: 'Erro ao remover carro' });
          });
      } else {
        return res.status(404).send({
          error: 'Não foi possível encontrar o carro desejado.',
        });
      }
    })
    .catch((error) => {
      console.error(
        'Error searching for car while removin from database',
        error,
      );
      return res.status(500).send({ message: 'Erro ao remover carro' });
    });
});

//Rota par adicionar featured image ao carro pelo Id
//Verifica a existência do carro
//Apenas adm
router.post(
  '/featured-image/:carId',
  [isAuthenticated, isAdmin, Multer.single('featuredImage')],
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

//apenas admin
//adicionar imagens ao carro
router.post(
  '/images/:carId',
  [isAuthenticated, isAdmin, Multer.array('images')],
  (req, res) => {
    const { files } = req;
    if (files && files.length > 0) {
      const images = [];
      files.forEach((file) => {
        images.push(file.path);
      });
      Cars.findByIdAndUpdate(
        req.params.carId,
        { $set: { images } },
        { new: true },
      )
        .then((car) => {
          return res.send({ car });
        })
        .catch((error) => {
          console.error('Error associating images to car', error);
          return res.status(500).send({
            error:
              'Não foi possível cadastrar imagens ao carro. Tente novamente.',
          });
        });
    } else {
      return res.status(400).send({ error: 'Nenhuma imagem enviada' });
    }
  },
);

export default router;
//module.exports = router;
