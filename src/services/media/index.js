import express from "express";
import { getMedias, writeMedias } from "../../lib/media-tools.js";
import multer from "multer";
import uniqid from "uniqid";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { pipeline } from "stream";
import { getPDFReadableStream } from "../../lib/pdf-tools.js";

const mediaRouter = express.Router();

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "weenix-netflix",
  },
});

mediaRouter.post(
  "/",
  /*  multer().single("picture"), */ async (req, res, next) => {
    try {
      /* cover = req.file.path; */
      const newMedia = {
        ...req.body,
        /*    Poster: cover, */
        reviews: [],
        createdAt: new Date(),
        imdbID: uniqid(),
      };
      const medias = await getMedias();
      medias.push(newMedia);

      await writeMedias(medias);
      res.status(201).send(newMedia);
    } catch (error) {
      next(error);
    }
  }
);

mediaRouter.post(
  "/uploadCloudinary",
  multer({ storage: cloudinaryStorage }).single("poster"),
  async (req, res, next) => {
    try {
      console.log("REQ FILE ", req.file);

      const pictureUrl = req.file.path;
      const newMedia = {
        ...req.body,
        Poster: pictureUrl,
        reviews: [],
        createdAt: new Date(),
        imdbID: uniqid(),
      };
      const medias = await getMedias();
      medias.push(newMedia);

      await writeMedias(medias);

      res.status(201).send(newMedia);
    } catch (error) {
      next(error);
    }
  }
);

/* mediaRouter.get("/", async (req, res, next) => {
  try {
    const medias = await getMedias();
    res.status(200).send(medias);
  } catch (error) {
    console.log(error);
    next(error);
  }
}); */

mediaRouter.get("/", async (req, res, next) => {
  try {
    console.log(req.body);
    const medias = await getMedias();
    console.log(medias);
    if (req.query && req.query.s) {
      const filteredMedias = medias.filter(
        (media) => media.title === req.query.s
      );
      res.send(filteredMedias);
    }
    res.send(medias);
  } catch (error) {
    next(error);
  }
});

mediaRouter.get("/:mediaId", async (req, res, next) => {
  try {
    const medias = await getMedias();

    const media = medias.find((b) => b.imdbID === req.params.mediaId);

    if (media) {
      res.send(media);
    } else {
      next(
        createHttpError(404, `media with id ${req.params.mediaId} not found`)
      );
    }
  } catch (error) {
    next(error);
  }
});

mediaRouter.get("/:mediaId/downloadPDF", async (req, res, next) => {
  try {
    const medias = await getMedias();

    const media = medias.find((media) => media.imdbID === req.params.mediaId);

    res.setHeader("Content-Disposition", "attachment; filename=blogPost.pdf"); // This header tells the browser to do not open the file, but to download it

    const source = await getPDFReadableStream(media); // PDF READABLE STREAM
    const destination = res;

    pipeline(source, destination, (err) => {
      if (err) next(err);
    });
  } catch (error) {
    next(error);
  }
});

mediaRouter.put("/:mediaId", async (req, res, next) => {
  try {
    const medias = await getMedias();

    const index = medias.findIndex(
      (media) => media.imdbID === req.params.mediaId
    );

    const mediaToModify = medias[index];
    const updatedFields = req.body;

    const updatedMedia = {
      ...mediaToModify,
      ...updatedFields,
      updatedAt: new Date(),
      imdbID: req.params.mediaId,
    };

    medias[index] = updatedMedia;

    await writeMedias(medias);

    res.send(updatedMedia);
  } catch (error) {
    next(error);
  }
});

mediaRouter.post("/:mediaId/review", async (req, res, next) => {
  try {
    const { comment, rate } = req.body;

    (media) => media.elementId === req.params.mediaId;
    const review = {
      id: uniqid(),
      comment,
      rate,
      elementId: req.params.mediaId,
      createdAt: new Date(),
    };

    const medias = await getMedias();

    const index = medias.findIndex(
      (media) => media.imdbID === req.params.mediaId
    );

    /*     medias[index].reviews = medias[index].reviews || []; */

    const modifiedMedia = medias[index];

    modifiedMedia.reviews.push(review);
    console.log(modifiedMedia);

    medias[index] = modifiedMedia;

    await writeMedias(medias);

    res.send(modifiedMedia);
  } catch (error) {
    next(error);
  }
});

mediaRouter.delete("/:mediaId", async (req, res, next) => {
  try {
    const medias = await getMedias();

    const remainingMedia = medias.filter(
      (media) => media.imdbID !== req.params.mediaId
    );

    await writeMedias(remainingMedia);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/* mediaRouter.delete("/:mediaId/review/:reviewId", async (req, res, next) => {
  try {
    const medias = await getMedias();
    // FINDING A MEDIA BY ID
    const singleMedia = medias.find((s) => s.imdbID === req.params.mediaId);
    console.log("here is singleMedia", singleMedia);
    const index = medias.findIndex((s) => s.imdbID === req.params.mediaId);
    // FILTERING BY ID AND RETURNING THE REVIEWS LEFT

    const remainingReview = medias.filter(
      (review) => review.imdbID !== req.params.reviewId
    );
    // ASSIGNING BLOG POST COMMENT ARRAY THE REVIEWS LEFT AFTER DELETING THE COMMENT
    singleMedia.reviews = remainingReview;

    console.log(remainingReview);
    // ASSINGING THE INDEX OF THE REVIEW WE NEED TO DELETE
    medias[index] = singleMedia;
    // WRITING BACK TO THE MEDIA ARRAY(DISK) TO SAVE THE UPDATED INFO

    await writeMedias(medias);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}); */

mediaRouter.delete("/:mediaId/review/:reviewId", async (req, res, next) => {
  try {
    const medias = await getMedias();
    // FINDING A MEDIA BY ID
    const singleMedia = medias.find((p) => p.imdbID === req.params.mediaId);
    // GETTING THE INDEX OF THE MEDIA ID WE WANT TO DELETE
    const index = medias.findIndex((p) => p.imdbID === req.params.mediaId);
    // FILTERING BY ID AND RETURNING THE REVIEWS LEFT
    const review = singleMedia.reviews.filter(
      (r) => r.elementId !== req.params.reviewId
    );
    // ASSIGNING BLOG POST COMMENT ARRAY THE REVIEWS LEFT AFTER DELETING THE COMMENT
    singleMedia.reviews = review;
    console.log(review);
    // ASSINGING THE INDEX OF THE REVIEW WE NEED TO DELETE
    medias[index] = singleMedia;
    // WRITING BACK TO THE MEDIA ARRAY(DISK) TO SAVE THE UPDATED INFO
    await writeMedias(medias);
    res.status(204).send();
    console.log("Review Deleted ---->", review);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

export default mediaRouter;
