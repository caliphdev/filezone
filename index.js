const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const { config } = require('dotenv');
const cookieParser = require('cookie-parser');
const chalk = require("chalk");
const multer = require('multer');
const path = require('path');
const serveIndex = require('serve-index');
const fs = require('fs');
const VIEW_ROOT = path.join(process.cwd(), "views");
const ROOT = path.join(process.cwd(), "public");
const app = express();
config();
const port = process.env.PORT || 3344;
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
function status(code) {
if (code > 400 && code < 499) return chalk.yellow(code)
if (code > 500 && code < 599) return chalk.red(code)
if (code > 299 && code < 399) return chalk.cyan(code)
if (code > 199) return chalk.green(code)
return chalk.yellow(code)
}

app.use(logger(function (tokens, req, res) {
  return [
    req.ip,
    // req.headers['user-agent'],
    tokens.method(req, res),
    tokens.url(req, res),
    status(tokens.status(req, res)),
    tokens['response-time'](req, res)+ ' ms',
    formatBytes(isNaN(tokens.res(req, res, 'content-length')) ? 0 : tokens.res(req, res, 'content-length')), 
  ].join(' | ')
}))

app.all('/file/:oke', async (req, res, next) => {
var already = result.hasOwnProperty(req.params.oke)
if (!already) return next()
 var nais = result[req.params.oke]
if (nais.originalname) res.setHeader("Content-Disposition", `filename="${nais.originalname}"`)
next()
})
app.set('json spaces', 2)
app.use(cors())
app.use(express.json())
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

// Error 405 Pages (Method Not Allowed)
app.get(["/backend/upload.php", "/api/upload.php", "/upload"], (req, res, next) => {
//notallow = ["/backend/upload.php", "/api/upload.php"]
res.status(405).render('errorpage', { title: '405 - Method Not Allowed', statuscode: 405, statusmsg: 'Method Not Allowed' });
})
app.get('/', (req, res) => {
    res.status(200).render('index', { MaxSize: formatBytes(parseInt(process.env.MAX_BYTES || "104857600")) })
})

// Backend Upload File
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


// API Method
app.post(['/api/upload.php', '/upload'], upload.single('file'), (req, res) => {
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

app.use(express.static(ROOT), serveIndex(ROOT, { icons: true }))


// Handling 404
app.use(function (req, res, next) {
    if (/file/gi.test(req.path)) return res.status(404).render('errorpage', { statuscode: 404, statusmsg: 'File Not Found', title: '404 - File Not Found' })
    res.status(404).render('errorpage', { statuscode: 404, statusmsg: 'Not Found', title: '404 - Page Not Found' })
})

app.listen(port, () => {
    console.log(`App listening at PORT ${port}`)
})
