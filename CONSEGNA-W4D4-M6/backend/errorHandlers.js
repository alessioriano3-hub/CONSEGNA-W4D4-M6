export const badRequestHandler = (err, req, res, next) => {
  // 400 esplicito, oppure errori di validazione/cast di Mongoose
  if (err.status === 400 || err.name === "ValidationError" || err.name === "CastError") {
    const errorsList = err.errorsList
      ? err.errorsList.map((e) => e.msg)
      : err.errors
      ? Object.values(err.errors).map((e) => e.message)
      : []
    res.status(400).send({ success: false, message: err.message, errorsList })
  } else {
    next(err)
  }
}

export const unauthorizedHandler = (err, req, res, next) => {
  if (err.status === 401) {
    res.status(401).send({ success: false, message: err.message })
  } else {
    next(err)
  }
}

export const forbiddenHandler = (err, req, res, next) => {
  if (err.status === 403) {
    res.status(403).send({ success: false, message: err.message })
  } else {
    next(err)
  }
}

export const notfoundHandler = (err, req, res, next) => {
  if (err.status === 404) {
    res.status(404).send({ success: false, message: err.message })
  } else {
    next(err)
  }
}

export const genericErrorHandler = (err, req, res, next) => {
  console.log("ERROR:", err)
  res.status(500).send({
    success: false,
    message: "Something happened on our side! we will fix that ASAP!",
  })
}
