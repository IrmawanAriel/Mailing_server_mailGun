import express from 'express';
import { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import MainRoute from './src/Routers/index';
dotenv.config();  // Env load environment variables
import cors from "cors"; // Import cors


// inisialization app as an express function
const app = express();

// buat app handler untuk route API for testing purposes   
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to the API!' });
})

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.use(cors({
    origin: ['https://vantage-office.kintone.com', "https://vantage-office.kintone.com"], // Izinkan semua origin (ubah jika perlu)
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
    credentials: true
}));

const Port = process.env.PORT || 8081;

app.listen(Port, () => {
    console.log(`Server is running on ${Port}`);
})

app.use(MainRoute); // call the main route here

export default app;