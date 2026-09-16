// const express = require('express');
// const multer = require('multer');
// const uploadFile = require("./services/storage.service")

// const app = express();
// app.use(express.json());

// const upload = multer({storage: multer.memoryStorage() })


// app.post('/create-post', upload.single("image"), async (req, res) => {
//     console.log(req.body);
//     console.log(req.file);
    
//     const result = await uploadFile(req.file.buffer)

//     console.log(result);
    
    
// })

// module.exports = app;
    
const express = require('express');
const multer = require('multer');

const uploadFile = require("./services/storage.service");
const postModel = require("./models/post.model");

const app = express();

app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage()
});

app.post('/create-post', upload.single("image"), async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.file);

        if (!req.file) {
            return res.status(400).json({
                message: "Image is required"
            });
        }

        // Upload image to ImageKit
        const result = await uploadFile(req.file.buffer);

        console.log("ImageKit result:", result);

        // Save post in MongoDB
        const post = await postModel.create({
            image: result.url,
            caption: req.body.caption
        });

        // Send response
        res.status(201).json({
            message: "Post created successfully",
            post
        });

    } catch (error) {
        console.error("Create post error:", error);

        res.status(500).json({
            message: "Failed to create post",
            error: error.message
        });
    }
});

module.exports = app;