import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    displayName: string;

    @Prop()
    avatarUrl: string;

    @Prop({ default: false })
    isOnline: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
