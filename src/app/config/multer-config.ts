// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { cloudinaryUpload } from "./cloudinary.config";
// import multer from "multer";

// const removeExtension = (filename: string) => {
//   return filename.split(".").slice(0, -1).join(".");
// };

// // const storage = new CloudinaryStorage({
// //   cloudinary: cloudinaryUpload,
// //   params: {
// //     public_id: (_req, file) =>
// //       Math.random().toString(36).substring(2) +
// //       "-" +
// //       Date.now() +
// //       "-" +
// //       file.fieldname +
// //       "-" +
// //       removeExtension(file.originalname),
// //   },
// // }); 

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinaryUpload,
//   params: async (_req, file) => {
//     let resourceType = "image"; 
//     let folder = "images";

//     if (file.mimetype === "application/pdf") {
//       resourceType = "raw";
//       folder = "pdfs";
//     }

//     const ext = file.mimetype.split("/")[1]; // pdf, png, jpg

//     return {
//       folder,
//       resource_type: resourceType,
//       public_id:
//         Math.random().toString(36).substring(2) +
//         "-" +
//         Date.now() +
//         "-" +
//         file.fieldname +
//         "-" +
//         removeExtension(file.originalname) +
//         "." + ext, // add proper extension
//     };
//   },
// });
// export const multerUpload = multer({ storage: storage });
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";

// Image upload configuration
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: (req, file) => {
    return {
      folder: "uploads/images",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
      public_id: `img_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };
  },
});

// PDF upload configuration  
const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: (req, file) => {
    return {
      folder: "uploads/pdfs",
      resource_type: "raw",
      allowed_formats: ["pdf"],
      public_id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };
  },
});

// Image uploader
export const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for images
  },
  fileFilter: (req, file, cb) => {
    const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed") as unknown as null, false);
    }
  },
});

// PDF uploader
export const pdfUpload = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for PDFs
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed") as unknown as null, false);
    }
  },
});