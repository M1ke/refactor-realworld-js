import mongoose, { Document, Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import jwt from 'jsonwebtoken';

interface UserResponse {
    username: string;
    email: string;
    bio: string;
    image: string;
    token: string;
}

interface ProfileJSON {
    username: string;
    bio: string;
    image: string;
    following: boolean;
}

export interface IUser extends Document {
    username: string;
    password: string;
    email: string;
    bio: string;
    image: string;
    favouriteArticles: mongoose.Types.ObjectId[];
    followingUsers: mongoose.Types.ObjectId[];
    generateAccessToken(): string;
    toUserResponse(): UserResponse;
    toProfileJSON(user: IUser | false): ProfileJSON;
    isFollowing(id: mongoose.Types.ObjectId): boolean;
    follow(id: mongoose.Types.ObjectId): Promise<IUser>;
    unfollow(id: mongoose.Types.ObjectId): Promise<IUser>;
    isFavourite(id: mongoose.Types.ObjectId): boolean;
    favorite(id: mongoose.Types.ObjectId): Promise<IUser>;
    unfavorite(id: mongoose.Types.ObjectId): Promise<IUser>;
}

const userSchema = new Schema<IUser>({
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

userSchema.methods.generateAccessToken = function(this: IUser): string {
    return jwt.sign(
        {
            "user": {
                "id": this._id,
                "email": this.email,
                "password": this.password
            }
        },
        process.env.ACCESS_TOKEN_SECRET as string,
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

userSchema.methods.toProfileJSON = function(this: IUser, user: IUser | false): ProfileJSON {
    return {
        username: this.username,
        bio: this.bio,
        image: this.image,
        following: user ? user.isFollowing(this._id as mongoose.Types.ObjectId) : false
    };
};

userSchema.methods.isFollowing = function(this: IUser, id: mongoose.Types.ObjectId): boolean {
    const idStr = id.toString();
    for (const followingUser of this.followingUsers) {
        if (followingUser.toString() === idStr) {
            return true;
        }
    }
    return false;
};

userSchema.methods.follow = function(this: IUser, id: mongoose.Types.ObjectId): Promise<IUser> {
    if (this.followingUsers.indexOf(id) === -1) {
        this.followingUsers.push(id);
    }
    return this.save() as unknown as Promise<IUser>;
};

userSchema.methods.unfollow = function(this: IUser, id: mongoose.Types.ObjectId): Promise<IUser> {
    if (this.followingUsers.indexOf(id) !== -1) {
        (this.followingUsers as unknown as { remove(id: mongoose.Types.ObjectId): void }).remove(id);
    }
    return this.save() as unknown as Promise<IUser>;
};

userSchema.methods.isFavourite = function(this: IUser, id: mongoose.Types.ObjectId): boolean {
    const idStr = id.toString();
    for (const article of this.favouriteArticles) {
        if (article.toString() === idStr) {
            return true;
        }
    }
    return false;
};

userSchema.methods.favorite = function(this: IUser, id: mongoose.Types.ObjectId): Promise<IUser> {
    if (this.favouriteArticles.indexOf(id) === -1) {
        this.favouriteArticles.push(id);
    }
    return this.save() as unknown as Promise<IUser>;
};

userSchema.methods.unfavorite = function(this: IUser, id: mongoose.Types.ObjectId): Promise<IUser> {
    if (this.favouriteArticles.indexOf(id) !== -1) {
        (this.favouriteArticles as unknown as { remove(id: mongoose.Types.ObjectId): void }).remove(id);
    }
    return this.save() as unknown as Promise<IUser>;
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
