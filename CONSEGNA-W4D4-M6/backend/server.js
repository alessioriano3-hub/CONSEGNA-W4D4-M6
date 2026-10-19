import "dotenv/config" // in produzione (Heroku) non c'è un .env: le variabili arrivano dalle Config Vars
import express from "express"
import cors from "cors"
import endpoints from "express-list-endpoints"
import mongoose from "mongoose"
import passport from "passport"
import { authorRoute } from "./services/authors/index.js"
import { blogRoute } from "./services/blogs/index.js"
import { loginRoute } from "./services/login/index.js"
import googleStrategy from "./lib/oauth/index.js"
import {
  badRequestHandler,
  forbiddenHandler,
  genericErrorHandler,
  notfoundHandler,
  unauthorizedHandler,
} from "./errorHandlers.js"

const app = express()
const PORT = process.env.PORT || 3001

// Origini consentite dal CORS: frontend locale + frontend su Vercel
const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL].filter(Boolean)

app.use(
  cors({
    origin: (origin, corsNext) => {
      // origin è undefined per Postman/curl
      if (!origin || whitelist.includes(origin)) corsNext(null, true)
      else corsNext(new Error(`Origin ${origin} non consentita dal CORS`))
    },
  })
)
app.use(express.json())

passport.use("google", googleStrategy)
app.use(passport.initialize())

app.get("/", (req, res) => res.send({ ok: true, message: "Blog API online" }))
app.use("/authors", authorRoute)
app.use("/blogs", blogRoute)
app.use("/login", loginRoute)

app.use(badRequestHandler) // 400
app.use(unauthorizedHandler) // 401
app.use(forbiddenHandler) // 403
app.use(notfoundHandler) // 404
app.use(genericErrorHandler) // 500 (sempre ultimo)

const initServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL)
    console.log("🌚 Connesso a MongoDB.")
    app.listen(PORT, () => {
      console.log("🌚 Server avviato sulla porta " + PORT)
      console.table(endpoints(app))
    })
  } catch (error) {
    console.log("❌ CONNECTION FAILED! Error: ", error)
  }
}

initServer()
