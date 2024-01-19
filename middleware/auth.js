const {User} = require("../models/userModels")
const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
            const userId = req.session.user_id;
            let userData = await User.findById(userId);
    
            if (userData) {
                if (userData.isVerified) {
                    if (userData.status !== 'Blocked') {
                        console.log("Middleware Block -------------------------------------");
                        next(); // Continue to the next middleware or route handler
                    } else {
                        console.log("User is Blocked -------------------------------------");
                        res.redirect('/login');
                    }
                } else {
                    console.log("User is not Verified -------------------------------------");
                    res.redirect('/login');
                }
            } else {
                console.log("No User Data -------------------------------------");
                res.redirect('/login');
            }
        } else {
            console.log("No User Session -------------------------------------");
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
    }
    
};

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
