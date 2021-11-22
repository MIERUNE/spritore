import { basename, isAbsolute, join, resolve } from 'path';
import { sync } from 'glob';
import { readFileSync } from 'fs';
import * as sharp from 'sharp';
import { createFiles } from './generator.js';

type Img = {
  img: Buffer;
  id: string;
};

export type ResizedImg = {
  img: Buffer;
  id: string;
  width: number;
  height: number;
};

type GenerateOptions = {
  padding: number;
  inputPath: string;
  outputPath: string;
  outputFileName: string;
};

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
  outputFileName = 'sprite',
}: GenerateOptions) {
  const imagePadding = 10 + padding;
  if (!inputPath) {
    throw new Error('inputPath is required');
  }
  if (!outputPath) {
    throw new Error('outputPath is required');
  }
  if (!isAbsolute(inputPath)) {
    throw new Error('inputPath must be an absolute path');
  }
  if (!isAbsolute(outputPath)) {
    throw new Error('outputPath must be an absolute path');
  }
  const inputFullPath = resolve(join(inputPath, '*'));
  const input: Img[] = sync(inputFullPath).map((f) => {
    return {
      img: readFileSync(f),
      id: basename(f).split('.').shift() ?? basename(f),
    };
  });
  if (!input.length) {
    throw new Error('The input folder must contain at least one image file.');
  }

  const retinaImages: ResizedImg[] = [];
  const normalImagesPromise = input.map(({ img, id }) => {
    return (async (img, id) => {
      const s1x = await sharp(img).ensureAlpha().png().raw().toBuffer({ resolveWithObject: true });
      const s2x = await sharp(img)
        .resize(s1x.info.width * 2)
        .ensureAlpha()
        .png()
        .raw()
        .toBuffer({ resolveWithObject: true });
      retinaImages.push({
        img: s2x.data,
        id: id,
        width: s2x.info.width,
        height: s2x.info.height,
      });
      return {
        img: s1x.data,
        id: id,
        width: s1x.info.width,
        height: s1x.info.height,
      };
    })(img, id);
  });
  const normalImages = await Promise.all(normalImagesPromise);
  await createFiles(imagePadding, normalImages, outputPath, outputFileName, false);
  await createFiles(imagePadding, retinaImages, outputPath, outputFileName + '@2x', true);
}

export { generate };
export default generate;
