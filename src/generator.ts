import * as sharp from "sharp";
import {join, resolve} from "path";
import {writeFileSync} from "fs";
import type {ResizedImg} from "./index";
import * as Buffer from "buffer";

type SpriteJsonType = {
  [key: string]: {
    width: number,
    height: number,
    x: number,
    y: number,
    pixelRatio: 1 | 2,
  }
}

type RectType = {
  input: Buffer,
  rect: { x: number, y: number, w: number, h:number },
  id: string
}

function copyImage(rect: RectType, buf: Buffer, bufDims:{w: number, h: number}) {
  const r = { ...rect.rect };

  function pxi(a: [x: number, y: number], dims: {w: number, h: number}) {
    const [x, y] = a;
    return y * (dims.w * 4) + (x * 4);
  }

  function copyPx(toBuffer: Buffer, toP: [x: number, y: number], fromBuffer: Buffer, fromP: [x: number, y: number]) {
    let fromI = pxi(fromP, r);

    if (fromI < fromBuffer.length) {
      toBuffer.writeUInt32LE(fromBuffer.readUInt32LE(fromI), pxi(toP, bufDims));
    }
  }

  for (let x = 0; x < r.w; ++x) {
    for (let y = 0; y < r.h; ++y) {
      copyPx(buf, [r.x + x, r.y + y], rect.input, [x, y]);
    }
  }
}
// CompositeでCopyするとStack Overflowするためピクセルバッファでコピー
function copyImages(bin: {w: number, h: number},images: RectType[], buf: Buffer) {

  for (let i = 0; i < images.length; ++i) {
    copyImage(images[i], buf, bin);
  }
}


async function createFiles(imagePadding: number, normalImages: ResizedImg[], outputPath: string, outputFileName:string, is2x: boolean) {

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
  const compositeImages: RectType[] = sortedImages.map((value, i) => {
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
      pixelRatio: is2x ? 2: 1
    }
    const response: RectType = {
      input: value.img,
      rect: { x: x, y: y, w: value.width, h: value.height },
      id: value.id
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
  }).raw().toBuffer()
  const bin = {w:height < initWidth ? initWidth : height , h: height < initWidth ? initWidth : height}
  copyImages(bin, compositeImages, file)
  await sharp(file, {
    raw: {
      width: bin.w,
      height: bin.h,
      channels: 4,
    }
  }).png().toFile(resolve(join(outputPath, `${outputFileName}.png`)))
  writeFileSync(resolve(join(outputPath, `${outputFileName}.json`)), JSON.stringify(spriteJson));
}

export {createFiles}
