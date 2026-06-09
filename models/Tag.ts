import { Schema, model, Types } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

const tagSchema = new Schema({
    tagName: {
        type: String,
        required: true,
        unique: true
    },
    articles: [{
        type: Schema.Types.ObjectId,
        ref: 'Article'
    }]
})

tagSchema.plugin(uniqueValidator);

export = model('Tag', tagSchema);
