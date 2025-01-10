import UserModel from "../models/Users.js";


export async function findUserByUserName_WOC(username) {
    try {
        const existingUser = await UserModel.findOne({ username });
        return existingUser
    } catch (e) {
        throw new Error('Error finding user: ' + e.message);
    }
}
export async function updateUserByUsername_WC(conditions, data) {
    try {
        const updatedUser = await UserModel.findOneAndUpdate({deleted: false,...conditions }, { $set: { ...data } },{new:true});
        return updatedUser;
    } catch (e) {
        throw new Error('Error finding user: ' + e.message);
    }
}