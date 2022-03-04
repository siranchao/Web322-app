const { resolveObjectURL } = require("buffer")
const e = require("express")
const fs = require("fs")
const { resolve } = require("path")
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
            reject(`no post results`)
        } else {
            resolve(posts)
        }
    })
}

module.exports.getPublishedPosts = () => {
    return new Promise((resolve, reject) => {
        if(posts.length == 0) {
            reject(`no post results`)
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
            reject(`no category results`)
        } else {
            resolve(categories)
        }
    })
}

//add a new post to array
module.exports.addPost = (newPost) => {
    return new Promise((resolve, reject) => {
        const today = new Date()
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()
        newPost.published = (newPost.published == undefined) ? false : true;
        newPost.id = posts.length + 1
        newPost.postDate = `${yyyy}-${mm}-${dd}`
        posts.push(newPost)
        resolve(newPost)
    })
}


module.exports.getPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        if(posts.length == 0) {
            reject("no results returned")
        } else {
            resolve(posts.filter(ele => ele.category == category))
        }
    })
}

module.exports.getPostsByMinDate = (minDate) => {
    return new Promise((resolve, reject) => {
        if(posts.length == 0) {
            reject("no results returned")
        } else {
            const postArr = []
            for(i = 0; i < posts.length; i++) {
                if(new Date(posts[i].postDate) >= new Date(minDate))
                    postArr.push(posts[i])
            }
            // const postArr = posts.filter(ele => new Date(ele.postDate) >= new Date(minDate))
            resolve(postArr)
        }
    })
}

module.exports.getPostsById = (id) => {
    return new Promise((resolve, reject) => {
        if(posts.length == 0) {
            reject("no results returned")
        } else {
            resolve(posts.find(ele => ele.id == id))
        }
    })
}

module.exports.getPublishedPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        if(posts.length == 0) {
            reject(`no post results`)
        } else {
            resolve(posts.filter(ele => 
                ele.published == true && ele.category == category
            ))
        }
    })
}