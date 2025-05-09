import { Response, Request } from "express";
import * as dotenv from 'dotenv';
import { KintoneRestAPIClient } from "@kintone/rest-api-client";
dotenv.config();  // Env load environment variables

const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
    // service: "gmail",
    host: "smtp.mailgun.org",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.ACCOUNT, // generated ethereal user
        pass: process.env.PASS, // generated ethereal password
    },
});

const client = new KintoneRestAPIClient({
    baseUrl: process.env.BASE_URL,  
    auth: {
        apiToken: process.env.API_TOKEN, 
    },
});

export const kintoneUploader = async (req: Request): Promise<boolean> => {
    try {
      const {
        email,
        subject,
        message,
        Record_Number_App,
        Application_Name,
        User,
        Title
      } = req.body;
      
      const embeddedFile = req.files && 'EmbededFile' in req.files
        ? (req.files['EmbededFile'] as any[])[0]
        : null;
  
      let fileKey: string | null = null;
  
      if (embeddedFile && embeddedFile.buffer) {
        const uploadResponse = await client.file.uploadFile({
          file: {
            name: 'EmbededFile.pdf',
            data: embeddedFile.buffer,
          },
        });
        fileKey = uploadResponse.fileKey;
      }
      
      const recordPayload: any = {
        Record_Number_App: { value: Record_Number_App },
        Application_Name: { value: Application_Name },
        To: { value: email },
        Subject: { value: subject },
        Messages: { value: message },
        User_Send: { 
          value: [
            {
              code : User
            }
          ] 
        },
      };
      
      if (fileKey) {
        recordPayload.Attachment_Document = {
          value: [{ fileKey }],
        };
      }
      
      await client.record.addRecord({
        app: '41', 
        record: recordPayload,
      });
  
      return true;
    } catch (error) {
      console.error('Gagal upload ke Kintone: ', error);
      return false;
    }
  };

export const postEmail = async (req: Request, res: Response) => {
    try {
        const { email, subject, message, Title } = req.body;
        console.log('ini body:', req.body);
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

        if(EmbededFile.content) {
            await kintoneUploader(req).then((result) => {
                if (!result) {
                    throw new Error('failed to upload kintone');
                }
            })
        }

        /**
         * overwwrite file name with fieldCode FileName, FileName get from params
         */

        const info = await transport.sendMail({
            from: process.env.ACCOUNT,
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
                ...(AdditionalFiles.length > 0 ? AdditionalFiles : [])
                // ...(EmbededFile.content ? [EmbededFile] : [])
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


