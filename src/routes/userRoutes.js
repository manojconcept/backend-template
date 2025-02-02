import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js'

import { 
    usersDetails,
    userBanstatus,
    userDetail,
    makeAdmin,
} from "../controllers/userController.js";

const router = express.Router();
router.use(multer().array());

router.get("",auth,usersDetails); 
router.post('',userDetail);
router.post('/admin',makeAdmin);
router.get("/ban-status/:username",userBanstatus);


export default router;