import { Router } from "express";
import mailingrouter from "./mail";

const MainRoute = Router();

MainRoute.use('/email', mailingrouter) ;

export default MainRoute;

