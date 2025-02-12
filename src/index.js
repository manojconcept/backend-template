import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import path from 'path';
import { fileURLToPath } from 'url';

import startServer from "./config/startServer.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from './routes/userRoutes.js';
import userAgent from "./middleware/custome.js";


const app = express();
const PORT = 3300;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
    origin: 'https://admin-panal-j2mxgye1b-manojconcepts-projects.vercel.app/', // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent with the request
  };
  
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/admin', userRoutes);

app.use(express.static(path.join(__dirname, 'src/images')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'images', 'noimageDark.svg'));
});

app.get('/ua', userAgent, (req, res) => {
    console.log(req.ip);
    res.send({ message: { ...req.uAgent } });
});

app.get('/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, 'images', imageName);

    res.sendFile(imagePath, (err) => {
        if (err) {
            res.status(404).send('Image not found');
        }
    });
});



startServer(app, PORT);

