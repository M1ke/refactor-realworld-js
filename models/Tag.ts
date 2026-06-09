import mongoose, { Document, Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

interface ITag extends Document {
    tagName: string;
    articles: mongoose.Types.ObjectId[];
}

const tagSchema = new Schema<ITag>({
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

module.exports = mongoose.model<ITag>('Tag', tagSchema);
