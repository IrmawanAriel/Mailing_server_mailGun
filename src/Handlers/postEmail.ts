import { Response, Request } from "express";
import * as dotenv from 'dotenv';
dotenv.config();  // Env load environment variables

const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.ACCOUNT, // generated ethereal user
        pass:   process.env.PASS, // generated ethereal password
    },
});

export const postEmail = async (req: Request, res: Response) => {
    try {

        const { senders, email, subject, message } = req.body;

        // let AgreementFile: { filename: string; content: Buffer }[] = [];
        // if (req.files && 'AgreementFile' in req.files) {
        //     AgreementFile = (req.files.AgreementFile as any[]).map((file: any) => ({
        //         filename: `${file.originalname}`,
        //         content: file.buffer
        //     }));
        // }

        let AdditionalFiles: { filename: string; content: any }[] = [];
        if (req.files && 'AdditionalFiles' in req.files) {
            AdditionalFiles = (req.files.AdditionalFiles as any[]).map((file: any) => ({
                filename: `${file.originalname}`,
                content: file.buffer
            }));
        }

        const AgreementFile = {
            // @ts-ignore
            filename: `agreementbaru.pdf`,
            // @ts-ignore
            content: req.files.AgreementFile[0].buffer || null
        }

        // const AdditionalFiles = {
        //     // @ts-ignore
        //     filename: `${req.files.AdditionalFiles[0].fieldname}.pdf` || null,
        //     // @ts-ignore
        //     content: req.files.AdditionalFiles[0].buffer || null
        // }

        //@ts-ignore
        console.log('ini attach 1 2:', AgreementFile, AdditionalFiles);

        const formattedMessage = message.replace(/\n/g, '<br>'); // untuk menampilkan baris enter

        const info = await transport.sendMail({
            from: senders, // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            text: message, // plain text body
            html: `
            <html>
            <head>
            <style>
            body {
                font-family: Arial, sans-serif;
            }
            .container {
                padding: 20px;
            }
            .header {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            .info {
                margin-bottom: 10px;
            }
            .info span {
                font-weight: bold;
            }
            </style>
            </head>
            <body>
            <div class="container">
            <div class="message">${formattedMessage}</div>
            </div>
            </body>
            </html>
            `, // html body
            attachments: [
            ...(AdditionalFiles.length > 0 ? AdditionalFiles : []),
            ...(AgreementFile.content ? [AgreementFile] : [])
            ]
        });

        res.json({
            message: 'success',
            data: info
        });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error sending email" });
    }


};
