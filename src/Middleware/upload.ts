import { RequestHandler } from "express-serve-static-core";
import multer, { Field, Options, StorageEngine, diskStorage, memoryStorage } from "multer";
import path from "path";

export const multerDisk = diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/files");
  },
  filename: (req, file, cb) => {
    // misal: image-timestamp.{jpg|png|jpeg}
    const extName = path.extname(file.originalname);
    const newFileName = `image-${Date.now()}${extName}`;
    cb(null, newFileName);
  },
});

const multerMemory = memoryStorage();

export const createMulterOptions = (storageEngine: StorageEngine): Options => ({
  storage: storageEngine,
  limits: {
    fileSize: 1e6, // 1000000
  }
});

const uploader = multer(createMulterOptions(multerDisk));
const cloudUploader = multer(createMulterOptions(multerMemory));

export const singleUploader = (fieldName: string) => uploader.single(fieldName) as RequestHandler;
export const multiUploader = (fieldName: string, maxCount: number) => uploader.array(fieldName, maxCount);
export const multiFieldUploader = (fieldConfig: Field[]) => uploader.fields(fieldConfig);

export const singleCloudUploader = (fieldName: string) => cloudUploader.single(fieldName) as RequestHandler;
export const multiCloudUploader = (fieldName: string, maxCount: number) => cloudUploader.array(fieldName, maxCount);
export const multiFieldCloudUploader = (fieldConfig: Field[]) => cloudUploader.fields(fieldConfig);
