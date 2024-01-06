


const isLogin = async (req, res, next) => {
    try {
        if (req.session.admin) {
           next(); // Continue to the next middleware or route handler
        } else {
          return  res.redirect("/admin"); // Redirect to the login page
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin) {
            res.redirect("/admin/adminPanel"); // Redirect to the home page
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
