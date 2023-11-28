import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import mailConfig from '../config/mail.js';

const host = process.env.MAIL_CONFIG_HOST;
const port = process.env.MAIL_CONFIG_HOST;
const user = process.env.MAIL_CONFIG_HOST;
const pass = process.env.MAIL_CONFIG_HOST;

const transport = nodemailer.createTransport({
  host: host,
  port: port,
  user: user,
  pass: pass,
});

transport.use(
  'compile',
  hbs({
    viewEngine: {
      extname: '.hbs',
      partialsDir: './src/resources/mail',
      layoutsDir: './src/resources/mail',
      defaultLayout: null,
    },
    viewPath: path.resolve('./src/resources/mail'),
    extName: '.html',
  }),
);

export default transport;
