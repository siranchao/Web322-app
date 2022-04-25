const bcrypt = require("bcryptjs")
const mongoose = require("mongoose")
const Schema = mongoose.Schema

// Define a schema 
const userSchema = new Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory: [{ dateTime: Date, userAgent: String }]
})
https://github.com/siranchao/Web322-app/blob/main/auth-service.js
//create object model for the schema
let User;
module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        //connect to mongoDB
        let db = mongoose.connect("xxxx--mongoDB--userURL");
        if (db) {
            User = mongoose.model("users", userSchema)
            console.log(`mongoDB connection successful`);
            resolve(`connection successful`)
        } else {
            console.log(`mongoDB connection failed`);
            reject(`connection failed`)
        }
    })
}

module.exports.registerUser = (userData) => {
    return new Promise((resolve, reject) => {
        //check if password match
        if (userData.password === userData.password2) {
            //encrypt password
            bcrypt
                .hash(userData.password, 10)
                .then(hash => {
                    let newUser = new User({
                        userName: userData.userName,
                        password: hash,
                        email: userData.email,
                        loginHistory: []
                    })

                    newUser.save(err => {
                        if (err) {
                            if (err.code == 11000) {
                                reject(`User Name already taken`)
                            } else {
                                reject(`There was an error creating the user: ${err}`)
                            }
                        } else {
                            console.log(`data has been saved successfully`)
                            resolve()
                        }
                    })
                })
                .catch(err => {
                    console.log(`Encrypt password failed: ${err}`)
                    reject(`There was an error encrypting the password`)
                })

        } else {
            reject(`Passwords do not match`)
        }
    })
}

module.exports.checkUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .exec()
            .then(user => {
                if (!user) {
                    reject(`Unable to find user: ${userData.userName}`)
                } else {
                    //found username
                    //check encrypt passwords
                    bcrypt.compare(userData.password, user.password).then(result => {
                        if (result) {
                            //passing verification
                            let today = new Date()
                            user.loginHistory.push({ dateTime: today.toString(), userAgent: userData.userAgent })
                            User.updateOne({ userName: user.userName },
                                { $push: { loginHistory: { dateTime: today.toString(), userAgent: userData.userAgent } } }
                            ).exec()
                                .then(() => {
                                    console.log(`login object verification passed and login history updated`);
                                    resolve(user)
                                })
                                .catch(err => {
                                    reject(`There was an error updating login history: ${err}`)
                                })
                        } else {
                            reject(`Incorrect Password for user: ${userData.userName}`)
                        }
                    })
                }
            })
            .catch(err => {
                reject(`Unable to perform find() operation`)
            })
    })
}
