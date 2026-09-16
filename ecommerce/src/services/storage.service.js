const {ImageKit} = require("@imagekit/nodejs")

const imagekit = new ImageKit ({
    privateKey: "private_IWdLKZ/fmo+aNrvD2ZKWVsTdqtg="
})

async function uploadFile(buffer) {
    try {
        const result = await imagekit.files.upload({
            file: buffer.toString("base64"),
            fileName: "image.png"
        })
        return result;
    } catch (err) {
        console.error("ImageKit upload failed:", err);
        throw err;
    }
}

module.exports = uploadFile;

