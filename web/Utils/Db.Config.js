import mongoose from 'mongoose';

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    try { 
        // await mongoose.connect("mongodb://localhost:27017/secondloop");
        await mongoose.connect("mongodb+srv://admin:admin@oktopuslab.hgowwqx.mongodb.net/secondloop");
        console.log('MongoDB connected');
    }
    catch (error) {
        console.error(error);
    }
};

export default connectDB;