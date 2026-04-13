const express = require('express');
const router = express.Router();

const User = require('./../models/user');
const { jwtAuthMiddleware, generateToken } = require('./../jwt');

// POST route to add user
router.post('/signup', async (req, res) => {
    try {
        const data = req.body //assuming  the request body contains the person data 

        // CHeck if there is already an admin user
        const adminUser = await User.findOne({ role: 'admin' });
        if (data.role === 'admin' && adminUser) {
            return res.status(400).json({ error: 'Admin user already exists' });
        }

        // Validate Aadhar card number must have exactly 12 digits
        if (!/^\d{12}$/.test(data.aadharCardNumber)) {
            return res.status(400).json({ error: 'Aadhar card number must have exactly 12 digits' });
        }

        // Check if the user with Aadhar card number already exists
        const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this Aadhar card number already exists' });
        }

        // create a new User document using the Mongoose model
        const newUser = new User(data);

        // save the new user to the database
        const response = await newUser.save();
        console.log("data saved.");

        const payload = {
            id: response._id,
        }
        console.log(JSON.stringify(payload))
        const token = generateToken(payload);
        console.log("Token is:", token);

        res.status(200).json({ response: response, token: token });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        // Extract username and password from request body
        const { aadharCardNumber, password } = req.body;

        // Find the user by aadharCardNumber
        const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

        // /if user does not exist or password does not match, return an error response
        if (!user || (!(await user.comparePassword(password)))) {
            return res.status(401).json({ error: 'Invalid aadhar card number or password' });
        }

        // generate tokens
        const payload = {
            id: user.id,
        }

        const token = generateToken(payload);
        res.json({ token });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Profile route
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try {
        const userData = req.user;
        const userId = userData.id;
        const user = await User.findById(userId);
        res.status(200).json({ profile: user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/profile/password', jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;    //Extract the id from the token
        const { oldPassword, newPassword } = req.body;  //Extract the old and new password from the request body

        // Check if currentPassword and newPassword are present in the request body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }

        const user = await User.findById(userId);   //Find the user by id

        // /if password does not match, return an error response
        if (!user || !(await user.comparePassword(oldPassword))) {
            return res.status(401).json({ error: 'Invalid old password' });
        }

        // Update the user's password
        user.password = newPassword;
        await user.save();

        console.log('password updated');
        res.status(200).json({ message: 'Password updated successfully' });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
})


module.exports = router;