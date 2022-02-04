/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Siran Cao     Student ID: 159235209     Date: 02/03/2022
*
*  Online (Heroku) URL: https://obscure-basin-05422.herokuapp.com/about
*
*  GitHub Repository URL: https://github.com/siranchao/Web322-app
*
********************************************************************************/ 

//imports external modules 
const express = require("express")
const path = require("path")
const blogService = require("./blog-service")

//global constants
const HTTP_PORT = process.env.PORT || 8080
const app = express()

const HTTPstart = () => {
    console.log(`Express http server is listening on port: ${HTTP_PORT}`);
}

//listening on port
blogService.initialize()
.then((msg) => {
    console.log(`server start: ${msg}`);
    app.listen(HTTP_PORT, HTTPstart)
})
.catch((err) => {
    console.log(err);
})


//serving static file and middle-ware
app.use(express.static("public"))


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
    blogService.getAllPosts()
    .then((data) => {
        res.json(data)
    })
    .catch((err) => {
        console.log(err);
        res.send(`Error Message: ${err}`)
    })
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

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "/views/404.html"))
})
