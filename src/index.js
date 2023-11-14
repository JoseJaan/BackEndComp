import express, {Router} from "express";
import bodyParser from "body-parser";
import { Garage, Auth, Rentals, Records, Uploads } from "./app/controllers";

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/garage', Garage);
app.use('/auth',Auth);
app.use('/rentals',Rentals);
app.use('/records',Records);
app.use('/uploads', Uploads)

console.log(`Servidor rodando no link http://localhost:${port}`);

app.listen(port);

