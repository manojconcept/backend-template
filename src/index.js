import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';

import startServer from "./config/startServer.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from './routes/userRoutes.js';


const app = express();
const PORT = 3300;

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//middleware used globally;
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended : true}));

//Routes
app.use('/auth', authRoutes);
app.use('/admin',userRoutes);   

// app.use('/uploads/noimage', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'src/images')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'images', 'noimageDark.svg'));
});

// Route to handle dynamic image requests
app.get('/:imageName', (req, res) => {
    const imageName = req.params.imageName; // Get the image name from the URL
    const imagePath = path.join(__dirname, 'images', imageName);

    res.sendFile(imagePath, (err) => {
        if (err) {
            res.status(404).send('Image not found');
        }
    });
});

startServer(app, PORT);

