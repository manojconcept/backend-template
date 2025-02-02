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
    origin: 'http://localhost:3300/', // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent with the request
  };
  
app.use(cors(corsOptions));
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
    // console.log(req.uAgent);
    // console.log(req.uAgent.toAgent(),"browser");
    // console.log(req.uAgent.os.toString(),"os");
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

