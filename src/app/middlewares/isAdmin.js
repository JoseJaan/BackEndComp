import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';

//Não é verificada a validade do token pois isso já é feito no Middleware "isAuthenticated"

export default (req, res, next) => {
  const authHeader = req.headers.authorization;

  const tokenData = authHeader.split(' ');

  const [scheme, token] = tokenData;

  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: 'O token fornecido não é válido' });
    } else {
      if (decoded.isAdmin) {
        return next();
      } else {
        return res
          .status(403)
          .send({ message: 'Acesso restrito à administradores.' });
      }
    }
  });
};
