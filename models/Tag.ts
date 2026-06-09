import mongoose, { Schema, Document, Model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

interface TagDoc extends Document {
    tagName: string;
    articles: mongoose.Types.ObjectId[];
}

const tagSchema = new Schema<TagDoc, Model<TagDoc>>({
    tagName: {
        type: String,
        required: true,
        unique: true
    },
    articles: [{
        type: Schema.Types.ObjectId,
        ref: 'Article'
    }]
});

tagSchema.plugin(uniqueValidator);

export default mongoose.model<TagDoc>('Tag', tagSchema);