const {User} = require("../models/userModels")

const flash = require('express-flash');

const isBlocked = async (req, res, next) => {
    try {
        if (req.session.user) {
            
            const userId = req.session.user_id;
            const userData = await User.findOne({ _id: userId });
            console.log( userId);

            if (userData && userData.status === "Active") {
                req.session.userData = userData;
                next(); // Continue to the next middleware or route handler
            } else {
                req.flash('error', 'You Access to Luxicart is Blocked, please contact Admin!');
                res.redirect("/"); // Render the blocked page
            }
        } else {
            res.redirect("/login"); // Redirect to the login page if not logged in
        }
    } catch (error) {
        console.log(error.message);
        res.redirect("/login"); // Redirect to the login page in case of an error
    }
};

module.exports = isBlocked;
