import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';

import startServer from "./config/startServer.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from './routes/userRoutes.js';
import userAgent from "./middleware/custome.js";

import { jwtDecoder, jwtVerifier, isJWTExpired,genJwtToken } from "./config/authentication.js";


const app = express();
const PORT = 3300;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

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




console.log(isJWTExpired('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OWU1MTk1ZThmYWQ1MWFiNjhkMzZkOCIsImlhdCI6MTczODQyOTQ3NCwiZXhwIjoxNzM5MDM0Mjc0fQ.1dDyi52Gr3jzlKYja5M--mznHrfmQHQrZfv6RX-nuHk', process.env.REFRESH_TOKEN_SECRET_KEY))


startServer(app, PORT);

