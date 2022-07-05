require("dotenv").config()
const express = require('express');
const app = express();
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const File = require('./models/File')


const upload = multer({dest: "uploads/"})
const PORT  = process.env.PORT || 3000
mongoose.connect(process.env.DATABASE_URL)

app.set("view engine", "ejs")
app.use(express.urlencoded({extended: true}))

app.get("/",async (req,res)=>{
    const files = await File.find()
    // add req.headers.origin to all file paths
    // console.log(files)
    files.forEach(file=>{
        // file.fileLink= `${req.headers.origin}`
        // console.log(typeof file.path)
        // replace \ for each path with / 
    })
    res.render("index", {files: files})
})
app.post("/upload", upload.single("file"), async (req,res)=>{
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname
    }
    if(req.body.password != null && req.body.password!=""){
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }
    const file = await File.create(fileData)
    // console.log(file)
    res.render("index", {fileLink: `${req.headers.origin}/uploads/${file.id}`})
})
// app.get("/uploads/:id", handleDownload)
// app.post("/uploads/:id", handleDownload)
app.route("/uploads/:id").get(handleDownload).post(handleDownload)

async function handleDownload(req, res) {
    const file = await File.findById(req.params.id)
    if(file.password!=null && file.password!=""){
        if(req.body.password == null){
            res.render("password")
            return
        }
        if(!(await bcrypt.compare(req.body.password, file.password))){
            res.render("password", {error: true})
            return
        }
    }
  
    file.downloadCount++;
    await file.save()
    res.download(file.path, file.originalName)
}

app.listen(PORT, ()=>console.log(`listening on ${PORT}`))