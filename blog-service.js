const Sequelize = require("sequelize")
const env = require("dotenv")
env.config()

//config sequelize DB
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOption: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
})

// const sequelize = new Sequelize(
//     "demvclt4qfinji",
//     "lkachjoltkocoe",
//     "891f0f14103ee343df0a53c260eded1508c86dc97cacef237a232b2d47ec62e8",
//     {
//         host: "ec2-18-210-191-5.compute-1.amazonaws.com",
//         dialect: "postgres",
//         port: 5432,
//         dialectOptions: {
//             ssl: { rejectUnauthorized: false },
//         },
//         query: { raw: true },
//     }
// );

sequelize
    .authenticate()
    .then(() => {
        console.log("DB connection has been established successfully.");
    })
    .catch((err) => {
        console.log("Unable to connect to the database!!", err);
    });

//define models
const Post = sequelize.define("Post", {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
})
const Category = sequelize.define("Category", {
    category: Sequelize.STRING
})
Post.belongsTo(Category, { foreignKey: "category", onDelete: "SET NULL" })


//export functions
module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => {
                resolve("DB sync is successful")
            })
            .catch(err => {
                reject(`Unable to sync the database: ${err}`)
            })
    })
}

module.exports.getAllPosts = () => {
    return new Promise((resolve, reject) => {
        Post.findAll(
            { order: ["id"] },
        ).then(data => {
            console.log("Operation success")
            resolve(data)
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("no results returned")
        })
    })
}

module.exports.getPublishedPosts = () => {
    return new Promise((resolve, reject) => {
        Post.findAll(
            { order: ["id"] },
            { where: { published: true } }
        ).then(data => {
            console.log("Operation success")
            resolve(data)
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("no results returned")
        })
    })
}

module.exports.getPublishedPostsByCategory = (categoryNum) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { published: true, category: categoryNum },
            include: [{ model: Category }],
            raw: true,
        },
            { order: ["id"] }
        ).then(data => {
            console.log("Operation success")
            resolve(data)
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("no results returned")
        })
    })
}

module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        Category.findAll(
            { order: ["id"] }
        ).then(data => {
            console.log("Operation success")
            resolve(data)
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("no results returned")
        })
    })
}

module.exports.getPostsByCategory = (categoryNum) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { category: categoryNum },
            include: [{ model: Category }],
            raw: true,
        },
            { order: ["id"] }
        ).then(data => {
            console.log("Operation success")
            resolve(data)
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("no results returned")
        })
    })
}

module.exports.getPostsByMinDate = (minDate) => {
    return new Promise((resolve, reject) => {
        const Op = Sequelize.Op
        Post.findAll(
            { order: ["id"] },
            { where: { postDate: { [Op.gte]: new Date(minDate) } } }
        ).then(data => {
            console.log("Operation success")
            resolve(data)
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("no results returned")
        })
    })
}

module.exports.getPostsById = (postID) => {
    return new Promise((resolve, reject) => {
        Post.findOne(
            { where: { id: postID } }
        ).then(data => {
            console.log("Operation success")
            resolve(data)
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("no results returned")
        })
    })
}

//add a new post to array
module.exports.addPost = (newPost) => {
    return new Promise((resolve, reject) => {
        newPost.published = (newPost.published) ? true : false;
        newPost.postDate = new Date()
        for (const key in newPost) {
            if (newPost.key === "") {
                newPost.key = null
            }
        }
        //create new post
        Post.create({
            body: newPost.body,
            title: newPost.title,
            postDate: newPost.postDate,
            featureImage: newPost.featureImage,
            published: newPost.published,
            category: newPost.category,
        }).then(() => {
            console.log("Operation success")
            resolve("new post is created")
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("unable to create new post")
        })
    })
}

//add a new category
module.exports.addCategory = (newCategory) => {
    return new Promise((resolve, reject) => {
        for (const key in newCategory) {
            if (newCategory.key === "") {
                newCategory.key = null
            }
        }
        //create new category
        Category.create({
            category: newCategory.category
        }).then(() => {
            console.log("Operation success")
            resolve("new category is created")
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("unable to create new category")
        })
    })
}

//delete Category & Post
module.exports.deleteCategoryById = (idNum) => {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: idNum }
        }).then(() => {
            console.log("Operation success")
            resolve("the category is deleted")
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("unable to delete the category")
        })
    })
}

module.exports.deletePostById = (idNum) => {
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: { id: idNum }
        }).then(() => {
            console.log("Operation success")
            resolve("the post is deleted")
        }).catch(err => {
            console.log(`Operation failed: ${err}`)
            reject("unable to delete the post")
        })
    })
}