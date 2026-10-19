import GoogleStrategy from "passport-google-oauth20"
import AuthorsModel from "../../services/authors/model.js"
import { createAccessToken } from "../auth/tools.js"

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // URL assoluto: in produzione dietro il proxy di Heroku evita callback http://
    callbackURL: `${process.env.API_URL}/authors/googleRedirect`,
  },
  async (_accessToken, _refreshToken, profile, passportNext) => {
    try {
      const email = profile.emails?.[0]?.value
      let author = await AuthorsModel.findOne({ email })
      if (!author) {
        author = await new AuthorsModel({
          name: profile.name?.givenName || "Utente",
          surname: profile.name?.familyName || "Google",
          email,
          avatar: profile.photos?.[0]?.value,
          googleId: profile.id,
        }).save()
      }
      const token = createAccessToken({ _id: author._id, role: author.role })
      passportNext(null, { token })
    } catch (error) {
      passportNext(error)
    }
  }
)

export default googleStrategy
