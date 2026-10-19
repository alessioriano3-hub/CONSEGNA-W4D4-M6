import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import multer from "multer"

// cloudinary legge da solo la variabile d'ambiente CLOUDINARY_URL
const makeUploader = (folder) =>
  multer({
    storage: new CloudinaryStorage({ cloudinary, params: { folder } }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  })

export const avatarUploader = makeUploader("blog/avatars").single("avatar")
export const coverUploader = makeUploader("blog/covers").single("cover")
