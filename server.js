/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Siran Cao     Student ID: 159235209     Date: 03/04/2022
*
*  Online (Heroku) URL:  https://aqueous-waters-04406.herokuapp.com/
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
const stripJs = require("strip-js")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")
const blogService = require("./blog-service")

//config cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true
})

//setting PORT number
const HTTP_PORT = process.env.PORT || 8080
const HTTPstart = () => {
    console.log(`Express http server is listening on port: ${HTTP_PORT}`);
}

//setting middleware and static files
app.use(express.static("public"))

const upload = multer()

app.use((req,res,next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = (route == "/") ? "/" : "/" + route.replace(/\/(.*)/, "");
    app.locals.viewingCategory = req.query.category;
    next();
});


//config handlebars and helpers
app.engine(".hbs", hbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
        navLink: (url, options) => {
        return `<li ${(url == app.locals.activeRoute) ? "class='active'" : ""}><a href="${url}">${options.fn(this)}</a></li>`
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
        }
    }
}))
app.set("view engine", ".hbs")


////setting routes////
app.get("/", (req, res) => {
    res.redirect("/blog")
})

app.get("/about", (req, res) => {
    res.render("about", {
        data: null,
        layout: "main"
    })
})

app.get('/blog', async (req, res) => {
    let viewData = {};
    try{
        let viewPosts = [];
        if(req.query.category){
            viewPosts = await blogService.getPublishedPostsByCategory(req.query.category);
        }else{
            viewPosts = await blogService.getPublishedPosts();
        }
        // sort the published posts by postDate
        viewPosts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
        // get the latest post
        let post = viewPosts[0]; 
        // store the "posts" and "post" data in the viewData object
        viewData.posts = viewPosts;
        viewData.post = post;
    }catch(err){
        viewData.message = "no results";
    }

    try{
        let categories = await blogService.getCategories();
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
});

app.get('/blog/:id', async (req, res) => {
    let viewData = {};
    try{
        let viewPosts = [];
        if(req.query.category){
            viewPosts = await blogService.getPublishedPostsByCategory(req.query.category);
        }else{
            viewPosts = await blogService.getPublishedPosts();
        }
        // sort the published posts by postDate
        viewPosts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = viewPosts;    
    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the post by "id"
        viewData.post = await blogService.getPostsById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogService.getCategories();
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
    res.render("blog", {data: viewData})
});

app.get("/posts", (req, res) => {
    if(req.query.category){
        blogService.getPostsByCategory(req.query.category)
        .then(data => {
            if(data.length == 0) {
                res.render("posts", {
                    message: "No Results",
                    layout: "main"
                })
            } else {
                res.render("posts", {
                    posts: data,
                    layout: "main"
                })
            }
        })
        .catch(err => {
            res.render("posts", {
                message: err,
                layout: "main"
            })
        })
    }
    else if(req.query.minDate){
        blogService.getPostsByMinDate(req.query.minDate)
        .then(data => {
            if(data.length == 0) {
                res.render("posts", {
                    message: "No Results",
                    layout: "main"
                })
            } else {
                res.render("posts", {
                    posts: data,
                    layout: "main"
                })
            }
        })
        .catch(err => {
            res.render("posts", {
                message: err,
                layout: "main"
            })
        })
    }
    else{
        blogService.getAllPosts()
        .then(data => {
            if(data === undefined) {
                res.render("posts", {
                    message: "No Results",
                    layout: "main"
                })
            } else {
                res.render("posts", {
                    posts: data,
                    layout: "main"
                })
            }
        })
        .catch(err => {
            res.render("posts", {
                message: err,
                layout: "main"
            })
        })
    }
})

app.get("/post/:value", (req, res) => {
    blogService.getPostsById(req.params.value)
    .then(data => res.json(data))
    .catch(err => console.log(err))
})

app.get("/categories", (req, res) => {
    blogService.getCategories()
    .then(data => {
        res.render("categories", {
            categories: data,
            layout: "main"
        })
    })
    .catch(err => {
        res.render("categories", {
            message: err,
            layout: "main"
        })
    })
})

app.get("/addPost", (req, res) => {
    res.render("addPost", {
        data: null,
        layout: "main"
    })
})

app.post("/addPost", upload.single("featureImage"), (req, res) => {
    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream((error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            });
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };
    
    async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
    }
    
    upload(req).then((uploaded)=>{
        req.body.featureImage = uploaded.url;

        blogService.addPost(req.body).then(data => {
            console.log(data)
            res.redirect("/posts")
        }).catch(err => {
            res.status(500).send(err)
        })
    });
})



app.use((req, res) => {
    res.status(404).render("404", {
        data: null,
        layout: "main"
    })
})


//listening on port
blogService.initialize()
.then((msg) => {
    console.log(`server start: ${msg}`);
    app.listen(HTTP_PORT, HTTPstart)
})
.catch((err) => {
    console.log(err);
})