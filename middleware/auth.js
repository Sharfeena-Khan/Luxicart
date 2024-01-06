const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
            next(); // Continue to the next middleware or route handler
        } else {
            res.redirect("/login"); // Redirect to the login page
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user) {
            res.redirect("/"); // Redirect to the home page
        } else {
            next(); // Continue to the next middleware or route handler
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}
