import express, { Router } from 'express';
import bodyParser from 'body-parser';
import { Garage, Auth, Rentals, Records } from './app/controllers/index.js';

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/garage', Garage);
app.use('/auth', Auth);
app.use('/rentals', Rentals);
app.use('/records', Records);

console.log(`Servidor rodando no link https://rentacar-4y1u.onrender.com`);

app.listen(port);
