import express from 'express';
import { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import MainRoute from './src/Routers/index';
dotenv.config();  // Env load environment variables

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

// const corsOptions = {
//     origin: ['https://vantage-office.kintone.com/'], //vite 8080
//     methods: "POST" // some legacy browsers (IE11, various SmartTVs) choke on 204
// }

// app.use(cors(corsOptions));

const Port = process.env.PORT || 8081;

app.listen(Port, () => {
    console.log(`Server is running on ${Port}`);
})

app.use(MainRoute); // call the main route here

export default app;