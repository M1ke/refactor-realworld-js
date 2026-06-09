import mongoose, { Schema, Types } from 'mongoose';
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

interface IUser {
  username: string;
  password: string;
  email: string;
  bio: string;
  image: string;
  favouriteArticles: Types.Array<Types.ObjectId>;
  followingUsers: Types.Array<Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserMethods {
  generateAccessToken(): string;
  toUserResponse(): UserResponse;
  toProfileJSON(user?: mongoose.HydratedDocument<IUser, IUserMethods>): ProfileJSON;
  isFollowing(id: Types.ObjectId | string): boolean;
  follow(id: Types.ObjectId): Promise<mongoose.HydratedDocument<IUser, IUserMethods>>;
  unfollow(id: Types.ObjectId): Promise<mongoose.HydratedDocument<IUser, IUserMethods>>;
  isFavourite(id: Types.ObjectId | string): boolean;
  favorite(id: Types.ObjectId): Promise<mongoose.HydratedDocument<IUser, IUserMethods>>;
  unfavorite(id: Types.ObjectId): Promise<mongoose.HydratedDocument<IUser, IUserMethods>>;
}

type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
      index: true,
    },
    bio: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: 'https://static.productionready.io/images/smiley-cyrus.jpg',
    },
    favouriteArticles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Article',
      },
    ],
    followingUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(uniqueValidator);

userSchema.methods.generateAccessToken = function (): string {
  const accessToken = jwt.sign(
    {
      user: {
        id: this._id,
        email: this.email,
        password: this.password,
      },
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: '1d' }
  );
  return accessToken;
};

userSchema.methods.toUserResponse = function (): UserResponse {
  return {
    username: this.username,
    email: this.email,
    bio: this.bio,
    image: this.image,
    token: this.generateAccessToken(),
  };
};

userSchema.methods.toProfileJSON = function (
  user?: mongoose.HydratedDocument<IUser, IUserMethods>
): ProfileJSON {
  return {
    username: this.username,
    bio: this.bio,
    image: this.image,
    following: user ? user.isFollowing(this._id) : false,
  };
};

userSchema.methods.isFollowing = function (id: Types.ObjectId | string): boolean {
  const idStr = id.toString();
  for (const followingUser of this.followingUsers) {
    if (followingUser.toString() === idStr) {
      return true;
    }
  }
  return false;
};

userSchema.methods.follow = function (
  id: Types.ObjectId
): Promise<mongoose.HydratedDocument<IUser, IUserMethods>> {
  if (this.followingUsers.indexOf(id) === -1) {
    this.followingUsers.push(id);
  }
  return this.save();
};

userSchema.methods.unfollow = function (
  id: Types.ObjectId
): Promise<mongoose.HydratedDocument<IUser, IUserMethods>> {
  if (this.followingUsers.indexOf(id) !== -1) {
    this.followingUsers.remove(id);
  }
  return this.save();
};

userSchema.methods.isFavourite = function (id: Types.ObjectId | string): boolean {
  const idStr = id.toString();
  for (const article of this.favouriteArticles) {
    if (article.toString() === idStr) {
      return true;
    }
  }
  return false;
};

userSchema.methods.favorite = function (
  id: Types.ObjectId
): Promise<mongoose.HydratedDocument<IUser, IUserMethods>> {
  if (this.favouriteArticles.indexOf(id) === -1) {
    this.favouriteArticles.push(id);
  }
  return this.save();
};

userSchema.methods.unfavorite = function (
  id: Types.ObjectId
): Promise<mongoose.HydratedDocument<IUser, IUserMethods>> {
  if (this.favouriteArticles.indexOf(id) !== -1) {
    this.favouriteArticles.remove(id);
  }
  return this.save();
};

const User = mongoose.model<IUser, UserModel>('User', userSchema);

export = User;
