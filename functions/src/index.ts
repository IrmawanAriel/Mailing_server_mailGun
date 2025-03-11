import * as functions from "firebase-functions";
import express, { Response, Request } from "express";
import cors from "cors";
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import MainRoute from "../../src/Routers/index";

dotenv.config();

admin.initializeApp();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: "multipart/form-data", limit: "10mb" })); // Tambahkan raw parser


app.use(cors({
  origin: ['https://vantage-office.kintone.com'],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  credentials: true
}));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Firebase with Express.js");
});

app.use(MainRoute as any);

exports.api = functions.https.onRequest(app);
