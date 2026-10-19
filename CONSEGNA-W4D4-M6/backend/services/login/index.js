import express from "express"
import createHttpError from "http-errors"
import AuthorsModel from "../authors/model.js"
import { createAccessToken } from "../../lib/auth/tools.js"

export const loginRoute = express.Router()

loginRoute.post("/", async (req, res, next) => {
  try {
    const { email, password } = req.body
    const author = await AuthorsModel.checkCredentials(email, password)
    if (!author) return next(createHttpError(401, "Credenziali non valide"))
    const accessToken = createAccessToken({ _id: author._id, role: author.role })
    res.send({ accessToken })
  } catch (error) {
    next(error)
  }
})
