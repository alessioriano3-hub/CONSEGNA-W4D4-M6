import express from "express"
import createHttpError from "http-errors"
import passport from "passport"
import AuthorsModel from "./model.js"
import { JWTAuthMiddleware } from "../../lib/auth/jwt.js"
import { createAccessToken } from "../../lib/auth/tools.js"
import { avatarUploader } from "../../lib/cloudinary.js"

export const authorRoute = express.Router()

// Registrazione
authorRoute.post("/", async (req, res, next) => {
  try {
    const author = await new AuthorsModel({ ...req.body, role: "User" }).save()
    const token = createAccessToken({ _id: author._id, role: author.role })
    res.status(201).send({ author, accessToken: token })
  } catch (error) {
    if (error.code === 11000) return next(createHttpError(400, "Email già registrata"))
    next(error)
  }
})

// Login con Google (le route fisse vanno PRIMA di /:id)
authorRoute.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
)

authorRoute.get(
  "/googleRedirect",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res, next) => {
    try {
      const feUrl =
        process.env.NODE_ENV === "production" ? process.env.FE_PROD_URL : process.env.FE_DEV_URL
      res.redirect(`${feUrl}/?accessToken=${req.user.token}`)
    } catch (error) {
      next(error)
    }
  }
)

authorRoute.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    res.send(await AuthorsModel.find())
  } catch (error) {
    next(error)
  }
})

authorRoute.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const me = await AuthorsModel.findById(req.user._id)
    if (!me) return next(createHttpError(404, "Utente non trovato"))
    res.send(me)
  } catch (error) {
    next(error)
  }
})

authorRoute.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const { password, role, email, ...updates } = req.body // campi sensibili non modificabili da qui
    const me = await AuthorsModel.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    })
    res.send(me)
  } catch (error) {
    next(error)
  }
})

authorRoute.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await AuthorsModel.findByIdAndDelete(req.user._id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// Upload avatar su Cloudinary
authorRoute.post("/me/avatar", JWTAuthMiddleware, avatarUploader, async (req, res, next) => {
  try {
    if (!req.file) return next(createHttpError(400, "Nessun file inviato (campo 'avatar')"))
    const me = await AuthorsModel.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    )
    res.send(me)
  } catch (error) {
    next(error)
  }
})

authorRoute.get("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const author = await AuthorsModel.findById(req.params.id)
    if (!author) return next(createHttpError(404, `Autore ${req.params.id} non trovato`))
    res.send(author)
  } catch (error) {
    next(error)
  }
})
