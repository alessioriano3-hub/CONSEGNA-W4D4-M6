import jwt from "jsonwebtoken"

export const createAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1w" })

export const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET)
