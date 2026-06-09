import mongoose, { Schema, Document, Model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import jwt from 'jsonwebtoken';

interface UserResponse {
    username: string;
    email: string;
    bio: string;
    image: string;
    token: string;
}

interface ProfileResponse {
    username: string;
    bio: string;
    image: string;
    following: boolean;
}

interface UserDoc extends Document {
    username: string;
    password: string;
    email: string;
    bio: string;
    image: string;
    favouriteArticles: mongoose.Types.Array<mongoose.Types.ObjectId>;
    followingUsers: mongoose.Types.Array<mongoose.Types.ObjectId>;

    generateAccessToken(): string;
    toUserResponse(): UserResponse;
    toProfileJSON(user: UserDoc | null): ProfileResponse;
    isFollowing(id: mongoose.Types.ObjectId): boolean;
    follow(id: mongoose.Types.ObjectId): Promise<UserDoc>;
    unfollow(id: mongoose.Types.ObjectId): Promise<UserDoc>;
    isFavourite(id: mongoose.Types.ObjectId): boolean;
    favorite(id: mongoose.Types.ObjectId): Promise<UserDoc>;
    unfavorite(id: mongoose.Types.ObjectId): Promise<UserDoc>;
}

const userSchema = new Schema<UserDoc, Model<UserDoc>>({
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

// Generate access token for a user; requires valid email and password
userSchema.methods.generateAccessToken = function(this: UserDoc): string {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET environment variable is not set');
    }
    const accessToken = jwt.sign({
            "user": {
                "id": this._id.toString(),
                "email": this.email,
                "password": this.password
            }
        },
        secret,
        { expiresIn: "1d" }
    );
    return accessToken;
};

userSchema.methods.toUserResponse = function(this: UserDoc): UserResponse {
    return {
        username: this.username,
        email: this.email,
        bio: this.bio,
        image: this.image,
        token: this.generateAccessToken()
    };
};

userSchema.methods.toProfileJSON = function(this: UserDoc, user: UserDoc | null): ProfileResponse {
    return {
        username: this.username,
        bio: this.bio,
        image: this.image,
        following: user ? user.isFollowing(this._id) : false
    };
};

userSchema.methods.isFollowing = function(this: UserDoc, id: mongoose.Types.ObjectId): boolean {
    const idStr = id.toString();
    for (const followingUser of this.followingUsers) {
        if (followingUser.toString() === idStr) {
            return true;
        }
    }
    return false;
};

userSchema.methods.follow = function(this: UserDoc, id: mongoose.Types.ObjectId): Promise<UserDoc> {
    if (this.followingUsers.indexOf(id) === -1) {
        this.followingUsers.push(id);
    }
    return this.save();
};

userSchema.methods.unfollow = function(this: UserDoc, id: mongoose.Types.ObjectId): Promise<UserDoc> {
    if (this.followingUsers.indexOf(id) !== -1) {
        this.followingUsers.remove(id);
    }
    return this.save();
};

userSchema.methods.isFavourite = function(this: UserDoc, id: mongoose.Types.ObjectId): boolean {
    const idStr = id.toString();
    for (const article of this.favouriteArticles) {
        if (article.toString() === idStr) {
            return true;
        }
    }
    return false;
};

userSchema.methods.favorite = function(this: UserDoc, id: mongoose.Types.ObjectId): Promise<UserDoc> {
    if (this.favouriteArticles.indexOf(id) === -1) {
        this.favouriteArticles.push(id);
    }
    return this.save();
};

userSchema.methods.unfavorite = function(this: UserDoc, id: mongoose.Types.ObjectId): Promise<UserDoc> {
    if (this.favouriteArticles.indexOf(id) !== -1) {
        this.favouriteArticles.remove(id);
    }
    return this.save();
};

export default mongoose.model<UserDoc>('User', userSchema);