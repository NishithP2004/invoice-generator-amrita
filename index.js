const ejs = require('ejs')
const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();
const fs = require('fs');
const nodemailer = require('nodemailer')

const app = express();
app.use(express.json())
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`)
})

app.get("/", (req, res) => {
    res.send({
        "message": "Hello World"
    })
})

app.post("/generate", (req, res) => {
    if (!req.body) {
        res.status(400)
    } else {
        let data = req.body;
        console.log(data)
        convertDocToPdf(data).then(pdf => {
                sendEmail(data, pdf)
                res.status(201).send({
                    success: true
                });
            })
            .catch(err => {
                if (err) {
                    console.log(err)
                    res.status(200).send({
                        success: false
                    })
                }
            })
    }
})

async function convertDocToPdf(data) {
    let ejs_template = fs.readFileSync(__dirname + "/views/pdf.ejs", 'utf-8');
    let html = ejs.render(ejs_template, {
        data
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    let pdf = await page.pdf({
        format: "A4"
    });

    await browser.close();

    return pdf
}

async function sendEmail(data, pdf) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com', // Office 365 server
        port: 587, // secure SMTP
        secure: false, // false for TLS - as a boolean not string - but the default is false so just remove this completely
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.PASSWORD
        },
        tls: {
            ciphers: 'SSLv3'
        },
        requireTLS: true
    });

    await transporter.sendMail({
        from: '"Amrita School Of Computing" <bot@nishithp.tech>',
        to: data.email,
        subject: `Course Registration Receipt - ${data.usn}`,
        text: "Dear Student, \n\nPlease find attached your additional slot course receipt for printing. \n\nThanks",
        attachments: [{
            filename: `receipt_${data.usn}.pdf`,
            content: pdf
        }]
    });
}
