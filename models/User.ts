import { Schema, model, Document, Types } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';
import * as jwt from 'jsonwebtoken';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        index: true
    },
    bio: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: "https://static.productionready.io/images/smiley-cyrus.jpg"
    },
    favouriteArticles: [{
        type: Schema.Types.ObjectId,
        ref: 'Article'
    }],
    followingUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
},
    {
        timestamps: true
    });

userSchema.plugin(uniqueValidator);

// @desc generate access token for a user
// @required valid email and password
userSchema.methods.generateAccessToken = function (this: UserDocument): string {
    const accessToken = jwt.sign({
            "user": {
                "id": this._id,
                "email": this.email,
                "password": this.password
            }
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: "1d" }
    );
    return accessToken;
}

userSchema.methods.toUserResponse = function (this: UserDocument) {
    return {
        username: this.username,
        email: this.email,
        bio: this.bio,
        image: this.image,
        token: this.generateAccessToken()
    }
};

userSchema.methods.toProfileJSON = function (this: UserDocument, user?: UserDocument) {
    return {
        username: this.username,
        bio: this.bio,
        image: this.image,
        following: user ? user.isFollowing(this._id) : false
    }
};

userSchema.methods.isFollowing = function (this: UserDocument, id: Types.ObjectId): boolean {
    const idStr = id.toString();
    for (const followingUser of this.followingUsers) {
        if (followingUser.toString() === idStr) {
            return true;
        }
    }
    return false;
};

userSchema.methods.follow = function (this: UserDocument, id: Types.ObjectId) {
    if (this.followingUsers.indexOf(id) === -1) {
        this.followingUsers.push(id);
    }
    return this.save();
};

userSchema.methods.unfollow = function (this: UserDocument, id: Types.ObjectId) {
    if (this.followingUsers.indexOf(id) !== -1) {
        this.followingUsers.remove(id);
    }
    return this.save();
};

userSchema.methods.isFavourite = function (this: UserDocument, id: Types.ObjectId): boolean {
    const idStr = id.toString();
    for (const article of this.favouriteArticles) {
        if (article.toString() === idStr) {
            return true;
        }
    }
    return false;
}

userSchema.methods.favorite = function (this: UserDocument, id: Types.ObjectId) {
    if (this.favouriteArticles.indexOf(id) === -1) {
        this.favouriteArticles.push(id);
    }

    // const article = await Article.findById(id).exec();
    //
    // article.favouritesCount += 1;
    //
    // await article.save();

    return this.save();
}

userSchema.methods.unfavorite = function (this: UserDocument, id: Types.ObjectId) {
    if (this.favouriteArticles.indexOf(id) !== -1) {
        this.favouriteArticles.remove(id);
    }

    // const article = await Article.findById(id).exec();
    //
    // article.favouritesCount -= 1;
    //
    // await article.save();

    return this.save();
};

// Instance-method type augmentation
interface UserDocument extends Document {
    username: string;
    password: string;
    email: string;
    bio: string;
    image: string;
    favouriteArticles: Types.Array<Types.ObjectId>;
    followingUsers: Types.Array<Types.ObjectId>;
    generateAccessToken(): string;
    toUserResponse(): {
        username: string;
        email: string;
        bio: string;
        image: string;
        token: string;
    };
    toProfileJSON(user?: UserDocument): {
        username: string;
        bio: string;
        image: string;
        following: boolean;
    };
    isFollowing(id: Types.ObjectId): boolean;
    follow(id: Types.ObjectId): Promise<UserDocument>;
    unfollow(id: Types.ObjectId): Promise<UserDocument>;
    isFavourite(id: Types.ObjectId): boolean;
    favorite(id: Types.ObjectId): Promise<UserDocument>;
    unfavorite(id: Types.ObjectId): Promise<UserDocument>;
}

export = model<UserDocument>('User', userSchema);
