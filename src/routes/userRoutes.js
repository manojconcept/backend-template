import express from 'express';
import { 
    usersDetails,
    banUser,
    unbanUser,
    userDetail,
    makeAdmin,
} from "../controllers/userController.js";

const router = express.Router();

router.get("",usersDetails); 
router.post('',userDetail);
router.post('/admin',makeAdmin);
router.get("/ban/:username",banUser);
router.get("/unban/:username",unbanUser);


export default router;