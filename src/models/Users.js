import mongoose from "mongoose";
import { genHashedPassword, compareHasedPassword } from "../config/authentication.js";

const userSchema = new mongoose.Schema
(
    {
        email: { 
            type: String, 
            required: [true, 'Email is required'], 
            unique: true, 
            trim: true, 
            lowercase: true, 
            validate: {
                validator: function(v) {
                    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
                },
                message: props => `${props.value} is not a valid email address!`
            }
        },
        username: { 
            type: String, 
            required: [true, 'Username is required'], 
            unique: true, 
            trim: true, 
            minlength: [3, 'Username must be at least 3 characters long'],
            maxlength: [30, 'Username cannot exceed 30 characters']
        },
        phone: { 
            type: String, 
            unique:true,
            trim: true 
        },
        deleted: { type: Boolean, default: false },
        deletedUser:{type:String,defualt:undefined},
        deletedtimestamp:{type:String,default:undefined},
        isVerified: { type: Boolean, default: false },
        avatar: { type: String },
        role: { 
            type: String, 
            required: [true, 'Role is required'], 
            default: "user", 
            enum: ["user", "admin"] 
        },
        // refreshToken: { type: String },
        // verificationToken: { type: String },
        // verificationTokenExpiry: { type: Date },
        // resetToken: { type: String },
        // resetTokenExpiry: { type: Date },
    }, 
    {
        timestamps: true
    }
);

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
