import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        const uri = process.env.DATABASE_URI;
        if (!uri) throw new Error('DATABASE_URI environment variable is not set');
        await mongoose.connect(uri);
    } catch (err: unknown) {
        console.log(err);
    }
};

export default connectDB;