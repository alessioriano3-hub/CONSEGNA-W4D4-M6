import express from "express"
import createHttpError from "http-errors"
import BlogsModel from "./model.js"
import { JWTAuthMiddleware } from "../../lib/auth/jwt.js"
import { coverUploader } from "../../lib/cloudinary.js"

export const blogRoute = express.Router()

const isOwnerOrAdmin = (blog, user) =>
  blog.author.toString() === user._id.toString() || user.role === "Admin"

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Lista pubblica, con ricerca ?title= e paginazione ?page=&limit=
blogRoute.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 50)
    const filter = req.query.title ? { title: new RegExp(escapeRegex(req.query.title), "i") } : {}
    const total = await BlogsModel.countDocuments(filter)
    const blogs = await BlogsModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name surname avatar")
    res.send({ total, page, pages: Math.ceil(total / limit), blogs })
  } catch (error) {
    next(error)
  }
})

blogRoute.get("/:id", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.id)
      .populate("author", "name surname avatar")
      .populate("comments.author", "name surname avatar")
    if (!blog) return next(createHttpError(404, `Blog ${req.params.id} non trovato`))
    res.send(blog)
  } catch (error) {
    next(error)
  }
})

blogRoute.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blog = await new BlogsModel({ ...req.body, author: req.user._id }).save()
    res.status(201).send(blog)
  } catch (error) {
    next(error)
  }
})

blogRoute.put("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.id)
    if (!blog) return next(createHttpError(404, `Blog ${req.params.id} non trovato`))
    if (!isOwnerOrAdmin(blog, req.user)) return next(createHttpError(403, "Non sei l'autore di questo blog"))
    const { author, comments, ...updates } = req.body
    Object.assign(blog, updates)
    res.send(await blog.save())
  } catch (error) {
    next(error)
  }
})

blogRoute.delete("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.id)
    if (!blog) return next(createHttpError(404, `Blog ${req.params.id} non trovato`))
    if (!isOwnerOrAdmin(blog, req.user)) return next(createHttpError(403, "Non sei l'autore di questo blog"))
    await blog.deleteOne()
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// Upload cover su Cloudinary
blogRoute.post("/:id/cover", JWTAuthMiddleware, coverUploader, async (req, res, next) => {
  try {
    if (!req.file) return next(createHttpError(400, "Nessun file inviato (campo 'cover')"))
    const blog = await BlogsModel.findById(req.params.id)
    if (!blog) return next(createHttpError(404, `Blog ${req.params.id} non trovato`))
    if (!isOwnerOrAdmin(blog, req.user)) return next(createHttpError(403, "Non sei l'autore di questo blog"))
    blog.cover = req.file.path
    res.send(await blog.save())
  } catch (error) {
    next(error)
  }
})

// Commenti
blogRoute.get("/:id/comments", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.id).populate("comments.author", "name surname avatar")
    if (!blog) return next(createHttpError(404, `Blog ${req.params.id} non trovato`))
    res.send(blog.comments)
  } catch (error) {
    next(error)
  }
})

blogRoute.post("/:id/comments", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blog = await BlogsModel.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { text: req.body.text, author: req.user._id } } },
      { new: true, runValidators: true }
    )
    if (!blog) return next(createHttpError(404, `Blog ${req.params.id} non trovato`))
    res.status(201).send(blog.comments)
  } catch (error) {
    next(error)
  }
})

blogRoute.delete("/:id/comments/:commentId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.id)
    if (!blog) return next(createHttpError(404, `Blog ${req.params.id} non trovato`))
    const comment = blog.comments.id(req.params.commentId)
    if (!comment) return next(createHttpError(404, "Commento non trovato"))
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "Admin")
      return next(createHttpError(403, "Non sei l'autore di questo commento"))
    comment.deleteOne()
    await blog.save()
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
