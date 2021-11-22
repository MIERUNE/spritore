import {isAbsolute, join, resolve, basename} from 'path';
import {sync} from 'glob'
import {readFileSync, writeFileSync} from "fs";
import * as sharp from 'sharp';
import {createFiles} from "./generator";


type Img = {
  img: Buffer,
  id: string
}

export type ResizedImg = {
  img: Buffer,
  id: string,
  width: number,
  height: number
}


type GenerateOptions = {
  padding: number;
  inputPath: string;
  outputPath: string;
  outputFileName: string;
}

/**
 *
 * @param padding {number} Padding settings for sprite png
 * @param inputPath {string} Full path of the folder containing the input image files. example: /Users/Kartore/spritore/input
 * @param outputPath {string} Full path of the destination folder where the sprite will be generated. example: /Users/Kartore/spritore/output
 * @param outputFileName {string} Name of the generated sprite. The output will look like [outputFileName].png,[outputFileName].json,[outputFileName]@2x.png,[outputFileName]@2x.json. example: sprite
 */
async function generate({
                          padding = 0,
                          inputPath,
                          outputPath,
                          outputFileName = "sprite"
                        }: GenerateOptions) {
  const imagePadding = 10 + padding
  if (!inputPath) {
    throw new Error("inputPath is required")
  }
  if (!outputPath) {
    throw new Error("outputPath is required")
  }
  if (!isAbsolute(inputPath)) {
    throw new Error("inputPath must be an absolute path")
  }
  if (!isAbsolute(outputPath)) {
    throw new Error("outputPath must be an absolute path")
  }
  const inputFullPath = resolve(join(inputPath, '*'))
  const input: Img[] = sync(inputFullPath).map((f) => {
    return {
      img: readFileSync(f),
      id: basename(f).split('.').shift() ?? basename(f)
    };
  })
  if (!input.length) {
    throw new Error("The input folder must contain at least one image file.")
  }

  const normalImages: ResizedImg[] = []
  const retinaImages: ResizedImg[] = []
  const resizeCreators = input.map(({img, id}) => {
    return new Promise((resolve, reject) => {
      sharp(img).png().toBuffer((error, buffer, info) => {
        if (error)
          reject(new Error("Failed to create normal size image." + id))
        normalImages.push({
          img: buffer,
          id: id,
          width: info.width,
          height: info.height
        })
        resolve(undefined);
        /*
        sharp(img).resize(info.width * 2).png().toBuffer((retinaError, retinaBuffer, retinaInfo) => {
          if (retinaError)
            reject(new Error("Failed to create retina size image." + id))
          retinaImages.push({
            img: retinaBuffer,
            id: id,
            width: retinaInfo.width,
            height: retinaInfo.height
          })
        })*/
      })
    })
  })
  await Promise.all(resizeCreators)
  resizeCreators.length = 0
  await createFiles(imagePadding, normalImages, outputPath, outputFileName)
  normalImages.length = 0
  /*
  await createFiles(imagePadding, retinaImages, outputPath, outputFileName + "@2x")
  retinaImages.length = 0*/
}

export {generate};
export default generate;