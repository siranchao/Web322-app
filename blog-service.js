const fs = require("fs")
const path = require("path")

let posts = []
let categories = []

//export functions

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, "/data/posts.json"), "utf-8", (err, data) => {
            if(err) {
                console.log(`read posts file error: ${err}`);
                reject("Unable to read posts.json file")
            } else {
                posts = JSON.parse(data)

                //read the 2nd file
                fs.readFile(path.join(__dirname, "/data/categories.json"), "utf-8", (err, data) => {
                    if(err) {
                        console.log(`read categories file error: ${err}`);
                        reject("Unable to read categories.json file")
                    } else {
                        categories = JSON.parse(data)
                        resolve("data read success");
                    }
                })
            }
        })
    })
}

module.exports.getAllPosts = () => {
    return new Promise((resolve, reject) => {
        if(posts.length == 0) {
            reject(`no results returned`)
        } else {
            resolve(posts)
        }
    })
}

module.exports.getPublishedPosts = () => {
    return new Promise((resolve, reject) => {
        if(posts.length == 0) {
            reject(`no results returned`)
        } else {
            resolve(posts.filter(ele => 
                ele.published == true
            ))
        }
    })
}

module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        if(categories.length == 0) {
            reject(`no results returned`)
        } else {
            resolve(categories)
        }
    })
}

//add a new post to array
module.exports.addPost = (newPost) => {
    return new Promise((resolve, reject) => {
        posts.push(newPost)
        resolve()
    })
}