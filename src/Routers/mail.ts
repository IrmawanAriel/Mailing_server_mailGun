import { Router } from "express";
import { postEmail } from "../Handlers/postEmail";

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

const mailingrouter = Router();

mailingrouter.post('/post',multipartMiddleware, postEmail)

// mailingrouter.post('/post', postEmail)


export default mailingrouter; 