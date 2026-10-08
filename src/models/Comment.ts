import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IComment extends Document {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  text: string;
  platform: 'youtube' | 'facebook' | 'instagram' | 'websocket';
  isDonation: boolean;
  amount: number;
  timestamp: Date;
}

const CommentSchema = new Schema<IComment>({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    index: true,
  },
  streamId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    enum: ['youtube', 'facebook', 'instagram', 'websocket'],
    required: true,
  },
  isDonation: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

CommentSchema.index({ streamId: 1, timestamp: -1 });
CommentSchema.index({ userId: 1, timestamp: -1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);