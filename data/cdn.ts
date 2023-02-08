import cloudinary from 'cloudinary'
import env from 'env-var';
import {
  SolidarityAction,
  SolidarityActionAirtableRecord,
  AirtableCDNMap
} from './types';
import {
  ensureArray
} from '../utils/string';
import {
  solidarityActionBase
} from './solidarityAction';
import {
  chunk
} from 'lodash';

export async function syncSolidarityActionsToCDN(_action: SolidarityAction | SolidarityAction[]) {
  const actions = ensureArray(_action)
  const updateList: Array<{
    id: string,
    fields: Partial<SolidarityActionAirtableRecord['fields']>
  }> = []
  for (const action of actions) {
    if (action.fields.Document?.length) {
      // Synchronise Docs and CDN Map column
      const missingCDNMapEntry = action.fields.Document!.some(doc => !action.cdnMap.find(cdn => cdn.airtableDocID === doc.id))
      const invalidCDNMapEntry = action.cdnMap.some(cdn => !action.fields.Document!.find(doc => doc.id === cdn.airtableDocID))
      if (missingCDNMapEntry || invalidCDNMapEntry) {
        // There's a mismatch between the docs and the CDN map, so we need to re-sync
        // First upload the docs to the CDN
        const cdnPayload = await uploadSolidarityActionAttachmentsToCDN(action)
        // Then sync the public URLs back to Airtable
        if (cdnPayload.length > 0) {
          updateList.push({
            id: action.id,
            fields: {
              cdn_urls: JSON.stringify(cdnPayload)
            }
          })
        }
      }
    } else if (action.fields.cdn_urls) {
      // Clear CDNs to reflect the fact there are no docs
      updateList.push({
        id: action.id,
        fields: {
          cdn_urls: "[]"
        }
      })
    }
  }
  let recordsUpdated = 0
  for (const chunkedUpdate of chunk(updateList, 10)) {
    recordsUpdated += (await updateSolidarityActions(chunkedUpdate)).length
  }
  return recordsUpdated
}

async function uploadSolidarityActionAttachmentsToCDN(action: SolidarityAction) {
  const cdnMap: AirtableCDNMap[] = []
  for (const doc of (action.fields?.Document || [])) {
    try {
      const [original, thumbnail] = await Promise.all([
        uploadToCDN(doc.url, `${doc.id}-${doc.filename}`),
        uploadToCDN(doc.thumbnails.large.url, `${doc.id}-${doc.filename}-thumbnail`)
      ])
      if (!!original && !!thumbnail) {
        cdnMap.push({
          filename: doc.filename,
          filetype: doc.type,
          airtableDocID: doc.id,
          downloadURL: original.url,
          thumbnailURL: thumbnail.url,
          thumbnailWidth: thumbnail.width,
          thumbnailHeight: thumbnail.height,
        })
      }
    } catch (e) {
      console.error(`Failed to upload ${doc.url} to CDN`, e)
    }
  }
  return cdnMap
}

export async function uploadToCDN(url: string, filename?: string) {
  return uploadToCloudinary(url, filename)
}

export async function uploadToCloudinary(url: string, filename?: string) {
  await cloudinary.v2.config({
    cloud_name: env.get('CLOUDINARY_NAME').required().asString(),
    api_key: env.get('CLOUDINARY_API_KEY').required().asString(),
    api_secret: env.get('CLOUDINARY_API_SECRET').required().asString(),
    secure: true
  });

  const config: cloudinary.UploadApiOptions = {
    use_filename: true
  }

  // Replace existing files rather than upload a duplicate
  // Docs: https://support.cloudinary.com/hc/en-us/articles/202520852-How-can-I-update-an-already-uploaded-image-
  if (filename) {
    config.public_id = filename
  }

  if (filename) {
    const ext = filename.split('.').pop()!
    const extSupport = cloudinaryFileExtensionSupport[ext]
    if (!extSupport || !extSupport.transform || !extSupport.upload) {
      config.resource_type = 'raw'
    }
  }

  return new Promise<cloudinary.UploadApiResponse | undefined>((resolve, reject) => {
    cloudinary.v2.uploader.upload(url, config, (error, result) => {
      if (error) {
        return reject(error)
      }
      return resolve(result)
    });
  })
}

async function updateSolidarityActions(updates: any[]) {
  return new Promise<SolidarityActionAirtableRecord[]>((resolve, reject) => {
    solidarityActionBase().update(updates, function (err, records) {
      if (err) {
        reject(err)
      }
      resolve(records)
    });
  })
}

// https://cloudinary.com/documentation/image_transformations#supported_image_formats
const cloudinaryFileExtensionSupport: { [ext: string]: { upload: boolean, transform: boolean } } = {
  "ai": {
    "upload": true,
    "transform": true
  },
  "avif": {
    "upload": false,
    "transform": true
  },
  "gif": {
    "upload": true,
    "transform": true
  },
  "png": {
    "upload": true,
    "transform": true
  },
  "webp": {
    "upload": true,
    "transform": true
  },
  "bmp": {
    "upload": true,
    "transform": true
  },
  "bw": {
    "upload": true,
    "transform": true
  },
  "djvu": {
    "upload": true,
    "transform": false
  },
  "ps": {
    "upload": true,
    "transform": true
  },
  "ept": {
    "upload": true,
    "transform": true
  },
  "eps": {
    "upload": true,
    "transform": true
  },
  "eps3": {
    "upload": true,
    "transform": true
  },
  "fbx": {
    "upload": true,
    "transform": true
  },
  "flif": {
    "upload": true,
    "transform": true
  },
  "heif": {
    "upload": true,
    "transform": true
  },
  "heic": {
    "upload": true,
    "transform": true
  },
  "ico": {
    "upload": true,
    "transform": true
  },
  "indd": {
    "upload": true,
    "transform": true
  },
  "jpg": {
    "upload": true,
    "transform": true
  },
  "jpe": {
    "upload": true,
    "transform": true
  },
  "jpeg": {
    "upload": true,
    "transform": true
  },
  "jp2": {
    "upload": true,
    "transform": true
  },
  "wdp": {
    "upload": true,
    "transform": true
  },
  "jxr": {
    "upload": true,
    "transform": true
  },
  "hdp": {
    "upload": true,
    "transform": true
  },
  "obj": {
    "upload": true,
    "transform": true
  },
  "pdf": {
    "upload": true,
    "transform": true
  },
  "ply": {
    "upload": true,
    "transform": true
  },
  "psd": {
    "upload": true,
    "transform": true
  },
  "arw": {
    "upload": true,
    "transform": false
  },
  "cr2": {
    "upload": true,
    "transform": false
  },
  "svg": {
    "upload": true,
    "transform": true
  },
  "tga": {
    "upload": true,
    "transform": true
  },
  "tif": {
    "upload": true,
    "transform": true
  },
  "tiff": {
    "upload": true,
    "transform": true
  },
  "u3ma": {
    "upload": true,
    "transform": true
  },
  "usdz": {
    "upload": true,
    "transform": false
  }
}