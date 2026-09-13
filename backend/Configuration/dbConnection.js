import mongoose from "mongoose";

const connectiondb = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            tlsAllowInvalidCertificates: true
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("⚠️  MongoDB connection failed:", error.message);
        console.error("👉 Fix: Whitelist your IP in MongoDB Atlas > Network Access > Add IP Address");
    }
};

export default connectiondb;