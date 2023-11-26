import { Router } from 'express';
import bcrypt from 'bcryptjs';
import authConfig from '../../config/auth.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../schemas/User.js';
import Mailer from '../../modules/Mailer.js';
import isAuthenticated from '../middlewares/Auth.js';
import Rents from '../schemas/Rents.js';

const router = new Router();

//Rota para registro de usuário
//Se for encontrada uma conta com o email inserido, o registro não é permitido
router.post('/register', (req, res) => {
  const { email, name, password } = req.body;

  User.findOne({ email })
    .then((userData) => {
      if (userData) {
        return res.status(400).send({ error: 'Usuário já existe' });
      } else {
        User.create({ name, email, password })
          .then((user) => {
            user.password = undefined;
            user.isAdmin = undefined;
            return res.send(user);
          })
          .catch((error) => {
            console.error('Error saving new user in database', error);
            return res.status(500).send({ error: 'O cadastro falhou' });
          });
      }
    })
    .catch((error) => {
      console.error('Error recovering users from database', error);
      return res.status(500).send({ error: 'O cadastro falhou' });
    });
});

//Rota para login do usuário
//Verifica a existência do usuário e gera um bearer token a ser utilizado em outras rotas
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email })
    //forçar a vinda da senha
    .select('+password')
    .select('+isAdmin')
    .then((user) => {
      if (user) {
        bcrypt
          .compare(password, user.password)
          .then((result) => {
            if (result) {
              const token = jwt.sign(
                { id: user.id, isAdmin: user.isAdmin },
                authConfig.secret,
                { expiresIn: 10800 },
              );
              return res.send({ token: token, tokenExpiration: '3h' });
            } else {
              return res.status(400).send({ error: 'Senha incorreta' });
            }
          })
          .catch((error) => {
            console.error('Error cheking password', error);
            return res.status(500).send({ error: 'Erro interno do servidor' });
          });
      } else {
        return res.status(404).send({ error: 'Usuário nao encontrado' });
      }
    })
    .catch((error) => {
      console.error('Error loging user', error);
      return res.status(500).send({ error: 'Erro interno do servidor' });
    });
});

//Rota para usuário receber token de recuperação de senha
//Envia um token de recuperação no email inserido
//Token é posteriormente utilizado na "reset-password"
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        const token = crypto.randomBytes(20).toString('hex');
        const expiration = new Date();
        expiration.setHours(new Date().getHours() + 3);

        User.findByIdAndUpdate(user.id, {
          $set: {
            passwordResetToken: token,
            passwordResetTokenExpiration: expiration,
          },
        })
          .then(() => {
            Mailer.sendMail(
              {
                to: email,
                from: 'webmaster@testeexpress.com',
                template: 'auth/forgot_password',
                context: { token },
              },
              (error) => {
                if (error) {
                  console.error('Error sending email', error);
                  return res
                    .status(500)
                    .send({ error: 'Erro ao enviar email de recuperação' });
                } else {
                  return res.send();
                }
              },
            );
          })
          .catch((error) => {
            console.error('Error saving recuperation password token', error);
            return res.status(500).send({ error: 'Erro interno do servidor' });
          });
      } else {
        return res.status(404).send({ error: 'Usuário nao encontrado' });
      }
    })
    .catch((error) => {
      console.error('Error in the forgot-password', error);
      return res.status(500).send({ error: 'Erro interno do servidor' });
    });
});

//Rota para usuário resetar a senha
//Insere o email, a nova senha e o token recebido no email pela "/forgot-password"
//Verifica a validade do token e troca a senha
router.post('/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;

  User.findOne({ email })
    .select('+passwordResetToken passwordResetTokenExpiration')
    .then((user) => {
      if (user) {
        if (
          token != user.passwordResetToken ||
          new Date().now > user.passwordResetTokenExpiration
        ) {
          return res.status(400).send({ error: 'Token invalido' });
        } else {
          user.passwordResetToken = undefined;
          user.passwordResetTokenExpiration = undefined;
          user.password = newPassword;

          user
            .save()
            .then(() => {
              return res.send({ message: 'Senha trocada com sucesso' });
            })
            .catch((error) => {
              console.error('Error saving new password', error);
              return res
                .status(500)
                .send({ error: 'Erro interno do servidor' });
            });
        }
      } else {
        return res.status(404).send({ error: 'Usuário nao encontrado' });
      }
    })
    .catch((error) => {
      console.error('Error in the reset-password', error);
      return res.status(500).send({ error: 'Erro interno do servidor' });
    });
});

//Rota para usuário deletar a conta
//Deve estar autenticado
//Primeiro é verificado se existe um aluguel ativo na conta do usuário, se tiver, a remoção é rejeitada
//Se não tiver nenhum aluguel, a conta é deletada
router.delete('/delete-account', isAuthenticated, (req, res) => {
  const UserId = req.uid;

  Rents.findOne({ UserId })
    .then((rent) => {
      if (rent) {
        return res.status(403).send({
          message:
            'Impossível remover a conta, existe um aluguel ativo relacionado à ela.',
        });
      } else {
        User.findByIdAndDelete(UserId)
          .then((user) => {
            if (user) {
              return res.send({ message: 'Conta removida com sucesso.' });
            }
          })
          .catch((error) => {
            console.error('Error deleting user', error);
            return res.status(500).send({ error: 'Erro interno do servidor' });
          });
      }
    })
    .catch((error) => {
      console.error('Error searching for rents while deleting user', error);
      return res.status(500).send({ error: 'Erro interno do servidor' });
    });
});

export default router;
