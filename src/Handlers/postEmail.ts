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
      File_Name,
      Link_Record
    } = req.body;

    // Ambil file dari req.files sesuai dengan multer.fields()
    const embeddedFile = req.files && 'EmbededFile' in req.files
      ? (req.files['EmbededFile'] as Express.Multer.File[])[0]
      : null;

    const additionalFiles = req.files && 'AdditionalFiles' in req.files
      ? (req.files['AdditionalFiles'] as Express.Multer.File[])
      : [];

    let fileKey: { fileKey: string }[] = [];

    
    if (embeddedFile?.buffer) {
      const uploadResponse = await client.file.uploadFile({
        file: {
          name: embeddedFile.originalname || `${File_Name}.pdf`,
          data: embeddedFile.buffer,
        },
      });
      fileKey.push({ fileKey: uploadResponse.fileKey });
    }

    
    for (const file of additionalFiles) {
      const uploadResponse = await client.file.uploadFile({
        file: {
          name: file.originalname,
          data: file.buffer,
        },
      });
      fileKey.push({ fileKey: uploadResponse.fileKey });
    }

    
    const recordPayload: any = {
      Record_Number_App: { value: Record_Number_App },
      Application_Name: { value: Application_Name },
      To: { value: email },
      Subject: { value: subject },
      Messages: { value: message },
      Link_Record: { value: Link_Record },
      User_Send: {
        value: [
          {
            code: User
          }
        ]
      }
    };

    
    if (fileKey.length > 0) {
      recordPayload.Attachment_Document = {
        value: fileKey,
      };
    }

    console.log(recordPayload);

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
    const { email, subject, message } = req.body;

    // Ambil AdditionalFiles dari req.files
    const AdditionalFiles = req.files && 'AdditionalFiles' in req.files
      ? (req.files['AdditionalFiles'] as Express.Multer.File[]).map(file => ({
          filename: file.originalname,
          content: file.buffer
        }))
      : [];

    // Ambil EmbededFile dari req.files
    const EmbededFile = req.files && 'EmbededFile' in req.files
      ? {
          filename: (req.files['EmbededFile'] as Express.Multer.File[])[0]?.originalname || 'EmbededFile',
          content: (req.files['EmbededFile'] as Express.Multer.File[])[0]?.buffer || null
        }
      : { filename: '', content: null };

    const formattedMessage = message.replace(/\n/g, '<br>');

    // Upload ke Kintone
    const uploaded = await kintoneUploader(req);
    if (!uploaded) {
      throw new Error('Failed to upload to Kintone');
    }

    // Kirim email
    const info = await transport.sendMail({
      from: process.env.ACCOUNT,
      to: email,
      subject,
      text: message,
      html: `
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { padding: 20px; }
            .message { margin-top: 10px; }
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
        ...AdditionalFiles,
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



