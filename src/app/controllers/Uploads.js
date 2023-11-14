import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import isAdmin from '../middlewares/isAdmin.js';
import isAuthenticated from '../middlewares/Auth.js';

const router = new Router();

//tem que ser so adm
//Na verdade acho que não precisa ser só admin -- 04/11 - 08:43
router.get('/images/:filename', [isAuthenticated, isAdmin], (req, res) => {
  const filePath = path.resolve(`./uploads/images/${req.params.filename}`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send({ error: 'Arquivo não encontrado' });
    } else {
      return res.sendFile(filePath);
    }
  });
});

export default router;
