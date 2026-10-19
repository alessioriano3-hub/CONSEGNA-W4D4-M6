import createHttpError from "http-errors"
import { verifyAccessToken } from "./tools.js"

export const JWTAuthMiddleware = (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return next(createHttpError(401, "Fornisci il token nell'header Authorization: Bearer <token>"))
  }
  try {
    const { _id, role } = verifyAccessToken(header.replace("Bearer ", ""))
    req.user = { _id, role }
    next()
  } catch (error) {
    next(createHttpError(401, "Token non valido o scaduto"))
  }
}
