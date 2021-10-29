import PdfPrinter from "pdfmake";
import btoa from "btoa";
import fetch from "node-fetch";
import { extname } from "path";
import { pipeline } from "stream";
import { promisify } from "util"; // CORE MODULE
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const fetchIamgeBuffer = async (image) => {
  let result = await fetch(image, {
    responseType: "arraybuffer",
  });
  return result.arrayBuffer();
};

/* const convertImageBase64 = async (data) => {
  let imageBuffer = await fetchImage(data.Poster);

  const base64String = Buffer.from(imageBuffer).toString("base64");

  const posterPath = data.Poster.split("/");

  const fileName = coverPath[posterPath.length - 1];

  const extension = extname(fileName);

  const baseUrl = `data:image/${extension};base64,${base64String}`;

  return baseUrl;
}; */

export const getPDFReadableStream = async (data) => {
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };

  const printer = new PdfPrinter(fonts);

  let imagePart = {};
  if (data.Poster) {
    let imageBufferArray = await fetchIamgeBuffer(data.Poster);
    console.log(imageBufferArray);

    const base64String = btoa(
      String.fromCharCode(...new Uint8Array(imageBufferArray))
    );
    console.log(base64String);

    const posterPath = data.Poster.split("/");
    const fileName = posterPath[posterPath.length - 1];
    const extension = extname(fileName);
    const base64Pdf = `data:image/${extension};base64,${base64String}`;

    imagePart = { image: base64Pdf, width: 500, margin: [0, 0, 0, 40] };
  }

  const docDefinition = {
    content: [
      imagePart,
      { text: data.id, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.title, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.year, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.type, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
      { text: data.createdAt, fontSize: 20, bold: true, margin: [0, 0, 0, 40] },
    ],
    defaultStyle: {
      font: "Helvetica",
    },
  };

  const options = {
    // ...
  };

  const pdfReadableStream = printer.createPdfKitDocument(
    docDefinition,
    options
  );
  // pdfReadableStream.pipe(fs.createWriteStream('document.pdf')); // old syntax for piping
  // pipeline(pdfReadableStream, fs.createWriteStream('document.pdf')) // new syntax for piping (we don't want to pipe pdf into file on disk right now)
  pdfReadableStream.end();
  return pdfReadableStream;
};
