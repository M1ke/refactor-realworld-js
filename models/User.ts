import mongoose = require('mongoose');
import jwt = require('jsonwebtoken');

const uniqueValidator: (schema: mongoose.Schema, options?: Record<string, unknown>) => void = require('mongoose-unique-validator');

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

export interface IUser extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    password: string;
    email: string;
    bio: string;
    image: string;
    favouriteArticles: mongoose.Types.Array<mongoose.Types.ObjectId>;
    followingUsers: mongoose.Types.Array<mongoose.Types.ObjectId>;
    generateAccessToken(): string;
    toUserResponse(): UserResponse;
    toProfileJSON(user: IUser | null | undefined): ProfileResponse;
    isFollowing(id: mongoose.Types.ObjectId | string): boolean;
    follow(id: mongoose.Types.ObjectId | string): Promise<IUser>;
    unfollow(id: mongoose.Types.ObjectId | string): Promise<IUser>;
    isFavourite(id: mongoose.Types.ObjectId | string): boolean;
    favorite(id: mongoose.Types.ObjectId | string): Promise<IUser>;
    unfavorite(id: mongoose.Types.ObjectId | string): Promise<IUser>;
}

const userSchema = new mongoose.Schema<IUser>({
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
    }],
    followingUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
},
    {
        timestamps: true
    });

userSchema.plugin(uniqueValidator);

userSchema.methods.generateAccessToken = function(this: IUser): string {
    return jwt.sign(
        {
            "user": {
                "id": this._id,
                "email": this.email,
                "password": this.password
            }
        },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: "1d" }
    );
};

userSchema.methods.toUserResponse = function(this: IUser): UserResponse {
    return {
        username: this.username,
        email: this.email,
        bio: this.bio,
        image: this.image,
        token: this.generateAccessToken()
    };
};

userSchema.methods.toProfileJSON = function(this: IUser, user: IUser | null | undefined): ProfileResponse {
    return {
        username: this.username,
        bio: this.bio,
        image: this.image,
        following: user ? user.isFollowing(this._id) : false
    };
};

userSchema.methods.isFollowing = function(this: IUser, id: mongoose.Types.ObjectId | string): boolean {
    const idStr = id.toString();
    for (const followingUser of this.followingUsers) {
        if (followingUser.toString() === idStr) {
            return true;
        }
    }
    return false;
};

userSchema.methods.follow = function(this: IUser, id: mongoose.Types.ObjectId | string): Promise<IUser> {
    if (this.followingUsers.indexOf(id as mongoose.Types.ObjectId) === -1) {
        this.followingUsers.push(id as mongoose.Types.ObjectId);
    }
    return this.save() as Promise<IUser>;
};

userSchema.methods.unfollow = function(this: IUser, id: mongoose.Types.ObjectId | string): Promise<IUser> {
    if (this.followingUsers.indexOf(id as mongoose.Types.ObjectId) !== -1) {
        (this.followingUsers as unknown as { remove(v: unknown): void }).remove(id);
    }
    return this.save() as Promise<IUser>;
};

userSchema.methods.isFavourite = function(this: IUser, id: mongoose.Types.ObjectId | string): boolean {
    const idStr = id.toString();
    for (const article of this.favouriteArticles) {
        if (article.toString() === idStr) {
            return true;
        }
    }
    return false;
};

userSchema.methods.favorite = function(this: IUser, id: mongoose.Types.ObjectId | string): Promise<IUser> {
    if (this.favouriteArticles.indexOf(id as mongoose.Types.ObjectId) === -1) {
        this.favouriteArticles.push(id as mongoose.Types.ObjectId);
    }

    // const article = await Article.findById(id).exec();
    //
    // article.favouritesCount += 1;
    //
    // await article.save();

    return this.save() as Promise<IUser>;
};

userSchema.methods.unfavorite = function(this: IUser, id: mongoose.Types.ObjectId | string): Promise<IUser> {
    if (this.favouriteArticles.indexOf(id as mongoose.Types.ObjectId) !== -1) {
        (this.favouriteArticles as unknown as { remove(v: unknown): void }).remove(id);
    }

    // const article = await Article.findById(id).exec();
    //
    // article.favouritesCount -= 1;
    //
    // await article.save();

    return this.save() as Promise<IUser>;
};

export = mongoose.model<IUser>('User', userSchema);
