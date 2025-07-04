import { Router } from "express";
import { postEmail } from "../Handlers/postEmail";
import multer from "multer";

const uploader = multer()

const mailingrouter = Router();

mailingrouter.post('/post', uploader.fields([{ name: 'EmbededFile', maxCount: 1 }, { name: 'AdditionalFiles', maxCount: 100 }]) , postEmail)

export default mailingrouter;