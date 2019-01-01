/* global chrome, require */

function decodeImage (imageUrl) {
  return new Promise((resolve, reject) => {
    const qr = new window.QrCode()
    qr.callback = (err, result) => {
      if (err) {
        if (err instanceof Error) {
          reject(err)
        } else {
          reject(new Error(err))
        }
      } else {
        resolve(result.result)
      }
    }
    qr.decode(imageUrl)
  })
}

function notifySuccess (text) {
  copyResult(text)
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'SUCCESS!',
    message: text,
    contextMessage: 'The result copied to your clipboard.'
  })
}

function notifyFailure (err) {
  console.warn('Failed to decode qrcode, ', err)
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'GOT SOMETHING WRONG!',
    message: 'It seems the qrcode image is invalid.'
  })
}

function copyResult (text) {
  var input = document.createElement('textarea')
  document.body.appendChild(input)
  input.value = text
  input.focus()
  input.select()
  document.execCommand('Copy')
  input.remove()
}

function decodeImageData (imageData) {
  decodeImage(imageData)
    .then(text => notifySuccess(text))
    .catch(err => notifyFailure(err))
}

function fetchImageData (tab, imageUrl) {
  const image = new window.Image()
  image.crossOrigin = 'Anonymous'
  image.onload = function () {
    const canvas = document.createElement('canvas')
    canvas.width = this.naturalWidth
    canvas.height = this.naturalHeight
    canvas.getContext('2d').drawImage(this, 0, 0)
    decodeImageData(canvas.toDataURL('image/png'))
  }
  image.src = imageUrl
}

chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: 'decode',
    title: 'Decode QR Image',
    contexts: ['image']
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'decode') {
    const imageUrl = info.srcUrl
    if (/data:image\/.*/.test(imageUrl)) {
      decodeImageData(imageUrl)
    } else {
      fetchImageData(tab, imageUrl)
    }
  }
})
