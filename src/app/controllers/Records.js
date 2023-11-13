import { Router } from 'express';
import Cars from '../schemas/Cars';
import User from '../schemas/User';
import Rents from '../schemas/Rents';
import isAuthenticated from '../middlewares/Auth';
import History from '../schemas/History';
import isAdmin from '../middlewares/isAdmin';

const router = new Router();

//Faço uma busca por todos os alugueis que possuem o Id do usuário
//Se nada for encontrado, o tamanho de "data" será 0
//Com "data.length > 0" verifico se algo foi encontrado, se sim, retorno o dado, caso contrário, retorno o erro
router.get('/view-history', isAuthenticated, (req, res) => {
  const UserId = req.uid;

  History.find({ UserId })
    .then((data) => {
      if (data.length > 0) {
        return res.send(data);
      } else {
        return res.status(404).send({ message: 'Nenhum aluguel encontrado' });
      }
    })
    .catch((error) => {
      console.error('Error listing rent history', error);
      return res.status(500).send({ error: 'Erro interno do servidor' });
    });
});

//Rota para listar todos os históricos
//Apenas Admins
router.get('/all-records', [isAuthenticated, isAdmin], (req, res) => {
  History.find()
    .then((data) => {
      const rents = data.map((records) => {
        return {
          UserName: records.UserName,
          UserId: records.UserId,
          CarName: records.CarName,
          CarLicensePlate: records.CarLicensePlate,
          CreatedAt: records.CreatedAt,
          EndedAt: records.EndedAt,
          RentPrice: records.RentPrice,
        };
      });
      res.send(rents);
    })
    .catch((error) => {
      console.error('Error listing rents', error);
      return res.status(500).send({
        error: 'Erro interno do servidor',
      });
    });
});

export default router;
