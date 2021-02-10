const Stream = require('streamx')
const secretstream = require('./' )

class Push extends Stream.Transform {
  constructor (key, opts = {}) {
    super(opts)
    this.name = opts.name

    const header = Buffer.alloc(secretstream.HEADERBYTES)
    this._transport = secretstream.encrypt(header, key)

    this.push(header)
  }

  _transform (data, cb) {
    const tag = secretstream.TAG_MESSAGE
    const ciphertext = this._transport.encrypt(tag, data)

    this.push(ciphertext)
    cb()
  }
}

class Pull extends Stream.Transform {
  constructor (key, opts) {
    super(opts)

    this.key = key
    this._transport = null
  }

  _transform (data, cb) {
    const self = this

    if (this._transport == null) {
      return onheader(data)
    }

    const plaintext = this._transport.decrypt(data)

    let didBackPressure = this.push(plaintext)

    if (this._transport.decrypt.tag.equals(secretstream.TAG_REKEY)) {
      self.emit('rekey')
      if (self.destroyed) return
    }

    if (this._transport.decrypt.tag.equals(secretstream.TAG_FINAL)) {
      self._transportfinished = true
      didBackPressure = self.push(null)
    }

    cb()

    function onheader (header) {
      self._transport = secretstream.decrypt(header, self.key)
    }
  }
}


module.exports = {
  Pull,
  Push
}
