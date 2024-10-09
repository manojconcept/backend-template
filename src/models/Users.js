import mongoose from "mongoose";
import { genHashedPassword, compareHasedPassword } from "../config/authentication.js";

// User Schema
const userSchema = new mongoose.Schema(
    {
        email: { 
            type: String, 
            required: [true, 'Email is required'], 
            unique: true, 
            trim: true, // Trims whitespace
            lowercase: true, // Normalizes email to lowercase
            validate: {
                validator: function(v) {
                    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v); // Simple email regex validation
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
        password: { 
            type: String, 
            required: [true, 'Password is required'], 
            minlength: [6, 'Password must be at least 6 characters long']
        },
        phone: { 
            type: String, 
            required: [true, 'Phone number is required'], 
            trim: true 
        },
        deleted: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false },
        avatar: { type: String },
        role: { 
            type: String, 
            required: [true, 'Role is required'], 
            default: "user", 
            enum: ["user", "admin"] 
        },
        refreshToken: { type: String },
        verificationToken: { type: String },
        verificationTokenExpiry: { type: Date },
        resetToken: { type: String },
        resetTokenExpiry: { type: Date },
    }, 
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
);

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await genHashedPassword(this.password);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = function (password) {
    return compareHasedPassword(password, this.password);
};

// Create and export the user model
const UserModel = mongoose.model("User", userSchema);
export default UserModel;
