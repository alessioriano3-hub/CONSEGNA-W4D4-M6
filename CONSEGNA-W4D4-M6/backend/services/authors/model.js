import mongoose from "mongoose"
import bcrypt from "bcrypt"

const { Schema, model } = mongoose

const authorSchema = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return !this.googleId // la password non serve per chi usa Google
      },
    },
    avatar: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ["User", "Admin"], default: "User" },
  },
  { timestamps: true }
)

authorSchema.pre("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 11)
  }
})

authorSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.__v
  return obj
}

authorSchema.statics.checkCredentials = async function (email, password) {
  const author = await this.findOne({ email })
  if (!author || !author.password) return null
  const ok = await bcrypt.compare(password, author.password)
  return ok ? author : null
}

export default model("Author", authorSchema)
