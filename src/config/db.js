import mongoose from "mongoose";

const { MD_URL } = process.env;

const mongoDBConnect = async databaseName => {
    try {
        await mongoose.connect(MD_URL,{
            dbName:databaseName,
        })
        console.log("Connected to MongoDB successfully");
    } catch (e) {
        console.error(`error: ${e}`);
        process.exit(1);
    }
};


export { mongoDBConnect };