import { Response, Request } from "express";
import * as dotenv from "dotenv";
import Busboy from "busboy";
import nodemailer from "nodemailer";

dotenv.config(); // Load environment variables

const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.mailgun.org",
    port: 587,
    secure: false, // true for port 465
    auth: {
        user: process.env.ACCOUNT,
        pass: process.env.PASS,
    },
});

export const postEmail = async (req: Request, res: Response) => {
    try {
        const busboy = Busboy({ headers: req.headers });

        let senders = "";
        let email = "";
        let subject = "";
        let message = "";
        let additionalFiles: { filename: string; content: Buffer }[] = [];
        let embeddedFile: { filename: string; content: Buffer } = { filename: "", content: Buffer.alloc(0) };

        // Menangani field teks
        busboy.on("field", (fieldname, val) => {
            if (fieldname === "senders") senders = val;
            if (fieldname === "email") email = val;
            if (fieldname === "subject") subject = val;
            if (fieldname === "message") message = val;
        });

        // Menangani file upload
        busboy.on("file", (fieldname, file, filename: string) => {
            console.log(`Uploading file: ${filename} )`);
            const buffers: Buffer[] = [];

            file.on("data", (data) => buffers.push(data));
            file.on("end", () => {
                const fileBuffer = Buffer.concat(buffers);
                if (fieldname === "EmbededFile") {
                    embeddedFile = { filename, content: fileBuffer };
                } else {
                    additionalFiles.push({ filename, content: fileBuffer });
                }
            });
        });

        // Setelah semua parsing selesai
        busboy.on("finish", () => {
            try {
                const formattedMessage = message.replace(/\n/g, "<br>");

                const info = transport.sendMail({
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
                        ...additionalFiles,
                        ...(embeddedFile.content ? [embeddedFile] : []),
                    ],
                });

                res.json({ message: "success", data: info });
            } catch (error) {
                console.error("Error sending email:", error);
                res.status(500).json({ message: "Error sending email" });
            }
        });

        req.pipe(busboy);
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
