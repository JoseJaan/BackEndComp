import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth.js';

export default (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const tokenData = authHeader.split(' ');
    if (tokenData.length !== 2) {
      return res.status(401).send({ error: 'O token fornecido não é válido' });
    }
    const [scheme, token] = tokenData;
    if (scheme.indexOf('Bearer') < 0) {
      return res.status(401).send({ error: 'O token fornecido não é válido' });
    }

    jwt.verify(token, authConfig.secret, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .send({ error: 'O token fornecido não é válido' });
      } else {
        req.isAdmin = decoded.isAdmin;
        req.uid = decoded.id;
        return next();
      }
    });
  } else {
    return res.status(401).send({ error: 'O token fornecido não é válido' });
  }
};
