import * as sharp from "sharp";
import {join, resolve} from "path";
import {writeFileSync} from "fs";
import type {ResizedImg} from "./index";

type SpriteJsonType = {
  [key: string]: {
    width: number,
    height: number,
    x: number,
    y: number,
    pixelRatio: 1 | 2,
  }
}

async function createFiles(imagePadding: number, normalImages: ResizedImg[], outputPath: string, outputFileName:string) {

  const sortedImages: ResizedImg[] = normalImages.sort((a, b) => {
    return b.height - a.height
  })
  let spriteJson: SpriteJsonType = {}
  let x = imagePadding;
  let y = imagePadding;
  let initWidth = Math.ceil(Math.sqrt(sortedImages.reduce((a,b)=> a + (b.width+imagePadding) * (b.height + imagePadding), 0)));
  const maxWidth = Math.ceil(sortedImages.reduce((a,b)=> a.width>b.width ? a : b).width) + imagePadding
  if (initWidth < maxWidth) {
    initWidth = maxWidth
  }
  let height = 0
  let nowYList: number[] = []
  const compositeImages: sharp.OverlayOptions[] = sortedImages.map((value, i) => {
    if (x + value.width + imagePadding > initWidth) {
      y += nowYList.reduce((a,b)=>a>b?a:b) + imagePadding
      x = imagePadding
      height = y
      nowYList = []
    }
    spriteJson[value.id] = {
      width: value.width,
      height: value.height,
      x,
      y,
      pixelRatio: 1
    }
    const response = {
      input: value.img,
      left: x,
      top: y
    }
    x += value.width + imagePadding
    nowYList.push(value.height)
    if (sortedImages.length === i + 1) {
      height += nowYList.reduce((a,b)=>a>b?a:b) + imagePadding
    }
    return response
  })
  const file = await sharp({
    create: {
      width: height < initWidth ? initWidth : height,
      height: height < initWidth ? initWidth : height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  await file.composite(compositeImages).png().toFile(resolve(join(outputPath, `${outputFileName}.png`)))
  writeFileSync(resolve(join(outputPath, `${outputFileName}.json`)), JSON.stringify(spriteJson));
}

export {createFiles}