/*********************************************************************************
 *  WEB322 – Assignment 06
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Siran Cao     Student ID: 159235209     Date: 04/08/2022
 *
 *  GitHub Repository URL: https://github.com/siranchao/Web322-app
 *
 ********************************************************************************/

////import modules////
const express = require("express")
const app = express()
const env = require("dotenv")
env.config()
const hbs = require("express-handlebars")
const path = require("path")
const multer = require("multer")
const upload = multer()
const stripJs = require("strip-js")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")
const blogService = require("./blog-service")
const authData = require("./auth-service")
const clientSessions = require("client-sessions")

//config cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
})

//setting PORT number
const HTTP_PORT = process.env.PORT || 8080
const HTTPstart = () => { console.log(`Express http server is listening on port: ${HTTP_PORT}`) }

//config handlebars and helpers
app.engine(
    ".hbs",
    hbs.engine({
        extname: ".hbs",
        defaultLayout: "main",
        helpers: {
            navLink: (url, options) => {
                return `<li ${url == app.locals.activeRoute ? "class='active'" : ""
                    }><a href="${url}">${options.fn(this)}</a></li>`
            },
            equal: (lvalue, rvalue, options) => {
                if (arguments.length < 3)
                    throw new Error("Handlebars Helper equal needs 2 parameters")
                if (lvalue != rvalue) {
                    return options.inverse(this)
                } else {
                    return options.fn(this)
                }
            },
            safeHTML: (context) => {
                return stripJs(context)
            },
            formatDate: (dateObj) => {
                let date = new Date(dateObj)
                let year = date.getFullYear()
                let month = (date.getMonth() + 1).toString()
                let day = date.getDate().toString()
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            }
        },
    })
)
app.set("view engine", ".hbs")

//setting middleware and static files
app.use(express.static("public"))

app.use(clientSessions({
    cookieName: "session",
    secret: "web322_siran_blog",
    duration: 1000 * 60 * 5, //5 mins session
    activeDuration: 1000 * 60, //extent 1 min by each request
}))

app.use((req, res, next) => {
    res.locals.session = req.session
    next()
})

//check authentication
const ensureLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect("/login")
    } else {
        next()
    }
}

app.use((req, res, next) => {
    let route = req.path.substring(1)
    app.locals.activeRoute =
        route == "/" ? "/" : "/" + route.replace(/\/(.*)/, "")
    app.locals.viewingCategory = req.query.category
    next()
})

// for form data without file
app.use(express.urlencoded({ extended: true }))

////setting routes////
app.get("/", (req, res) => {
    res.redirect("/blog")
})

app.get("/about", (req, res) => {
    res.render("about", { data: null })
})

app.get("/login", (req, res) => {
    res.render("login", { data: null })
})

app.get("/register", (req, res) => {
    res.render("register", { data: null })
})

app.post("/register", (req, res) => {
    authData
        .registerUser(req.body)
        .then(() => {
            res.render("register", { data: { successMessage: "User Created" } })
        })
        .catch(err => {
            res.render("register", { data: { errorMessage: err, userName: req.body.userName } })
        })
})

app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent")
    authData
        .checkUser(req.body)
        .then(user => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            }
            res.redirect("/posts")
        })
        .catch(err => {
            res.render("login", { data: { message: err, userName: req.body.userName } })
        })
})

app.get("/logout", (req, res) => {
    req.session.reset()
    res.redirect("/")
})

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory", { data: null })
})

app.get("/blog", async (req, res) => {
    let viewData = {}
    try {
        let viewPosts = []
        if (req.query.category) {
            viewPosts = await blogService.getPublishedPostsByCategory(
                req.query.category
            )
        } else {
            viewPosts = await blogService.getPublishedPosts()
        }
        // sort the published posts by postDate
        viewPosts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate))
        // get the latest post
        let post = viewPosts[0]
        // store the "posts" and "post" data in the viewData object
        viewData.posts = viewPosts
        viewData.post = post
    } catch (err) {
        viewData.message = "no results"
    }

    try {
        let categories = await blogService.getCategories()
        viewData.categories = categories
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData })
})

app.get("/blog/:id", async (req, res) => {
    let viewData = {}
    try {
        let viewPosts = []
        if (req.query.category) {
            viewPosts = await blogService.getPublishedPostsByCategory(req.query.category)
        } else {
            viewPosts = await blogService.getPublishedPosts()
        }
        // sort the published posts by postDate
        viewPosts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate))
        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = viewPosts
    } catch (err) {
        viewData.message = "no results"
    }

    try {
        // Obtain the post by "id"
        viewData.post = await blogService.getPostsById(req.params.id)
    } catch (err) {
        viewData.message = "no results"
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blogService.getCategories()
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    res.render("blog", { data: viewData })
})

app.get("/posts", ensureLogin, (req, res) => {
    if (req.query.category) {
        blogService
            .getPostsByCategory(req.query.category)
            .then(data => {
                if (data.length == 0) {
                    res.render("posts", { message: "No Results" })
                } else {
                    res.render("posts", { posts: data })
                }
            })
            .catch(err => {
                res.render("posts", { message: err })
            })
    } else if (req.query.minDate) {
        blogService
            .getPostsByMinDate(req.query.minDate)
            .then(data => {
                if (data.length == 0) {
                    res.render("posts", { message: "No Results" })
                } else {
                    res.render("posts", { posts: data })
                }
            })
            .catch(err => {
                res.render("posts", { message: err })
            })
    } else {
        blogService
            .getAllPosts()
            .then(data => {
                if (data === undefined) {
                    res.render("posts", { message: "No Results" })
                } else {
                    res.render("posts", { posts: data })
                }
            })
            .catch((err) => {
                res.render("posts", { message: err })
            })
    }
})

app.get("/post/:value", ensureLogin, (req, res) => {
    blogService
        .getPostsById(req.params.value)
        .then((data) => res.json(data))
        .catch((err) => console.log(err))
})

app.get("/categories", ensureLogin, (req, res) => {
    blogService
        .getCategories()
        .then(data => {
            if (data.length == 0) {
                res.render("categories", { message: "No Results" })
            } else {
                res.render("categories", { categories: data })
            }
        })
        .catch(err => {
            res.render("categories", { message: err })
        })
})

app.get("/posts/add", ensureLogin, (req, res) => {
    blogService
        .getCategories()
        .then(data => {
            res.render("addPost", { categories: data })
        })
        .catch(() => {
            res.render("addPost", { categories: [] })
        })
})

app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req, res) => {
    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream((error, result) => {
                if (result) {
                    resolve(result)
                } else {
                    reject(error)
                }
            })
            streamifier.createReadStream(req.file.buffer).pipe(stream)
        })
    }
    async function upload(req) {
        let result = await streamUpload(req)
        return result
    }
    upload(req).then((uploaded) => {
        req.body.featureImage = uploaded.url

        blogService
            .addPost(req.body)
            .then(data => {
                console.log(data)
                res.redirect("/posts")
            })
            .catch((err) => {
                res.status(500).send(err)
            })
    })
})

app.get("/categories/add", ensureLogin, (req, res) => {
    res.render("addCategory", {
        data: null,
        layout: "main",
    })
})

app.post("/categories/add", ensureLogin, (req, res) => {
    blogService
        .addCategory(req.body)
        .then(data => {
            console.log(data)
            res.redirect("/categories")
        })
        .catch(err => {
            res.status(500).send(err)
        })
})

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
    blogService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories")
        })
        .catch(err => {
            console.log(err)
            res.status(500).send("Unable to Remove Category / Category not found")
        })
})

app.get("/posts/delete/:id", ensureLogin, (req, res) => {
    blogService.deletePostById(req.params.id)
        .then(() => {
            res.redirect("/posts")
        })
        .catch(err => {
            console.log(err)
            res.status(500).send("Unable to Remove Post / Post not found")
        })
})

app.use((req, res) => {
    res.status(404).render("404", {
        data: null,
        layout: "main",
    })
})

//listening on port
blogService
    .initialize()
    .then(authData.initialize)
    .then(msg => {
        console.log(`server start: ${msg}`)
        app.listen(HTTP_PORT, HTTPstart)
    })
    .catch(err => {
        console.log(err)
    })
