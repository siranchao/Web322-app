/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Siran Cao     Student ID: 159235209     Date: 02/18/2022
*
*  Online (Heroku) URL:  https://obscure-basin-05422.herokuapp.com/
*
*  GitHub Repository URL: https://github.com/siranchao/Web322-app
*
********************************************************************************/ 

//imports modules 
const express = require("express")
const app = express()
const path = require("path")
const env = require('dotenv')
env.config()
const blogService = require("./blog-service")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")

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

//static files
app.use(express.static("public"))

//multer middleware
const upload = multer()


//setting routes
app.get("/", (req, res) => {
    res.redirect("/about")
})

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "/views/about.html"))
})

app.get("/blog", (req, res) => {
    blogService.getPublishedPosts()
    .then((data) => {
        res.json(data)
    })
    .catch((err) => {
        console.log(err);
        res.send(`Error Message: ${err}`)
    })
})

app.get("/posts", (req, res) => {
    
    if(req.query.category){
        blogService.getPostsByCategory(req.query.category)
        .then(data => {
            if(data.length == 0) {
                res.send("No results found")
            } else {
                res.json(data)
            }
        })
        .catch(err => console.log(err))
    }
    else if(req.query.minDate){
        blogService.getPostsByMinDate(req.query.minDate)
        .then(data => {
            if(data.length == 0) {
                res.send("No results found")
            } else {
                res.json(data)
            }
        })
        .catch(err => console.log(err))
    }
    else{
        blogService.getAllPosts()
        .then(data => {
            if(data === undefined) {
                res.send("No results found")
            } else {
                res.json(data)
            }
        })
        .catch(err => console.log(err))
    }
})

app.get("/post/:value", (req, res) => {
    blogService.getPostsById(req.params.value)
    .then(data => res.json(data))
    .catch(err => console.log(err))
})


app.get("/categories", (req, res) => {
    blogService.getCategories()
    .then((data) => {
        res.json(data)
    })
    .catch((err) => {
        console.log(err);
        res.send(`Error Message: ${err}`)
    })
})

app.get("/posts/add", (req, res) => {
    res.sendFile(path.join(__dirname, "/views/addPost.html"))
})

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
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
    res.status(404).sendFile(path.join(__dirname, "/views/404.html"))
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