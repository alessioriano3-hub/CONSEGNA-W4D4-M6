import mongoose from "mongoose"

const { Schema, model } = mongoose

const commentSchema = new Schema(
  {
    text: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "Author", required: true },
  },
  { timestamps: true }
)

const blogSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String },
    readTime: {
      value: { type: Number },
      unit: { type: String },
    },
    author: { type: Schema.Types.ObjectId, ref: "Author", required: true },
    content: { type: String, required: true },
    comments: [commentSchema],
  },
  { timestamps: true }
)

export default model("Blog", blogSchema)
