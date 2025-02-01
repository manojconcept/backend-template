import UserModel from "../models/Users.js";

export async function findUser_WOC(user) {
    try {
        let userData
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user)) {
            userData = { email: user };
        } else {
            userData = { username: user }
        }
        const existingUser = await UserModel.findOne(userData);
        return existingUser
    } catch (e) {
        throw new Error('Error finding user: ' + e.message);
    }
}
export async function updateUser_WC(conditions, data) {
    try {
        const updatedUser = await UserModel.findOneAndUpdate({ deleted: false, ...conditions }, { $set: { ...data } }, { new: true });
        return updatedUser;
    } catch (e) {
        throw new Error('Error finding user: ' + e.message);
    }
}