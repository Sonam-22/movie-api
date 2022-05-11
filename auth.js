const passportJWT = require("passport-jwt");
const jwtSecret = "343rdfdfreerdggg5";

const jwt = require("jsonwebtoken"),
  passport = require("passport");

require("./passport");

const SIGNING_ALGORITHM = "HS256";

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.userName,
    expiresIn: "7d",
    algorithm: SIGNING_ALGORITHM,
  });
};

const ensureSameUser = (req, res, next) => {
  const userName = req.params.userName;
  const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  const decoded = jwt.verify(token, jwtSecret, {
    algorithms: [SIGNING_ALGORITHM],
  });
  if (decoded.userName !== userName) {
    const error = new Error(
      "You are trying to operate on someone else's record. Don't be oversmart."
    );
    console.error(error);
    return res.status(400).json(error.message);
  }
  next();
};

const authProvider = (router) => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user,
        });
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        const noPassword = user;
        delete noPassword.password;
        return res.json({ user: noPassword, token });
      });
    })(req, res);
  });
};

module.exports = {
  authProvider,
  ensureSameUser,
};
