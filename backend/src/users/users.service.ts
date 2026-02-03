import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(user: Partial<User>): Promise<UserDocument> {
        const newUser = new this.userModel(user);
        return newUser.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async findAll(): Promise<UserDocument[]> {
        return this.userModel.find().select('-password').exec();
    }

    async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, { isOnline }).exec();
    }
}

