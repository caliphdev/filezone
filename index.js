import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const VIEW_ROOT = path.join(process.cwd(), "views");
const ROOT = path.join(process.cwd(), "public");
const app = express();
const port = process.env.PORT || 3344;
config();
let result = {}

// Create folder
if (!fs.existsSync('./public/file')) fs.mkdirSync('./public/file')

function makeid(length) {
    let result = '';
    const characters = '~~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-~~';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
} 


app.all('/file/:oke', async (req, res, next) => {
var already = result.hasOwnProperty(req.params.oke)
if (!already) return next()
 var nais = result[req.params.oke]
res.setHeader("Content-Disposition", `filename="${nais.originalname}"`)
next()
})
app.set('json spaces', 2)
app.use(cors())
app.use(logger('dev'))
app.use(express.json())
app.use(express.static(ROOT));
app.set("view engine", "ejs");
app.use(express.urlencoded({
    extended: false
}))
app.use(cookieParser())
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

const storage = multer.diskStorage({
    destination: 'public/file',
    filename: (req, file, cb) => {
        cb(null, makeid(20) + 
            path.extname(file.originalname))
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: (process.env.MAX_BYTES && parseInt(process.env.MAX_BYTES)) || 104857600 // 1MB = 1048576 Bytes
    }
})

app.get(["/backend/upload.php", "/api/upload.php"], (req, res, next) => {
//notallow = ["/backend/upload.php", "/api/upload.php"]
res.status(405).send();
})
app.get('/', (req, res) => {
    res.status(200).render('index')
})
app.post('/backend/upload.php', upload.single('file'), (req, res) => {
    if (!req.file.path) return res.status(400).json({
        status: false,
        message: "No file uploaded"
    })
    result[req.file.filename] = req.file
    res.status(200).render('result', {
        status: true,
        MaxSize: formatBytes(parseInt(process.env.MAX_BYTES || "104857600")),
        result: {
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            filesize: formatBytes(req.file.size),
            url: `${req.protocol}://${req.hostname == "localhost" ? "localhost:"+process.env.PORT : req.hostname}/file/` + req.file.filename
        }
    })
  }, (error, req, res, next) => {
    res.status(400).json({
        error: error.message
    })
   })

app.post('/api/upload.php', upload.single('file'), (req, res) => {
    if (!req.file || !req.file.path) return res.status(400).json({
        status: false,
        message: "No file uploaded"
    })
    result[req.file.filename] = req.file
    res.status(200).send({
        status: true,
        result: {
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            filesize: formatBytes(req.file.size),
            url: `${req.protocol}://${req.hostname == "localhost" ? "localhost:"+process.env.PORT : req.hostname}/file/` + req.file.filename
        }
    })
}, (error, req, res, next) => {
    res.status(400).json({
        error: error.message
    })
})


// Handling 404
app.use(function (req, res, next) {
    if (/file/gi.test(req.path)) return res.status(400).send(`File ${req.path} not found</br>The file may have been deleted or does not exist`)
    res.status(404).send()
})

app.listen(port, () => {
    console.log(`App listening at PORT ${port}`)
})
