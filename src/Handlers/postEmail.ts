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

        let AdditionalFiles: { filename: string; content: any }[] = [];
        if (req.files && 'AdditionalFiles' in req.files) {
            AdditionalFiles = (req.files.AdditionalFiles as any[]).map((file: any) => ({
                filename: file.originalname,
                content: file.buffer
            }));
        }

        const EmbededFile = req.files && 'EmbededFile' in req.files
            ? {
                filename: 'EmbededFile.pdf',
                content: (req.files.EmbededFile as any[])[0]?.buffer || null
            }
            : { filename: '', content: null };

        console.log('ini attach 1 2:', EmbededFile, AdditionalFiles);

        const formattedMessage = message.replace(/\n/g, '<br>'); // Convert new lines to <br>

        const info = await transport.sendMail({
            from: senders,
            to: email,
            subject: subject,
            text: message,
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
            `,
            attachments: [
                ...(AdditionalFiles.length > 0 ? AdditionalFiles : []),
                ...(EmbededFile.content ? [EmbededFile] : [])
            ]
        });

        res.json({
            message: 'success',
            data: info
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error sending email" });
    }
};
