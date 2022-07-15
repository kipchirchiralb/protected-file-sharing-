require("dotenv").config()
const express = require('express');
const app = express();
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const File = require('./models/File')


const upload = multer({dest: "public/uploads/"})
const PORT  = process.env.PORT || 3000
mongoose.connect(process.env.DATABASE_URL)

app.set("view engine", "ejs")
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))

app.get("/",async (req,res)=>{
    let files = await File.find()
    let newFiles =  Object.entries(files)
    // files.forEach(file=>{
    //     filePaths.push(file.path.slice(6))
    //     console.log(file.path)
    //     console.log(file.originalName)
    //     // file.path= `/${file.path.replace('\\', '/')}`
    // })
    let filePaths = []
    let fileNames = []
    newFiles.forEach(newFile=>{
        filePaths.push(newFile[1].path.slice(15))
        fileNames.push(newFile[1].originalName)
    })
    filePaths = filePaths.toString()
    fileNames = fileNames.toString()
    // filePaths = filePaths.split(',')[0]
    // fileNames = fileNames.split(',')[0]
    // console.log(filePaths, fileNames)
    res.render("index", {fileNames: fileNames, filePaths: filePaths})
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
    // render an empty file when one is needed to deletemall afa
    res.render("index", {fileLink: `${req.headers.origin}/uploads/${file.id}`})
})
// app.get("/uploads/:id", handleDownload)
// app.post("/uploads/:id", handleDownload)

app.post("/clear", async (req,res)=>{
    await File.deleteMany({})
    const files = await File.find()
    console.log(files)
    res.redirect('/')
})
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