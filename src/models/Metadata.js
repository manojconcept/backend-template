import mongoose from "mongoose";

const metaDataSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId, 
            ref:"User",
            required: true,
        },
        ip:String,
        browser:String,
        os:String,
        device:String
    },
    {
        timestamps:true
    }
)

const MetaDataModel = mongoose.model('MetaData',metaDataSchema);
export default MetaDataModel;