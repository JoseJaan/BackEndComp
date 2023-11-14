import express, {Router} from "express";
import bodyParser from "body-parser";
//import { Garage, Auth, Rentals, Records, Uploads } from "./app/controllers";
import * as controllers from "./app/controllers";

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/garage', controllers.Garage);
app.use('/auth',controllers.Auth);
app.use('/rentals',controllers.Rentals);
app.use('/records', controllers.Records);
app.use('/uploads', controllers.Uploads)

console.log(`Servidor rodando no link http://localhost:${port}`);

app.listen(port);

